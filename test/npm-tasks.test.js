const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');

test('15 installed npm CLIs execute their source and reject cross-source access', async t => {
  assert.ok(process.env.FLASHDATA_TASK_NPM_INDEX, 'Run npm run build:npm-tasks then npm run test:npm-tasks');
  const index = JSON.parse(fs.readFileSync(process.env.FLASHDATA_TASK_NPM_INDEX, 'utf8'));
  assert.equal(index.length, 15);
  let scopes = SOURCE_CATALOG.map(source => source.id);
  let jobSource;
  let jobStatus = 'completed';
  let revoked = false;
  const requests = [];
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    requests.push({ url: req.url, method: req.method, headers: req.headers, body });
    const send = (status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (req.url === '/object') return send(200, { text: '字幕😀'.repeat(7000) });
    if (revoked) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return send(200, { sources: scopes, result_origin: origin });
    if (req.url.startsWith('/v2/api-access/pricing')) return send(200, { prices: [{ source: new URL(req.url, origin).searchParams.get('source') }] });
    if (req.url === '/v1/queries') return send(202, { id: 'job_task', status: 'pending' });
    if (req.url === '/v1/queries/realtime') return send(200, { source: body.source, results: [body] });
    if (req.url === '/v2/jobs/job_task') return send(200, { job: { id: 'job_task', source: jobSource, status: jobStatus, privateDetail: 'must-not-leak' } });
    if (req.url === '/v2/jobs/job_task/results') { res.writeHead(302, { location: `${origin}/object` }); return res.end(); }
    return send(404, { code: 'not_found' });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${upstream.address().port}`;
  t.after(async () => { upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve)); });
  for (const entry of index) await t.test(entry.source, async () => {
    scopes = SOURCE_CATALOG.map(source => source.id);
    revoked = false;
    jobSource = entry.source;
    jobStatus = 'completed';
    const other = scopes.find(source => source !== entry.source);
    const run = (args, input) => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [entry.bin, ...args], { env: { ...process.env,
        FLASHDATA_API_KEY: 'npm-fixture-key', FLASHDATA_DATA_API_URL: origin, FLASHDATA_MANAGEMENT_API_URL: origin,
        FLASHDATA_TASK_SOURCE: other }, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', value => { stdout += value; }); child.stderr.on('data', value => { stderr += value; });
      child.on('error', reject); child.on('close', status => resolve({ status, stdout, stderr }));
      child.stdin.on('error', () => {}); child.stdin.end(input === undefined ? '' : JSON.stringify(input));
    });
    const read = async (args, input) => {
      const result = await run(args, input);
      assert.equal(result.stderr, ''); assert.ok(!result.stdout.includes('npm-fixture-key'));
      const body = JSON.parse(result.stdout); assert.equal(result.status, body.ok ? 0 : 1);
      return body;
    };
    const call = (name, input = {}) => read(['call', name, '--input', '-'], input);
    const directory = path.dirname(path.dirname(entry.bin));
    const packagedCatalog = require(path.join(directory, 'runtime/catalog/sourceCatalog.js'));
    assert.deepEqual(packagedCatalog.SOURCE_CATALOG.map(source => source.id), [entry.source]);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(manifest.bin), [entry.command]);
    assert.deepEqual(Object.keys(manifest.exports), ['./package.json']);
    assert.equal((await run(['--version'])).stdout.trim(), entry.version);
    assert.match((await run(['--help'])).stdout, new RegExp(entry.source));
    assert.equal((await run(['mcp', '--source', other])).status, 2);
    assert.deepEqual(new Set((await read(['tools'])).result.tools.map(tool => tool.name)), new Set([entry.source, 'get_pricing', 'get_job']));
    assert.equal((await call('get_pricing')).result.prices[0].source, entry.source);
    const before = requests.filter(req => req.method === 'POST').length;
    const sample = require(`../registry/examples/${entry.source}.json`).arguments;
    assert.equal((await call(other, {})).result.code, 'source_forbidden');
    assert.equal((await call('submit_batch', {})).result.code, 'source_forbidden');
    assert.equal((await call(entry.source, { ...sample, source: other })).result.code, 'invalid_arguments');
    assert.equal(requests.filter(req => req.method === 'POST').length, before);
    const submitted = await call(entry.source, sample);
    assert.equal(submitted.ok, true);
    const lastPost = requests.filter(req => req.method === 'POST').at(-1);
    assert.equal(lastPost.body.source, entry.source);
    assert.equal(lastPost.url, entry.source === 'youtube_download' ? '/v1/queries' : sample.mode === 'async' ? '/v1/queries' : '/v1/queries/realtime');
    assert.equal(requests.filter(req => req.method === 'POST').length, before + 1);
    const output = (await call('get_job', { job_id: 'job_task' })).result.output.text;
    assert.ok(output === '字幕😀'.repeat(7000), 'Large Unicode result must survive stream chunk boundaries');
    for (const req of requests.filter(req => req.url === '/object')) {
      for (const header of ['x-api-key', 'authorization', 'cookie']) assert.equal(req.headers[header], undefined);
    }
    jobStatus = 'pending';
    assert.equal((await call('get_job', { job_id: 'job_task' })).result.job.status, 'pending');
    jobSource = other;
    const beforeCrossJob = requests.length;
    const denied = await call('get_job', { job_id: 'job_task' });
    assert.equal(denied.result.code, 'source_forbidden'); assert.ok(!JSON.stringify(denied).includes('must-not-leak'));
    assert.ok(!requests.slice(beforeCrossJob).some(req => req.url.endsWith('/results') || req.url === '/object'));
    scopes = [other];
    assert.deepEqual((await read(['tools'])).result.tools, []);
    assert.equal((await call(entry.source, sample)).result.code, 'source_forbidden');
    revoked = true;
    assert.equal((await call('get_pricing')).error.code, 'operation_failed');
    assert.equal(requests.filter(req => req.method === 'POST').length, before + 1);
  });
});
