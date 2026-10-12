const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { createToolHandlers } = require('./toolHandlers');

function createMcpServer(options) {
  const server = new Server({ name: 'flashdata', version: require('../../package.json').version }, { capabilities: { tools: {} } });
  const tools = createToolHandlers(options);
  server.setRequestHandler(ListToolsRequestSchema, tools.list);
  server.setRequestHandler(CallToolRequestSchema, ({ params }) => tools.call(params));
  return server;
}

module.exports = { createMcpServer };
