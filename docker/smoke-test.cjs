const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

async function inside(source, entrypoint, example) {
  const http = require('node:http');
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
  const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
  const sources = SOURCE_CATALOG.map(item => item.id);
  const requests = [];
  let scopes = sources;
  let revoked = false;
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : null;
    requests.push({ method: req.method, url: req.url, body });
    res.setHeader('content-type', 'application/json');
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (revoked) return send(401, { code: 'invalid_api_key' });
    if (req.url === '/v2/api-access') return send(200, { sources: scopes, result_origin: null });
    if (req.url.startsWith('/v2/api-access/pricing')) return send(200, { source });
    if (req.url === '/v1/queries') return send(202, { id: 'job_fixture', status: 'pending' });
    if (req.url === '/v1/queries/realtime') return send(200, { results: [{ source: body.source }] });
    return send(404, { code: 'fixture_unknown_path' });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${upstream.address().port}`;
  const client = new Client({ name: 'container-smoke', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: entrypoint[0], args: entrypoint.slice(1), stderr: 'pipe', env: {
    FLASHDATA_API_KEY: 'offline-fixture-key',
    FLASHDATA_MANAGEMENT_API_URL: origin,
    FLASHDATA_DATA_API_URL: origin,
    FLASHDATA_TASK_SOURCE: sources.find(item => item !== source),
  } });
  let stderr = '';
  transport.stderr.on('data', chunk => { stderr += chunk; });
  try {
    await client.connect(transport);
    assert.equal(client.getServerVersion().name, `flashdata-${source.replaceAll('_', '-')}`);
    assert.equal(client.getServerVersion().version, require('../package.json').version);
    const tools = (await client.listTools()).tools;
    assert.deepEqual(new Set(tools.map(tool => tool.name)), new Set([source, 'get_pricing', 'get_job', 'get_result']));
    assert.deepEqual(tools.find(tool => tool.name === 'get_pricing').inputSchema.properties.source.enum, [source]);
    const call = (name, args = {}) => client.callTool({ name, arguments: args });
    assert.equal((await call('get_pricing')).isError, false);
    for (const other of sources.filter(item => item !== source)) {
      assert.equal((await call(other, {})).structuredContent.code, 'source_forbidden');
    }
    assert.equal((await call('submit_batch', {})).structuredContent.code, 'source_forbidden');
    assert.equal(requests.filter(req => req.method === 'POST').length, 0);
    assert.equal((await call(source, example.arguments)).isError, false);
    const posts = requests.filter(req => req.method === 'POST');
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.source, source);
    assert.equal(posts[0].url, source === 'youtube_download' ? '/v1/queries' : '/v1/queries/realtime');
    scopes = [];
    assert.deepEqual((await client.listTools()).tools, []);
    assert.equal((await call(source, example.arguments)).structuredContent.code, 'source_forbidden');
    revoked = true;
    await assert.rejects(call('get_pricing'), /invalid or revoked/);
    assert.equal(requests.filter(req => req.method === 'POST').length, 1);
    assert.equal(stderr, '');
    console.log(`${source}: container stdio, 4 tools, isolation, mock query, scope revocation passed`);
  } finally {
    await client.close();
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
}

async function main() {
  if (process.argv[2] === '--inside') {
    return inside(process.argv[3], JSON.parse(process.argv[4]), JSON.parse(process.argv[5]));
  }
  const root = path.resolve(__dirname, '..');
  const { tasks } = require('../smithery/tasks.json');
  for (const { source } of tasks) {
    const target = source.replaceAll('_', '-');
    const image = `mcp/flashdata-${target}`;
    execFileSync('docker', ['build', '--target', target, '-t', image, '.'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
    const config = JSON.parse(execFileSync('docker', ['image', 'inspect', image], { encoding: 'utf8' }))[0].Config;
    assert.equal(config.User, 'node');
    assert.deepEqual(config.Entrypoint, ['node', 'docker/task-server.cjs', source]);
    assert.ok(!config.Env.some(value => value.startsWith('FLASHDATA_API_KEY=')));
    execFileSync('docker', ['run', '--rm', '--network', 'none', '--read-only',
      '--mount', `type=bind,source=${__filename},target=/app/docker/smoke-test.cjs,readonly`,
      '--entrypoint', 'node', image, 'docker/smoke-test.cjs', '--inside', source,
      JSON.stringify(config.Entrypoint), JSON.stringify(require(`../registry/examples/${source}.json`)),
    ], { stdio: 'inherit' });
  }
  console.log('15 container targets passed. Runtime networking disabled; no live credentials or paid API calls.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
