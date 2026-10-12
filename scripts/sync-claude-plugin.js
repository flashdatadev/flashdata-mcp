const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'plugins', 'claude');
const check = process.argv.includes('--check');
const shared = ['skills/flashdata', 'assets/logo.svg', 'LICENSE'];

// The directory requires regular files contained in the plugin, not symlinks.
function filesAt(base) {
  if (!fs.existsSync(base)) return [];
  if (fs.statSync(base).isFile()) return [''];
  return fs.readdirSync(base, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.relative(base, path.join(entry.parentPath, entry.name)))
    .sort();
}

for (const entry of shared) {
  const source = path.join(root, entry);
  const destination = path.join(target, entry);
  if (check) {
    const files = filesAt(source);
    const matches = JSON.stringify(files) === JSON.stringify(filesAt(destination))
      && files.every(file => fs.readFileSync(path.join(source, file))
        .equals(fs.readFileSync(path.join(destination, file))));
    if (!matches) throw new Error(`Outdated Claude plugin copy: ${entry}. Run npm run sync:claude-plugin.`);
  } else {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  }
}

process.stdout.write(`Claude plugin shared files ${check ? 'verified' : 'synchronized'}.\n`);
