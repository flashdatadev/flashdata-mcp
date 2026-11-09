const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runNpm } = require('./npm');
const { npmReadme } = require('./npm-readme');

const root = path.resolve(__dirname, '..');

function packCombined(output) {
  output = path.resolve(output);
  fs.mkdirSync(output, { recursive: true });
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  const [preview] = JSON.parse(runNpm(['pack', '--dry-run', '--json', '--ignore-scripts'], { ...options, cwd: root }));
  if (fs.existsSync(path.join(output, preview.filename))) throw new Error(`Refusing to overwrite ${preview.filename}`);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-npm-stage-'));
  try {
    for (const { path: file } of preview.files) {
      const destination = path.join(staging, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(root, file), destination);
      if (['README.md', 'README.zh-CN.md'].includes(file)) {
        fs.writeFileSync(destination, npmReadme(fs.readFileSync(destination, 'utf8')));
      }
    }
    const [packed] = JSON.parse(runNpm(['pack', '--json', '--ignore-scripts', '--pack-destination', output], { ...options, cwd: staging }));
    return packed;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

if (require.main === module) {
  process.stdout.write(`${JSON.stringify(packCombined(process.argv[2] || path.join(root, 'dist/npm-combined')), null, 2)}\n`);
}

module.exports = { packCombined };
