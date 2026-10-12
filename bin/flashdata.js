#!/usr/bin/env node
const fs = require('node:fs');
const { McpError } = require('@modelcontextprotocol/sdk/types.js');
const { createLocalTools, loadLocalConfig } = require('../src/local');

const help = `FlashData CLI

  flashdata tools                         List available tools and JSON schemas
  flashdata call <tool>                    Call a tool with no arguments
  flashdata call <tool> --input <file|->    Read a JSON object from a file or stdin
  flashdata --version

Set FLASHDATA_API_KEY through your environment or secret manager.
Optional: FLASHDATA_DATA_API_URL, FLASHDATA_MANAGEMENT_API_URL,
FLASHDATA_REQUEST_TIMEOUT_MS. Use --help on flashdata-mcp for stdio MCP.

tools and call write one JSON object to stdout: { ok, result }.
Call results also include tool. Local failures use { ok: false, error }.
Exit 0 means success; exit 1 means a tool/API error; exit 2 means invalid local input.
Async submissions return a job id; call get_job to read status and results.
Pending jobs are successful reads, not completed work. Large results are returned whole.
get_pricing, get_balance, get_limits, get_usage and get_job are free reads.
Queries spend FlashData Credits. Never automatically repeat a timed-out submission.
Check Jobs first: work may already have been submitted and charged.
`;

function fail(code, message, exitCode) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: { code, message } })}\n`);
  process.exitCode = exitCode;
}

async function readInput(input) {
  const stream = input === '-' ? process.stdin : fs.createReadStream(input);
  let size = 0;
  const chunks = [];
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > 256 * 1024) throw new Error('Input too large');
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && args[0] === '--help')) return process.stdout.write(help);
  if (args.length === 1 && args[0] === '--version') return process.stdout.write(`${require('../package.json').version}\n`);
  const listing = args.length === 1 && args[0] === 'tools';
  const calling = args[0] === 'call' && /^[a-z][a-z0-9_]*$/.test(args[1] || '')
    && (args.length === 2 || (args.length === 4 && args[2] === '--input' && args[3]));
  if (!listing && !calling) return fail('invalid_command', 'Use --help. Arguments must be supplied through --input <file|->; API keys belong in the environment.', 2);
  let input = {};
  if (args.length === 4) {
    try { input = await readInput(args[3]); }
    catch { return fail('invalid_input', 'Input must be a readable JSON object of at most 256 KiB.', 2); }
  }
  let config;
  try { config = loadLocalConfig(); }
  catch (error) { return fail('invalid_configuration', error.message, 2); }
  const tools = createLocalTools(config);
  if (listing) return process.stdout.write(`${JSON.stringify({ ok: true, result: await tools.list() })}\n`);
  const result = await tools.call({ name: args[1], arguments: input });
  process.stdout.write(`${JSON.stringify({ ok: !result.isError, tool: args[1], result: result.structuredContent })}\n`);
  if (result.isError) process.exitCode = 1;
}

// A closed output pipe must never trigger another potentially paid request.
process.stdout.on('error', () => { process.exitCode = 1; });
main().catch(error => {
  fail('operation_failed', error instanceof McpError ? error.message
    : 'The operation could not be completed. Do not automatically repeat a query; check Jobs first.', 1);
});
