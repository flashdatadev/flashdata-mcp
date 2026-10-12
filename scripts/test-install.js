const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runNpm } = require('./npm');

const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-mcp-install-'));
const options = { cwd: root, encoding: 'utf8' };
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
try {
  const [packed] = JSON.parse(runNpm(['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], options));
  fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true }));
  runNpm(['install', '--prefix', temporary, '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, packed.filename)], {
    ...options, stdio: 'inherit',
  });
  execFileSync(process.execPath, ['--test', path.join(root, 'test/stdio.test.js'), path.join(root, 'test/cli.test.js')], {
    cwd: temporary, stdio: 'inherit', env: {
      ...process.env,
      FLASHDATA_CLI_TEST_BIN: path.join(temporary, 'node_modules', manifest.name, manifest.bin.flashdata),
      FLASHDATA_MCP_TEST_BIN: path.join(temporary, 'node_modules', manifest.name, manifest.bin['flashdata-mcp']),
    },
  });
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
