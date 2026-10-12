const { randomUUID } = require('node:crypto');
const { listTools, queryPayload, validateTool } = require('./toolCatalog');
const { CHUNK_CHARACTERS, ACCOUNT_READ_TOOLS } = require('./resultChunks');

function toolResult(body, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(body) }], structuredContent: body, isError };
}

function createToolHandlers({ identity: fixedIdentity, getIdentity = async () => fixedIdentity, secret,
  requestId: fixedRequestId, dataApi, jobApi, managementApi, accountReads, resultStore, onCall = () => {}, chunkResults = true }) {
  async function list() {
    const tools = listTools((await getIdentity()).scopes);
    return { tools: chunkResults ? tools : tools.filter(tool => tool.name !== 'get_result') };
  }
  async function call({ name, arguments: args = {} }) {
    if (!chunkResults && name === 'get_result') {
      return toolResult({ code: 'unknown_tool', message: 'get_result is only available in a persistent MCP session. CLI calls return complete JSON.' }, true);
    }
    const identity = await getIdentity();
    const requestId = fixedRequestId || `req_${randomUUID()}`;
    const invalid = validateTool(name, args);
    if (invalid) return toolResult(invalid, true);
    const scopes = name === 'submit_batch' ? [...new Set(args.queries.map((item) => item.source))]
      : ['get_pricing', 'get_usage'].includes(name) ? (args.source ? [args.source] : [])
        : ['get_job', 'get_result', ...ACCOUNT_READ_TOOLS].includes(name) ? [] : [name];
    if (!scopes.every((scope) => identity.scopes.includes(scope))) {
      return toolResult({ code: 'source_forbidden', message: 'The API Key does not grant this source.' }, true);
    }
    onCall(name);
    if (name === 'get_result') {
      try {
        const chunk = await resultStore.read(identity, args.result_id, args.offset ?? 0, args.limit ?? CHUNK_CHARACTERS);
        return chunk ? toolResult(chunk) : toolResult({ code: 'result_unavailable', message: 'Result expired, evicted, inaccessible, or offset is outside the result.' }, true);
      } catch {
        return toolResult({ code: 'result_store_unavailable', message: 'Result storage is temporarily unavailable. Retry this read.' }, true);
      }
    }
    let response;
    if (ACCOUNT_READ_TOOLS.includes(name)) {
      response = await accountReads.read(name, identity, args);
    } else if (name === 'get_usage') {
      const query = new URLSearchParams(args).toString();
      response = await managementApi.request({ method: 'GET', path: `/v2/usage${query ? `?${query}` : ''}`, secret, requestId });
    } else if (name === 'get_job') {
      response = await jobApi.read({ jobId: args.job_id, secret, requestId, identity });
    } else {
      const request = name === 'submit_batch'
        ? { method: 'POST', path: '/v1/queries/batch', body: { queries: args.queries.map((item) => queryPayload(item.source, item)) } }
        : { method: 'POST', path: (name === 'youtube_download' || args.mode === 'async') ? '/v1/queries' : '/v1/queries/realtime', body: queryPayload(name, args) };
      response = await dataApi.request({ ...request, secret, requestId });
    }
    const isError = response.status >= 300 || response.body.status === 'failed' || response.body.job?.status === 'failed';
    const body = { ...response.body, http_status: response.status, request_id: requestId };
    if (!chunkResults || ACCOUNT_READ_TOOLS.includes(name) || name === 'get_usage') return toolResult(body, isError);
    if (JSON.stringify(body).length <= CHUNK_CHARACTERS) return toolResult(body, isError);
    try {
      const resultScopes = name === 'get_job' && response.body.job?.source ? [response.body.job.source] : scopes;
      const chunk = await resultStore.save(identity, body, resultScopes);
      return toolResult({ ...chunk, http_status: response.status, request_id: requestId, usage: body.usage,
        message: 'Large response. Use get_result with result_id and next_offset to read the remaining JSON. Do not repeat the paid query.' }, isError);
    } catch {
      return toolResult({ code: 'result_delivery_failed', http_status: response.status, request_id: requestId,
        job_id: body.id || body.job?.id, usage: body.usage || (body.job ? { credits: body.job.credits } : undefined),
        message: 'The upstream request finished, but its large result could not be cached. Work may have been charged. Read the job if an id is available; otherwise check Jobs before submitting again.' }, true);
    }
  }
  return { list, call };
}

module.exports = { createToolHandlers };
