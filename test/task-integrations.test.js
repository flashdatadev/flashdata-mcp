const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const catalog = require('../integrations/catalog.json');
const root = path.resolve(__dirname, '..');

test('30 actual integration manifests launch the pinned public task packages with isolated tools', async t => {
  const requests = [];
  const fixtureKey = 'local-fixture-key';
  const fixture = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ method: req.method, url: req.url });
    res.setHeader('content-type', 'application/json');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.headers['x-api-key'] !== fixtureKey) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return send(200, { sources: catalog.map(task => task.source), result_origin: origin });
    if (req.url.startsWith('/v2/api-access/pricing')) return send(200, { prices: [{ source: new URL(req.url, origin).searchParams.get('source') }] });
    if (req.url === '/v2/jobs/job_other') return send(200, { job: { id: 'job_other', source: 'not_this_source', status: 'completed' } });
    return send(404, { code: 'not_found' });
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${fixture.address().port}`;
  t.after(async () => {
    fixture.closeAllConnections();
    await new Promise(resolve => fixture.close(resolve));
  });
  for (const channel of ['cursor', 'gemini']) for (const task of catalog) await t.test(`${channel}: ${task.source}`, async () => {
    const directory = path.join(root, task[`${channel}Directory`]);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, channel === 'cursor' ? '.cursor-plugin/plugin.json' : 'gemini-extension.json'), 'utf8'));
    const config = channel === 'cursor' ? JSON.parse(fs.readFileSync(path.join(directory, 'mcp.json'), 'utf8')) : manifest;
    assert.deepEqual(Object.keys(config.mcpServers), [task.name]);
    const server = config.mcpServers[task.name];
    if (channel === 'cursor') {
      const validate = new Ajv().compile(manifest.variables);
      assert.ok(validate({ FLASHDATA_API_KEY: fixtureKey }));
      assert.equal(validate({}), false);
      assert.equal(validate({ FLASHDATA_API_KEY: '' }), false);
    } else {
      assert.ok(manifest.settings.some(setting => setting.envVar === 'FLASHDATA_API_KEY' && setting.sensitive === true));
    }
    assert.equal(server.env.FLASHDATA_API_KEY, '${FLASHDATA_API_KEY}');
    assert.deepEqual(server.args, ['--yes', task.npmPackage, 'mcp']);
    const client = new Client({ name: 'integration-manifest-check', version: '1.0.0' });
    // Substitute only the declared key, as the host does; redirects keep API tests local.
    const transport = new StdioClientTransport({ ...server, stderr: 'pipe', env: {
      ...server.env, FLASHDATA_API_KEY: fixtureKey,
      FLASHDATA_DATA_API_URL: origin, FLASHDATA_MANAGEMENT_API_URL: origin,
    } });
    try {
      // Cold npx installs on Windows can exceed the SDK's 60-second initialization timeout.
      await client.connect(transport, { timeout: process.platform === 'win32' ? 180_000 : 60_000 });
      const tools = (await client.listTools()).tools;
      assert.deepEqual(tools.map(tool => tool.name).sort(), [task.source, 'get_pricing', 'get_job', 'get_result'].sort());
      assert.deepEqual(tools.find(tool => tool.name === 'get_pricing').inputSchema.properties.source.enum, [task.source]);
      const price = await client.callTool({ name: 'get_pricing', arguments: {} });
      assert.equal(price.structuredContent.prices[0].source, task.source);
      const other = catalog.find(entry => entry.source !== task.source).source;
      assert.equal((await client.callTool({ name: other, arguments: {} })).structuredContent.code, 'source_forbidden');
      assert.equal((await client.callTool({ name: 'get_job', arguments: { job_id: 'job_other' } })).structuredContent.code, 'source_forbidden');
      assert.equal(requests.filter(request => request.method !== 'GET').length, 0);
    } finally {
      await client.close();
    }
  });
});
