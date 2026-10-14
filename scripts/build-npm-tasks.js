const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { runNpm } = require('./npm');
const { SOURCE_CATALOG, QUERY_MODES } = require('../src/catalog/sourceCatalog');
const { listTaskTools } = require('../src/mcp/taskTools');
const catalog = require('../npm/tasks.json');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist/npm'));
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const rootPackage = require('../package.json');
if (new Set(catalog.tasks.map(task => task.slug)).size !== 15
  || JSON.stringify(catalog.tasks.map(task => task.source).sort()) !== JSON.stringify(SOURCE_CATALOG.map(source => source.id).sort())) {
  throw new Error('npm task catalog must contain exactly the 15 supported sources.');
}
fs.mkdirSync(output, { recursive: true });
const index = [];
for (const task of catalog.tasks) {
  const directory = path.join(output, task.slug);
  if (fs.existsSync(directory)) throw new Error(`Refusing to overwrite a task build: ${directory}`);
  fs.mkdirSync(directory);
  const name = `@flashdata-dev/${task.slug}`;
  const command = `flashdata-${task.slug}`;
  const source = SOURCE_CATALOG.find(item => item.id === task.source);
  const homepage = `https://flashdata.dev/docs/sources/${task.source}?utm_source=npm&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=${task.source}-task`;
  const manifest = {
    name, version: catalog.version, description: task.description, license: 'MIT', type: 'commonjs',
    author: { name: 'FlashData', email: 'support@flashdata.dev' }, homepage,
    repository: { type: 'git', url: rootPackage.repository.url, directory: `npm/docs/${task.slug}` },
    bugs: rootPackage.bugs, engines: rootPackage.engines,
    bin: { [command]: 'bin/run.js' }, exports: { './package.json': './package.json' },
    files: ['bin/', 'runtime/', 'examples/', 'schema.json', 'README.md', 'LICENSE', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md'],
    publishConfig: { access: 'public', registry: 'https://registry.npmjs.org' },
    dependencies: rootPackage.dependencies, keywords: task.keywords,
  };
  fs.writeFileSync(path.join(directory, 'package.json'), json(manifest));
  fs.cpSync(path.join(root, 'src'), path.join(directory, 'runtime'), { recursive: true });
  // Each artifact contains only its own data schema, even with a broadly scoped API key.
  fs.writeFileSync(path.join(directory, 'runtime/catalog/sourceCatalog.js'),
    `const SOURCE_CATALOG = Object.freeze(${JSON.stringify([source])});\nconst QUERY_MODES = Object.freeze(${JSON.stringify(QUERY_MODES)});\nmodule.exports = { SOURCE_CATALOG, QUERY_MODES, listSources: () => SOURCE_CATALOG };\n`);
  fs.mkdirSync(path.join(directory, 'bin'));
  fs.writeFileSync(path.join(directory, 'bin/run.js'),
    `#!/usr/bin/env node\nrequire('../runtime/cli').runCli({ name: ${JSON.stringify(command)}, version: require('../package.json').version, taskSource: ${JSON.stringify(task.source)} });\n`, { mode: 0o755 });
  for (const file of ['LICENSE', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md']) fs.copyFileSync(path.join(root, file), path.join(directory, file));
  fs.copyFileSync(path.join(root, 'npm/docs', task.slug, 'README.md'), path.join(directory, 'README.md'));
  fs.mkdirSync(path.join(directory, 'examples'));
  fs.writeFileSync(path.join(directory, 'examples/query.json'), json(require(`../registry/examples/${task.source}.json`).arguments));
  fs.writeFileSync(path.join(directory, 'schema.json'), json(listTaskTools(task.source).find(tool => tool.name === task.source).inputSchema));
  const [packed] = JSON.parse(runNpm(['pack', '--json', '--ignore-scripts', '--pack-destination', output], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  for (const file of packed.files) {
    if (!['package.json', 'README.md', 'LICENSE', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'schema.json'].includes(file.path)
      && !['bin/', 'runtime/', 'examples/'].some(prefix => file.path.startsWith(prefix))) throw new Error(`Unexpected package file: ${file.path}`);
  }
  const tarball = path.join(output, packed.filename);
  index.push({ source: task.source, slug: task.slug, name, command, version: catalog.version,
    filename: packed.filename, integrity: packed.integrity, sha256: createHash('sha256').update(fs.readFileSync(tarball)).digest('hex'),
    bytes: packed.size, unpackedBytes: packed.unpackedSize, files: packed.files.map(file => file.path),
    url: `https://www.npmjs.com/package/${name}`, homepage });
  process.stdout.write(`${name}@${catalog.version}: ${packed.size} bytes\n`);
}
fs.writeFileSync(path.join(output, 'index.json'), json(index));
