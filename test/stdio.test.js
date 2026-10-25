const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
const { listTools } = require('../src/mcp/toolCatalog');
const { loadLocalConfig } = require('../src/local');

const bin = process.env.FLASHDATA_MCP_TEST_BIN || path.join(__dirname, '../bin/flashdata-mcp.js');
const secret = 'test-fixture-api-key';

test('configuration failures never echo credentials and stdout stays empty', () => {
  const unsafe = 'https://user:private-password@example.test';
  const run = spawnSync(process.execPath, [bin], { encoding: 'utf8', env: {
    ...process.env, FLASHDATA_API_KEY: secret, FLASHDATA_MANAGEMENT_API_URL: unsafe,
  } });
  assert.equal(run.status, 1);
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /FLASHDATA_MANAGEMENT_API_URL/);
  assert.ok(!run.stderr.includes('private-password'));
  assert.ok(!run.stderr.includes(secret));
  for (const value of ['http://api.example.test', 'https://example.test/v2', 'file:///tmp/api', 'https://example.test?key=secret']) {
    assert.throws(() => loadLocalConfig({ FLASHDATA_API_KEY: secret, FLASHDATA_DATA_API_URL: value }));
  }
  assert.throws(() => loadLocalConfig({ FLASHDATA_API_KEY: secret, FLASHDATA_REQUEST_TIMEOUT_MS: '1e5' }));
});

