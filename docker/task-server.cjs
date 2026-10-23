const { assertTaskSource } = require('../src/mcp/taskTools');
const { runTaskServer } = require('../src/mcp/runTaskServer');

async function main() {
  const source = process.argv[2];
  assertTaskSource(source);
  await runTaskServer(source, {
    name: `flashdata-${source.replaceAll('_', '-')}`,
    version: require('../package.json').version,
  }, process.argv.slice(3));
}

main().catch(error => {
  process.stderr.write(`FlashData MCP: ${error.message}\n`);
  process.exitCode = 1;
});
