const { randomUUID } = require('node:crypto');
const { ErrorCode, McpError } = require('@modelcontextprotocol/sdk/types.js');
const { SOURCE_CATALOG } = require('./catalog/sourceCatalog');
const { createMcpServer } = require('./mcp/server');
const { createToolHandlers } = require('./mcp/toolHandlers');
const { createDataApiClient } = require('./mcp/dataApiClient');
const { createJobApiClient } = require('./mcp/jobApiClient');
const { createMemoryResultStore } = require('./mcp/memoryResultStore');

function safeOrigin(value, name) {
  try {
    const url = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash
      || !(url.protocol === 'https:' || (url.protocol === 'http:' && loopback))) throw new Error();
    return url.origin;
  } catch {
    throw new Error(`${name} must be an HTTPS origin (or loopback HTTP), without credentials, path, query or fragment.`);
  }
}

function loadLocalConfig(env = process.env) {
  const secret = env.FLASHDATA_API_KEY;
  if (typeof secret !== 'string' || !secret.trim() || secret.length > 512 || /\s/.test(secret)
    || [...secret].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    throw new Error('Set FLASHDATA_API_KEY to your FlashData API key.');
  }
  const rawTimeout = env.FLASHDATA_REQUEST_TIMEOUT_MS || '65000';
  if (!/^\d+$/.test(rawTimeout) || Number(rawTimeout) < 1000 || Number(rawTimeout) > 120000) {
    throw new Error('FLASHDATA_REQUEST_TIMEOUT_MS must be an integer from 1000 to 120000.');
  }
  return {
    secret,
    dataOrigin: safeOrigin(env.FLASHDATA_DATA_API_URL || 'https://data.flashdata.dev', 'FLASHDATA_DATA_API_URL'),
    managementOrigin: safeOrigin(env.FLASHDATA_MANAGEMENT_API_URL || 'https://api.flashdata.dev', 'FLASHDATA_MANAGEMENT_API_URL'),
    timeoutMs: Number(rawTimeout),
  };
}

function createLocalOptions(config) {
  const { secret, dataOrigin, managementOrigin, timeoutMs } = config;
  const managementApi = createDataApiClient({ baseUrl: managementOrigin, timeoutMs });
  const dataApi = createDataApiClient({ baseUrl: dataOrigin, timeoutMs });
  const resultStore = createMemoryResultStore();
  const supportedSources = new Set(SOURCE_CATALOG.map(source => source.id));
  const paths = { get_balance: 'balance', get_pricing: 'pricing', get_limits: 'limits' };

  async function getIdentity() {
    // Revalidate every operation, including cached result reads, after revocation or scope changes.
    const response = await managementApi.request({ method: 'GET', path: '/v2/api-access', secret,
      requestId: `req_${randomUUID()}` });
    if (response.status !== 200) {
      const message = response.status === 401 ? 'The FlashData API key is invalid or revoked.'
        : response.status === 404 ? 'The Management API must be upgraded to support /v2/api-access before using this local server.'
          : 'FlashData API access could not be verified. Retry this free read; no query was submitted.';
      throw new McpError(ErrorCode.InvalidRequest, message);
    }
    const { sources, result_origin: resultOrigin } = response.body;
    if (!Array.isArray(sources) || sources.some(source => typeof source !== 'string')
      || !(resultOrigin === null || typeof resultOrigin === 'string')) {
      throw new McpError(ErrorCode.InternalError, 'The API access response is invalid.');
    }
    let trustedResultOrigin = null;
    try {
      if (resultOrigin !== null) trustedResultOrigin = safeOrigin(resultOrigin, 'Result origin');
    } catch {
      throw new McpError(ErrorCode.InternalError, 'The API returned an unsafe result origin.');
    }
    // Local cache ownership is process-local; internal account and key IDs never leave the API.
    return { accountId: 'local', apiKeyId: 'local',
      scopes: [...new Set(sources.filter(source => supportedSources.has(source)))],
      resultOrigin: trustedResultOrigin };
  }

  return {
    secret, getIdentity, dataApi, managementApi, resultStore,
    accountReads: { read(name, _identity, args = {}) {
      const query = new URLSearchParams(args).toString();
      return managementApi.request({ method: 'GET', path: `/v2/api-access/${paths[name]}${query ? `?${query}` : ''}`,
        secret, requestId: `req_${randomUUID()}` });
    } },
    jobApi: { read({ identity, ...request }) {
      return createJobApiClient({ baseUrl: managementOrigin, resultOrigin: identity.resultOrigin, timeoutMs }).read(request);
    } },
  };
}

function createLocalTools(config, { taskSource } = {}) {
  return createToolHandlers({ ...createLocalOptions(config), chunkResults: false, taskSource });
}

function createLocalServer(config, { taskSource, serverInfo } = {}) {
  const options = { ...createLocalOptions(config), taskSource, serverInfo };
  const server = createMcpServer(options);
  server.onclose = () => options.resultStore.clear();
  return server;
}

module.exports = { createLocalServer, createLocalTools, loadLocalConfig, safeOrigin };
