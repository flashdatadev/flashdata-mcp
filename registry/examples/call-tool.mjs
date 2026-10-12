import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const inputPath = process.argv[2];
if (!inputPath || process.argv.length !== 3) {
  console.error('Usage: node registry/examples/call-tool.mjs <tool-request.json>');
  process.exit(2);
}

const apiKey = process.env.FLASHDATA_API_KEY;
if (!apiKey) {
  console.error('Set FLASHDATA_API_KEY through your environment or secret manager.');
  process.exit(2);
}

let request;
try {
  request = JSON.parse(await readFile(inputPath, 'utf8'));
  if (!request || typeof request.name !== 'string' || !request.arguments
    || typeof request.arguments !== 'object' || Array.isArray(request.arguments)) {
    throw new Error('Invalid tool request');
  }
} catch {
  console.error('The input must be a JSON object with name and arguments fields.');
  process.exit(2);
}

const client = new Client({ name: 'flashdata-hosted-example', version: '0.2.0' });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL('https://data.flashdata.dev/mcp'), {
    requestInit: { headers: { 'X-API-Key': apiKey } },
  }));
  const result = await client.callTool(request, undefined, { timeout: 120000 });
  const body = result.structuredContent
    ?? JSON.parse(result.content.find(item => item.type === 'text').text);
  console.log(JSON.stringify(body, null, 2));
  if (result.isError) process.exitCode = 1;
} catch {
  console.error('MCP call failed. If this was a paid submission, check Jobs before retrying; it may have been accepted.');
  process.exitCode = 1;
} finally {
  await client.close();
}
