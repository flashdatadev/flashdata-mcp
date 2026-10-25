const { randomUUID } = require('node:crypto');
const { listTools, queryPayload, validateTool } = require('./toolCatalog');
const { CHUNK_CHARACTERS, ACCOUNT_READ_TOOLS } = require('./resultChunks');
const { assertTaskSource, listTaskTools } = require('./taskTools');
const { present } = require('./presentation');

function toolResult(body, isError = false, format = 'json') {
  const text = body.result_id && typeof body.chunk === 'string' && body.encoding !== 'json'
    ? body.chunk : present(body, format);
  return { content: [{ type: 'text', text }], structuredContent: body, isError };
}

function createToolHandlers({ identity: fixedIdentity, getIdentity = async () => fixedIdentity, secret,
  requestId: fixedRequestId, dataApi, jobApi, managementApi, accountReads, resultStore, onCall = () => {}, chunkResults = true,
  taskSource }) {
  if (taskSource !== undefined) assertTaskSource(taskSource);
  async function list() {
    const scopes = (await getIdentity()).scopes;
    const tools = taskSource ? listTaskTools(taskSource, scopes) : listTools(scopes);
    return { tools: chunkResults ? tools : tools.filter(tool => tool.name !== 'get_result').map(tool => ({
      ...tool, inputSchema: { ...tool.inputSchema, properties: { ...tool.inputSchema.properties,
        response_format: { ...tool.inputSchema.properties.response_format, default: 'json' },
      } },
    })) };
  }
  async function call({ name, arguments: args = {} }) {
    if (!chunkResults && name === 'get_result') {
      return toolResult({ code: 'unknown_tool', message: 'get_result is only available in a persistent MCP session. CLI calls return complete JSON.' }, true);
    }
    const grantedIdentity = await getIdentity();
    const identity = taskSource ? { ...grantedIdentity, scopes: grantedIdentity.scopes.filter(source => source === taskSource) } : grantedIdentity;
    if (taskSource && !listTaskTools(taskSource, identity.scopes).some(tool => tool.name === name)) {
      return toolResult({ code: 'source_forbidden', message: 'This task server and API Key do not grant this tool.' }, true);
    }
    const requestId = fixedRequestId || `req_${randomUUID()}`;
    const invalid = validateTool(name, args);
    if (invalid) return toolResult(invalid, true);
    const { response_format: selectedFormat, ...apiArgs } = args;
    let format = selectedFormat || (chunkResults ? 'markdown' : 'json');
    args = apiArgs;
    if (taskSource && name === 'get_pricing' && args.source === undefined) args = { ...args, source: taskSource };
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
      response = await jobApi.read({ jobId: args.job_id, secret, requestId, identity, allowedSource: taskSource });
    } else {
      const request = name === 'submit_batch'
        ? { method: 'POST', path: '/v1/queries/batch', body: { queries: args.queries.map((item) => queryPayload(item.source, item)) } }
        : { method: 'POST', path: (name === 'youtube_download' || args.mode === 'async') ? '/v1/queries' : '/v1/queries/realtime', body: queryPayload(name, args) };
      response = await dataApi.request({ ...request, secret, requestId });
    }
    const isError = response.status >= 300 || response.body.status === 'failed' || response.body.job?.status === 'failed';
    if (isError) format = 'json';
    const body = { ...response.body, http_status: response.status, request_id: requestId };
    if (!chunkResults || ACCOUNT_READ_TOOLS.includes(name) || name === 'get_usage') return toolResult(body, isError, format);
    const text = present(body, format);
    if (Math.max(text.length, JSON.stringify(body).length) <= CHUNK_CHARACTERS) return toolResult(body, isError, format);
    try {
      const resultScopes = name === 'get_job' && response.body.job?.source ? [response.body.job.source] : scopes;
      const chunk = await resultStore.save(identity, body, resultScopes, { encoding: format, text });
      return toolResult({ ...chunk, http_status: response.status, request_id: requestId, usage: body.usage,
        message: 'Large response. Use get_result with result_id and next_offset until next_offset is null. Join chunks in order; parse only encoding=json. Do not repeat the paid query.' }, isError);
    } catch {
      return toolResult({ code: 'result_delivery_failed', http_status: response.status, request_id: requestId,
        job_id: body.id || body.job?.id, usage: body.usage || (body.job ? { credits: body.job.credits } : undefined),
        message: 'The upstream request finished, but its large result could not be cached. Work may have been charged. Read the job if an id is available; otherwise check Jobs before submitting again.' }, true);
    }
  }
  return { list, call };
}

module.exports = { createToolHandlers };
