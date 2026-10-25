const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');

const bin = process.env.FLASHDATA_CLI_TEST_BIN || path.join(__dirname, '../bin/flashdata.js');
const secret = 'cli-fixture-key';
function run(args, env = {}, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      env: { ...process.env, FLASHDATA_API_KEY: '', ...env }, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

test('CLI local failures are structured and never echo credentials or input', async () => {
  const fixtures = [
    [['call', 'get_pricing'], {}, '', 'invalid_configuration'],
    [['call', 'get_pricing'], { FLASHDATA_API_KEY: secret, FLASHDATA_MANAGEMENT_API_URL: 'https://user:private-password@example.test' }, '', 'invalid_configuration'],
    [['call', 'get_pricing', '--input', '-'], {}, '{"secret":"private-password",', 'invalid_input'],
    [['call', 'get_pricing', '--input', '-'], {}, '[]', 'invalid_input'],
    [['call', 'get_pricing', '--input', '-'], {}, 'x'.repeat(256 * 1024 + 1), 'invalid_input'],
    [['call', 'get_pricing', '--api-key', secret], {}, '', 'invalid_command'],
  ];
  for (const [args, env, input, code] of fixtures) {
    const output = await run(args, env, input);
    assert.equal(output.status, 2);
    assert.equal(output.stderr, '');
    assert.equal(JSON.parse(output.stdout).error.code, code);
    assert.ok(!output.stdout.includes(secret));
    assert.ok(!output.stdout.includes('private-password'));
  }
  assert.equal((await run(['--version'])).stdout.trim(), require('../package.json').version);
  assert.match((await run(['--help'])).stdout, /Never automatically repeat/);
});

test('CLI discovers schemas, reads pricing, returns complete results and never retries submissions', async t => {
  const requests = [];
  const result = { text: '字幕😀'.repeat(10000) };
  let scopes = SOURCE_CATALOG.map(source => source.id);
  let revoked = false;
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    requests.push({ method: req.method, url: req.url, headers: req.headers, body });
    res.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (req.url === '/result.json') return send(200, result);
    if (revoked || req.headers['x-api-key'] !== secret) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return send(200, { sources: scopes, result_origin: origin });
    if (req.url === '/v2/api-access/pricing?source=google_search&request_count=1') return send(200, { prices: [{ source: 'google_search', creditsPerRequest: 0.02 }] });
    if (req.url === '/v1/queries' || req.url === '/v1/queries/batch') return send(202, { id: 'job_pending', status: 'pending' });
    if (req.url === '/v1/queries/realtime') {
      if (body.query === 'lost-reply') return req.socket.destroy();
      return send(200, { results: [result], usage: { credits: 0.02 } });
    }
    if (req.url === '/v2/jobs/job_pending') return send(200, { job: { id: 'job_pending', status: 'pending' } });
    if (req.url === '/v2/jobs/job_failed') return send(200, { job: { id: 'job_failed', status: 'failed' } });
    if (req.url === '/v2/jobs/job_complete') return send(200, { job: { id: 'job_complete', status: 'completed', source: 'youtube_transcript' } });
    if (req.url === '/v2/jobs/job_complete/results') {
      res.statusCode = 302;
      res.setHeader('Location', `${origin}/result.json`);
      return res.end();
    }
    return send(404, { code: 'not_found' });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${upstream.address().port}`;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-cli-'));
  t.after(async () => {
    fs.rmSync(temporary, { recursive: true, force: true });
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  });
  const env = { FLASHDATA_API_KEY: secret, FLASHDATA_MANAGEMENT_API_URL: origin, FLASHDATA_DATA_API_URL: origin };
  const read = output => {
    assert.equal(output.stderr, '');
    assert.ok(!output.stdout.includes(secret));
    const value = JSON.parse(output.stdout);
    assert.equal(output.status, value.ok ? 0 : 1);
    return value;
  };
  const call = async (name, args = {}) => read(await run(['call', name, '--input', '-'], env, JSON.stringify(args)));
  const tools = read(await run(['tools'], env)).result.tools;
  assert.equal(tools.length, 21);
  assert.ok(!tools.some(tool => tool.name === 'get_result'));
  assert.ok(tools.find(tool => tool.name === 'google_search').inputSchema.required.includes('query'));
  const file = path.join(temporary, 'pricing.json');
  fs.writeFileSync(file, JSON.stringify({ source: 'google_search', request_count: 1 }));
  const pricing = read(await run(['call', 'get_pricing', '--input', file], env));
  assert.equal(pricing.result.prices[0].creditsPerRequest, 0.02);
  assert.equal(requests.filter(req => req.method === 'POST').length, 0);
  const search = await call('google_search', { query: 'example' });
  assert.deepEqual(search.result.results, [result]);
  assert.equal(search.result.result_id, undefined);
  for (const format of ['markdown', 'text']) {
    const rendered = await call('google_search', { query: `format-${format}`, response_format: format });
    assert.equal(typeof rendered.result, 'string');
    assert.match(rendered.result, format === 'markdown' ? /^# FlashData/ : /^Results:/);
    assert.ok(rendered.result.includes('字幕😀'));
    assert.deepEqual(requests.find(req => req.body?.query === `format-${format}`).body.params, {});
  }
  assert.equal((await call('google_search', { query: 'example', mode: 'async' })).result.id, 'job_pending');
  assert.equal((await call('get_job', { job_id: 'job_pending' })).result.job.status, 'pending');
  assert.equal((await call('get_job', { job_id: 'job_failed' })).ok, false);
  assert.deepEqual((await call('get_job', { job_id: 'job_complete' })).result.output, result);
  const objectRequest = requests.find(req => req.url === '/result.json');
  assert.equal(objectRequest.headers['x-api-key'], undefined);
  assert.equal(objectRequest.headers.authorization, undefined);
  assert.equal(objectRequest.headers.cookie, undefined);
  await call('submit_batch', { queries: [{ source: 'google_search', query: 'batch' }] });
  assert.deepEqual(requests.find(req => req.url === '/v1/queries/batch').body, { queries: [{ source: 'google_search', query: 'batch', params: {} }] });
  assert.equal((await call('google_search', { query: 'lost-reply' })).result.code, 'query_outcome_unknown');
  assert.equal(requests.filter(req => req.body?.query === 'lost-reply').length, 1);
  const posts = requests.filter(req => req.method === 'POST').length;
  assert.equal((await call('google_search', {})).result.code, 'invalid_arguments');
  assert.equal((await call('get_result')).result.code, 'unknown_tool');
  scopes = ['google_search'];
  assert.equal((await call('youtube_metadata', { video_id: 'abcdefghijk' })).result.code, 'source_forbidden');
  revoked = true;
  assert.equal((await call('google_search', { query: 'do-not-submit' })).error.code, 'operation_failed');
  assert.equal(requests.filter(req => req.method === 'POST').length, posts);
});
