const { runNpm } = require('./npm');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packed = JSON.parse(runNpm(['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}))[0];
const required = ['package.json', 'LICENSE', 'README.md', 'README.zh-CN.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'bin/flashdata-mcp.js', 'bin/flashdata.js', 'src/index.js'];
const files = packed.files.map(file => file.path);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const target of [manifest.main, ...Object.values(manifest.bin), ...Object.values(manifest.exports)]) {
  if (typeof target !== 'string' || !files.includes(target.replace(/^\.\//, ''))) {
    throw new Error(`Unpacked package entry: ${target}`);
  }
}
for (const file of required) {
  if (!files.includes(file)) throw new Error(`Missing release file: ${file}`);
}
for (const file of files) {
  if (!required.includes(file) && !file.startsWith('src/')) throw new Error(`Unexpected release file: ${file}`);
  if (!file.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of content.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)) {
    const resolved = path.resolve(root, path.dirname(file), match[1]);
    if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Import leaves package: ${file}`);
    const relative = path.relative(root, resolved).split(path.sep).join('/');
    if (!files.includes(relative) && !files.includes(`${relative}.js`)) throw new Error(`Unpacked dependency: ${file} -> ${relative}`);
  }
}
process.stdout.write(`Verified ${files.length} publishable files (${packed.unpackedSize} bytes).\n`);
