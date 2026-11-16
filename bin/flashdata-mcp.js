#!/usr/bin/env node
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

function createInspectionServer() {
  const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
  const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
  const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
  const { listTools } = require('../src/mcp/toolCatalog');
  const server = new Server({ name: 'flashdata', version: require('../package.json').version }, {
    capabilities: { tools: {} },
    instructions: 'Schema-only inspection: tool definitions are public, but all tool calls are disabled. Disable FLASHDATA_SCHEMA_ONLY and supply your own API key for normal use.',
  });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listTools(SOURCE_CATALOG.map(source => source.id)) }));
  server.setRequestHandler(CallToolRequestSchema, async () => {
    const error = { code: 'inspection_disabled', message: 'Tool calls are disabled in schema-only inspection mode.' };
    return { content: [{ type: 'text', text: error.message }], structuredContent: error, isError: true };
  });
  return server;
}

async function main() {
  if (process.argv.includes('--help')) {
    process.stdout.write('FlashData MCP (stdio)\n\nSet FLASHDATA_API_KEY, then run flashdata-mcp.\nOptional: FLASHDATA_DATA_API_URL, FLASHDATA_MANAGEMENT_API_URL, FLASHDATA_REQUEST_TIMEOUT_MS.\nAPI URLs are origins without /v1 or /v2. Queries use your FlashData Credits.\n');
    return;
  }
  if (process.argv.includes('--version')) {
    process.stdout.write(`${require('../package.json').version}\n`);
    return;
  }
  if (process.argv.length > 2) throw new Error('Unsupported arguments. Use --help; configure credentials through the environment.');
  let server;
  if (process.env.FLASHDATA_SCHEMA_ONLY === 'true') {
    server = createInspectionServer();
  } else {
    const { createLocalServer, loadLocalConfig } = require('../src/local');
    server = createLocalServer(loadLocalConfig());
  }
  let closing;
  const stop = () => { closing ||= server.close().catch(() => { process.exitCode = 1; }); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  await server.connect(new StdioServerTransport());
}

main().catch(error => {
  // Configuration errors have fixed text. Never print HTTP errors, request objects, or environment values.
  process.stderr.write(`FlashData MCP: ${error.message}\n`);
  process.exitCode = 1;
});
