const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { unzipSync } = require('fflate');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
const { tasks, version } = require('../smithery/tasks.json');

test('all 15 fixed task servers enforce source boundaries over real stdio', async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-task-contract-'));
  let scopes = SOURCE_CATALOG.map(source => source.id);
  let revoked = false;
  let jobSource;
  let jobStatus = 'completed';
  const requests = [];
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    requests.push({ url: req.url, method: req.method, body, headers: req.headers });
    res.setHeader('content-type', 'application/json');
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (req.url === '/object') return send(200, { text: '字幕😀'.repeat(7000) });
    if (revoked) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return send(200, { sources: scopes, result_origin: origin });
    if (req.url.startsWith('/v2/api-access/pricing')) return send(200, { prices: [{ source: new URL(req.url, origin).searchParams.get('source') }] });
    if (req.url === '/v2/jobs/job_task') return send(200, { job: { id: 'job_task', source: jobSource, status: jobStatus, privateDetail: 'must-not-leak' } });
    if (req.url === '/v2/jobs/job_task/results') { res.writeHead(302, { location: `${origin}/object` }); return res.end(); }
    if (req.url === '/v1/queries') return send(202, { id: 'job_task', status: 'pending' });
    if (req.url === '/v1/queries/realtime') return send(200, { source: body.source, results: [{ text: '字幕😀'.repeat(7000) }] });
    return send(404, { code: 'not_found' });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${upstream.address().port}`;
  t.after(async () => {
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  for (const task of tasks) await t.test(task.source, async () => {
    scopes = SOURCE_CATALOG.map(source => source.id);
    revoked = false;
    jobSource = task.source;
    jobStatus = 'completed';
    const directory = path.join(temporary, task.slug);
    fs.mkdirSync(directory);
    const bin = path.join(directory, 'server.js');
    if (process.env.FLASHDATA_TASK_BUNDLE_DIR) {
      const archive = unzipSync(fs.readFileSync(path.join(process.env.FLASHDATA_TASK_BUNDLE_DIR, `flashdata-${task.slug}-${version}.mcpb`)));
      for (const [relative, bytes] of Object.entries(archive)) {
        const target = path.resolve(directory, relative);
        assert.ok(target.startsWith(`${directory}${path.sep}`));
        if (relative.endsWith('/')) continue;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, bytes);
      }
    } else {
      fs.writeFileSync(bin, `require(${JSON.stringify(path.join(__dirname, '../src/mcp/runTaskServer'))}).runTaskServer(${JSON.stringify(task.source)}, {name:${JSON.stringify(`flashdata-${task.slug}`)},version:${JSON.stringify(version)}});`);
    }
    const client = new Client({ name: 'task-contract', version: '1.0.0' });
    const transport = new StdioClientTransport({ command: process.execPath, args: [bin], stderr: 'pipe', env: {
      FLASHDATA_API_KEY: 'test-fixture-api-key', FLASHDATA_MANAGEMENT_API_URL: origin, FLASHDATA_DATA_API_URL: origin,
      // Neither a source override nor a broad API Key may widen a fixed entry point.
      FLASHDATA_TASK_SOURCE: 'google_search',
    } });
    let stderr = '';
    transport.stderr.on('data', chunk => { stderr += chunk; });
    try {
      await client.connect(transport);
      assert.equal(client.getServerVersion().name, `flashdata-${task.slug}`);
      assert.equal(client.getServerVersion().version, version);
      const tools = (await client.listTools()).tools;
      assert.deepEqual(new Set(tools.map(tool => tool.name)), new Set([task.source, 'get_pricing', 'get_job', 'get_result']));
      assert.deepEqual(tools.find(tool => tool.name === 'get_pricing').inputSchema.properties.source.enum, [task.source]);
      const call = (name, args = {}) => client.callTool({ name, arguments: args });
      const beforeFree = requests.filter(req => req.method === 'POST').length;
      assert.equal((await call('get_pricing')).structuredContent.prices[0].source, task.source);
      for (const other of tasks.filter(item => item.source !== task.source)) {
        const example = require(`../registry/examples/${other.source}.json`);
        assert.equal((await call(other.source, example.arguments)).structuredContent.code, 'source_forbidden');
        assert.equal((await call('get_pricing', { source: other.source })).structuredContent.code, 'source_forbidden');
      }
      for (const name of ['submit_batch', 'get_usage', 'get_balance', 'get_limits']) {
        assert.equal((await call(name, {})).structuredContent.code, 'source_forbidden');
      }
      assert.equal(requests.filter(req => req.method === 'POST').length, beforeFree);
      const other = tasks.find(item => item.source !== task.source).source;
      for (const source of [other, undefined]) for (const status of ['pending', 'completed', 'failed']) {
        jobSource = source;
        jobStatus = status;
        const before = requests.length;
        const response = await call('get_job', { job_id: 'job_task' });
        assert.equal(response.structuredContent.code, 'source_forbidden');
        assert.ok(!JSON.stringify(response).includes('must-not-leak'));
        assert.ok(!requests.slice(before).some(req => req.url.endsWith('/results') || req.url === '/object'));
      }
      jobSource = task.source;
      jobStatus = 'completed';
      const example = require(`../registry/examples/${task.source}.json`);
      const submitted = await call(task.source, example.arguments);
      assert.equal(submitted.isError, false);
      const lastPost = requests.filter(req => req.method === 'POST').at(-1);
      assert.equal(lastPost.body.source, task.source);
      if (task.source === 'youtube_download') assert.equal(lastPost.url, '/v1/queries');
      const job = await call('get_job', { job_id: 'job_task' });
      assert.equal(job.isError, false);
      let chunk = job.structuredContent;
      const resultId = chunk.result_id;
      let result = chunk.chunk;
      while (chunk.next_offset !== null) {
        chunk = (await call('get_result', { result_id: resultId, offset: chunk.next_offset })).structuredContent;
        result += chunk.chunk;
      }
      assert.equal(JSON.parse(result).output.text, '字幕😀'.repeat(7000));
      for (const req of requests.filter(item => item.url === '/object')) assert.equal(req.headers['x-api-key'], undefined);
      const beforeScopeChange = requests.filter(req => req.method === 'POST').length;
      scopes = [other];
      assert.deepEqual((await client.listTools()).tools, []);
      assert.equal((await call(task.source, example.arguments)).structuredContent.code, 'source_forbidden');
      assert.equal((await call('get_result', { result_id: resultId })).structuredContent.code, 'source_forbidden');
      revoked = true;
      await assert.rejects(call('get_pricing'), /invalid or revoked/);
      assert.equal(requests.filter(req => req.method === 'POST').length, beforeScopeChange);
      assert.equal(stderr, '');
    } finally { await client.close(); }
  });
});
