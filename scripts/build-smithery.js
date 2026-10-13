const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { zipSync } = require('fflate');
const Ajv = require('ajv');
const { runNpm } = require('./npm');
const { listTaskTools } = require('../src/mcp/taskTools');
const { SOURCE_CATALOG } = require('../src/catalog/sourceCatalog');
const catalog = require('../smithery/tasks.json');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist/smithery'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-mcpb-'));
const validateManifest = new Ajv({ strict: false, validateFormats: false })
  .compile(require('./vendor/mcpb-manifest-v0.3.schema.json'));
const json = value => `${JSON.stringify(value, null, 2)}\n`;

if (new Set(catalog.tasks.map(task => task.slug)).size !== SOURCE_CATALOG.length
  || JSON.stringify(catalog.tasks.map(task => task.source).sort()) !== JSON.stringify(SOURCE_CATALOG.map(source => source.id).sort())) {
  throw new Error('Smithery catalog must contain all 15 unique task sources and slugs.');
}

function archiveFiles(directory, prefix = '') {
  const files = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${prefix}${entry.name}`;
    if (entry.name === '.bin') continue;
    if (entry.isDirectory()) Object.assign(files, archiveFiles(path.join(directory, entry.name), `${relative}/`));
    else if (entry.isFile()) files[relative] = [fs.readFileSync(path.join(directory, entry.name)), { mtime: new Date('2026-01-01T00:00:00Z') }];
    else throw new Error(`Unexpected non-file in bundle: ${relative}`);
  }
  return files;
}

try {
  fs.mkdirSync(output, { recursive: true });
  for (const file of ['package.json', 'package-lock.json', 'LICENSE', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md']) {
    fs.copyFileSync(path.join(root, file), path.join(temporary, file));
  }
  fs.cpSync(path.join(root, 'src'), path.join(temporary, 'src'), { recursive: true });
  runNpm(['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: temporary, stdio: 'inherit' });
  // Runtime package metadata needs no publishing scripts or development dependencies.
  const runtimePackage = require('../package.json');
  fs.writeFileSync(path.join(temporary, 'package.json'), json({ name: runtimePackage.name, version: runtimePackage.version,
    type: runtimePackage.type, license: runtimePackage.license, engines: runtimePackage.engines, dependencies: runtimePackage.dependencies }));
  fs.unlinkSync(path.join(temporary, 'package-lock.json'));
  const common = archiveFiles(temporary);
  const index = [];
  for (const task of catalog.tasks) {
    const name = `flashdata-${task.slug}`;
    const qualifiedName = `flashdata/${task.slug}`;
    const description = fs.readFileSync(path.join(root, 'smithery/servers', task.slug, 'README.md'), 'utf8');
    const homepage = `https://flashdata.dev/docs/sources/${task.source}?utm_source=smithery&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=${task.source}-task`;
    const tools = listTaskTools(task.source);
    const manifest = { manifest_version: '0.3', name, display_name: `${task.title} — FlashData`, version: catalog.version,
      description: `${task.summary} Free local installation; FlashData API calls are paid.`, long_description: description,
      author: { name: 'FlashData', email: 'support@flashdata.dev', url: 'https://flashdata.dev' },
      homepage, documentation: homepage, support: 'https://github.com/flashdata-dev/flashdata-mcp/issues',
      repository: { type: 'git', url: 'https://github.com/flashdata-dev/flashdata-mcp' }, license: 'MIT',
      privacy_policies: ['https://flashdata.dev/legal/privacy'],
      server: { type: 'node', entry_point: 'server.js', mcp_config: { command: 'node', args: ['${__dirname}/server.js'],
        env: { FLASHDATA_API_KEY: '${user_config.api_key}' } } },
      user_config: { api_key: { type: 'string', title: 'FlashData API Key', description: `Create a key at https://flashdata.dev/app/api-keys with ${task.source} access. Data calls use paid Credits.`, sensitive: true, required: true } },
      tools: tools.map(({ name: toolName, description: toolDescription }) => ({ name: toolName, description: toolDescription })),
      tools_generated: false, compatibility: { platforms: ['darwin', 'win32', 'linux'], runtimes: { node: '>=22.18.0' } },
    };
    if (!validateManifest(manifest)) throw new Error(JSON.stringify(validateManifest.errors));
    const entry = `require('./src/mcp/runTaskServer').runTaskServer('${task.source}', require('./manifest.json')).catch(error => {\n  process.stderr.write('FlashData MCP: ' + error.message + '\\n');\n  process.exitCode = 1;\n});\n`;
    const bundle = zipSync({ ...common, 'manifest.json': Buffer.from(json(manifest)), 'server.js': Buffer.from(entry), 'README.md': Buffer.from(description) },
      { level: 6, mtime: new Date('2026-01-01T00:00:00Z') });
    if (bundle.length > 25 * 1024 * 1024) throw new Error(`Bundle exceeds Smithery 25 MiB limit: ${name}`);
    const filename = `${name}-${catalog.version}.mcpb`;
    fs.writeFileSync(path.join(output, filename), bundle, { flag: 'wx' });
    const payload = { type: 'stdio', runtime: 'node', serverCard: { serverInfo: { name, version: catalog.version }, tools },
      configSchema: { type: 'object', properties: { api_key: { type: 'string', title: manifest.user_config.api_key.title,
        description: manifest.user_config.api_key.description } }, required: ['api_key'] } };
    fs.writeFileSync(path.join(output, `${task.slug}.release.json`), json(payload));
    fs.writeFileSync(path.join(output, `${task.slug}.metadata.json`), json({ displayName: manifest.display_name, description,
      homepage, repositoryUrl: manifest.repository.url, license: 'MIT', unlisted: false,
      iconUrl: 'https://raw.githubusercontent.com/flashdata-dev/flashdata-mcp/main/assets/logo.svg' }));
    index.push({ source: task.source, qualifiedName, version: catalog.version, filename, bytes: bundle.length,
      sha256: createHash('sha256').update(bundle).digest('hex'), tools: tools.map(tool => tool.name) });
    process.stdout.write(`${qualifiedName}: ${bundle.length} bytes, ${tools.length} tools\n`);
  }
  fs.writeFileSync(path.join(output, 'index.json'), json(index));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
