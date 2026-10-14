const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createLocalServer, loadLocalConfig } = require('../local');

async function runTaskServer(taskSource, { name, version }, args = process.argv.slice(2)) {
  if (args.length) throw new Error('Task servers take no arguments. Configure the API Key through the client.');
  const server = createLocalServer(loadLocalConfig(), { taskSource, serverInfo: { name, version } });
  let closing;
  const stop = () => { closing ||= server.close().catch(() => { process.exitCode = 1; }); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  await server.connect(new StdioServerTransport());
}

module.exports = { runTaskServer };
