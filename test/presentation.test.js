const { test } = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv');
const { createToolHandlers } = require('../src/mcp/toolHandlers');
const { createMemoryResultStore } = require('../src/mcp/memoryResultStore');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
const { listTools } = require('../src/mcp/toolCatalog');
const { present } = require('../src/mcp/presentation');

function fixture(body, options = {}) {
  const requests = [];
  const request = async input => { requests.push(input); return { status: 200, body }; };
  const handlers = createToolHandlers({ identity: { accountId: 'a', apiKeyId: 'k', scopes: SOURCE_CATALOG.map(s => s.id) },
    secret: 'fixture', requestId: 'req_fixture', resultStore: createMemoryResultStore(),
    dataApi: { request }, jobApi: { read: request }, managementApi: { request }, accountReads: { read: request }, ...options });
  return { handlers, requests };
}

test('every discovered tool describes inputs and validates structured output', async () => {
  const tools = listTools(SOURCE_CATALOG.map(s => s.id));
  assert.equal(tools.length, 22);
  const ajv = new Ajv({ strict: true });
  for (const tool of tools) {
    assert.ok(tool.outputSchema, tool.name);
    const validate = ajv.compile(tool.outputSchema);
    assert.ok(validate({ code: 'invalid_arguments', message: 'Invalid input' }), tool.name);
    for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
      assert.ok(schema.description, `${tool.name}.${name}`);
    }
    if (tool.name === 'get_result') assert.equal(tool.inputSchema.properties.response_format, undefined);
    else assert.equal(tool.inputSchema.properties.response_format.default, 'markdown');
  }
});

test('MCP defaults to Markdown, preserves structured fields and never forwards presentation to the API', async () => {
  const body = { source: 'youtube_transcript', status: 'done', results: [{ videoId: 'aircAruvnKk',
    fullText: '<script> & [instruction](bad)', segments: [{ start: 1.2, end: 3.4, text: '字幕😀' }] }], usage: { credits: 0.01 } };
  for (const format of [undefined, 'markdown', 'text', 'json']) {
    const { handlers, requests } = fixture(body);
    const result = await handlers.call({ name: 'youtube_transcript', arguments: { video_id: 'aircAruvnKk', ...(format ? { response_format: format } : {}) } });
    assert.deepEqual(result.structuredContent, { ...body, http_status: 200, request_id: 'req_fixture' });
    assert.equal(result.content[0].text, present(result.structuredContent, format || 'markdown'));
    if (!format || format === 'markdown') {
      assert.match(result.content[0].text, /^# FlashData/);
      assert.match(result.content[0].text, /\[1\.2–3\.4s\]/);
      assert.match(result.content[0].text, /https:\/\/www.youtube.com\/watch\?v=aircAruvnKk/);
      assert.ok(!result.content[0].text.includes('<script>'));
    }
    assert.deepEqual(requests[0].body.params, {});
    assert.equal(requests.length, 1);
  }
});

test('formatted chunks reconstruct the complete Unicode document with one paid call', async () => {
  for (const format of ['markdown', 'text', 'json']) {
    const body = { source: 'youtube_transcript', status: 'done', results: [{ fullText: '字幕😀'.repeat(18000) }] };
    const { handlers, requests } = fixture(body);
    let result = await handlers.call({ name: 'youtube_transcript', arguments: { video_id: 'aircAruvnKk', response_format: format } });
    let chunk = result.structuredContent;
    let text = chunk.chunk;
    assert.equal(chunk.encoding, format);
    const id = chunk.result_id;
    while (chunk.next_offset !== null) {
      result = await handlers.call({ name: 'get_result', arguments: { result_id: id, offset: chunk.next_offset } });
      assert.equal(result.isError, false);
      chunk = result.structuredContent;
      assert.equal(chunk.encoding, format);
      text += chunk.chunk;
    }
    assert.equal(text, present({ ...body, http_status: 200, request_id: 'req_fixture' }, format));
    assert.equal(requests.length, 1);
  }
});

test('presentation applies to receipts, jobs and account reads; CLI keeps JSON default', async () => {
  for (const [name, args] of [['google_search', { query: 'fixture', mode: 'async' }],
    ['submit_batch', { queries: [{ source: 'google_search', query: 'fixture' }] }],
    ['get_job', { job_id: 'job_fixture' }], ['get_pricing', {}], ['get_usage', {}]]) {
    const { handlers, requests } = fixture({ status: 'pending' });
    const result = await handlers.call({ name, arguments: { ...args, response_format: 'text' } });
    assert.match(result.content[0].text, /^Status: "pending"/);
    assert.ok(!JSON.stringify(requests).includes('response_format'));
  }
  const { handlers } = fixture({ status: 'done' }, { chunkResults: false });
  const result = await handlers.call({ name: 'google_search', arguments: { query: 'fixture' } });
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  assert.equal((await handlers.list()).tools[0].inputSchema.properties.response_format.default, 'json');
});

test('invalid formats fail before an API call and upstream failures remain structured JSON', async () => {
  const { handlers, requests } = fixture({ status: 'failed', code: 'fixture_failure' });
  const invalid = await handlers.call({ name: 'google_search', arguments: { query: 'fixture', response_format: 'html' } });
  assert.equal(invalid.isError, true);
  assert.equal(requests.length, 0);
  const failed = await handlers.call({ name: 'google_search', arguments: { query: 'fixture' } });
  assert.equal(failed.isError, true);
  assert.deepEqual(JSON.parse(failed.content[0].text), failed.structuredContent);
});