test('stdio protocol uses REST, rechecks access, and preserves billing and result semantics', async t => {
  let scopes = SOURCE_CATALOG.map(source => source.id);
  let revoked = false;
  let accessUnavailable = false;
  const requests = [];
  const pendingAssertions = [];
  const result = { text: '字幕😀'.repeat(7000) };
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    requests.push({ path: req.url, method: req.method, headers: req.headers, body });
    res.setHeader('Content-Type', 'application/json');
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    if (req.url === '/object.json') {
      pendingAssertions.push(() => {
        assert.equal(req.headers['x-api-key'], undefined);
        assert.equal(req.headers.authorization, undefined);
        assert.equal(req.headers.cookie, undefined);
      });
      return send(200, result);
    }
    if (req.headers['x-api-key'] !== secret || revoked) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return accessUnavailable
      ? send(503, { code: 'unavailable' }) : send(200, { sources: scopes, result_origin: origin });
    if (req.url === '/v2/api-access/balance') return send(200, { availableCredits: 12.345 });
    if (req.url.startsWith('/v2/api-access/pricing')) return send(200, { prices: [{ source: 'google_search', creditsPerRequest: 0.02 }] });
    if (req.url === '/v2/api-access/limits') return send(200, { limits: { pendingJobs: 100 }, current: { pendingJobs: 2 } });
    if (req.url.startsWith('/v2/usage')) return send(200, { totals: { requests: 2, credits: 0.04 } });
    if (req.url === '/v2/jobs/job_complete') return send(200, { job: { id: 'job_complete', status: 'completed', source: 'youtube_transcript', credits: 0.01 } });
    if (req.url === '/v2/jobs/job_complete/results') {
      res.statusCode = 302;
      res.setHeader('Location', `${origin}/object.json`);
      return res.end();
    }
    if (req.url === '/v1/queries/realtime' && body.query === 'lost-reply') return req.socket.destroy();
    if (req.url === '/v1/queries/realtime') return send(200, { results: [{ title: 'Example' }], usage: { credits: 0.02 } });
    if (req.url === '/v1/queries' || req.url === '/v1/queries/batch') return send(202, { id: 'job_submitted', status: 'pending' });
    return send(404, { code: 'not_found' });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${upstream.address().port}`;
  const client = new Client({ name: 'stdio-contract', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [bin], stderr: 'pipe', env: {
    FLASHDATA_API_KEY: secret, FLASHDATA_DATA_API_URL: origin, FLASHDATA_MANAGEMENT_API_URL: origin,
  } });
  let stderr = '';
  transport.stderr?.on('data', chunk => { stderr += chunk; });
  t.after(async () => {
    await client.close();
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  });
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, require('../package.json').version);
  assert.deepEqual((await client.listTools()).tools, listTools(scopes));
  assert.equal((await client.listTools()).tools.length, 22);
  const call = (name, args = {}) => client.callTool({ name, arguments: args });
  const balance = await call('get_balance');
  assert.equal(balance.structuredContent.availableCredits, 12.345);
  await call('get_pricing', { source: 'google_search', request_count: 3 });
  await call('get_limits');
  await call('get_usage', { source: 'google_search' });
  assert.equal(requests.filter(req => req.method === 'POST').length, 0);
  assert.ok(requests.some(req => req.path === '/v2/api-access/pricing?source=google_search&request_count=3'));

  const search = await call('google_search', { query: 'example', gl: 'us', num: 3 });
  assert.equal(search.isError, false);
  assert.match(search.content[0].text, /^# FlashData/);
  assert.equal(search.structuredContent.results[0].title, 'Example');
  const submitted = requests.find(req => req.method === 'POST');
  assert.deepEqual(submitted.body, { source: 'google_search', query: 'example', params: { gl: 'us', num: 3 } });
  assert.equal(submitted.headers.authorization, undefined);
  assert.equal(submitted.headers.cookie, undefined);
  assert.match(submitted.headers['x-request-id'], /^req_/);

  const storage = { storage_type: 's3', storage_url: 'example-output', access_key: 'test-fixture-access', secret_key: 'test-fixture-secret' };
  await call('youtube_download', { video_id: 'abcdefghijk', storage });
  await call('submit_batch', { queries: [{ source: 'youtube_download', video_id: 'abcdefghijk', storage }] });
  assert.ok(requests.some(req => req.path === '/v1/queries' && req.body.params.storage.storage_url === 'example-output'));
  assert.ok(requests.some(req => req.path === '/v1/queries/batch' && req.body.queries[0].params.storage.storage_url === 'example-output'));
  const beforeInvalid = requests.filter(req => req.method === 'POST').length;
  assert.equal((await call('youtube_download', { video_id: 'abcdefghijk' })).isError, true);
  assert.equal((await call('youtube_search', { query: 'example', max_results: 21 })).isError, true);
  assert.equal(requests.filter(req => req.method === 'POST').length, beforeInvalid);

  const unknown = await call('google_search', { query: 'lost-reply' });
  assert.equal(unknown.structuredContent.code, 'query_outcome_unknown');
  assert.equal(requests.filter(req => req.body?.query === 'lost-reply').length, 1);
  const job = await call('get_job', { job_id: 'job_complete', response_format: 'json' });
  assert.equal(job.isError, false);
  let chunk = job.structuredContent;
  const resultId = chunk.result_id;
  let json = chunk.chunk;
  while (chunk.next_offset !== null) {
    chunk = (await call('get_result', { result_id: resultId, offset: chunk.next_offset })).structuredContent;
    json += chunk.chunk;
  }
  assert.deepEqual(JSON.parse(json).output, result);
  for (const check of pendingAssertions) check();
  assert.equal(requests.filter(req => req.path === '/object.json').length, 1);

  scopes = ['google_search'];
  assert.ok(!(await client.listTools()).tools.some(tool => tool.name === 'youtube_download'));
  assert.equal((await call('youtube_metadata', { video_id: 'abcdefghijk' })).structuredContent.code, 'source_forbidden');
  assert.equal((await call('get_result', { result_id: resultId })).structuredContent.code, 'result_unavailable');
  revoked = true;
  const afterQueries = requests.filter(req => req.method === 'POST').length;
  await assert.rejects(call('get_balance'), /invalid or revoked/);
  await assert.rejects(call('get_result', { result_id: resultId }), /invalid or revoked/);
  revoked = false;
  accessUnavailable = true;
  await assert.rejects(call('google_search', { query: 'must-not-submit' }), /could not be verified/);
  assert.equal(requests.filter(req => req.method === 'POST').length, afterQueries);
  assert.equal(stderr, '');
});
