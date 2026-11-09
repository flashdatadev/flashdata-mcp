const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runNpm } = require('./npm');
const { packCombined } = require('./build-npm');

const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-mcp-install-'));
const options = { cwd: root, encoding: 'utf8' };
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const readmes = ['README.md', 'README.zh-CN.md'];
const originals = readmes.map(name => fs.readFileSync(path.join(root, name), 'utf8'));
try {
  const packed = packCombined(temporary);
  fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true }));
  runNpm(['install', '--prefix', temporary, '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, packed.filename)], {
    ...options, stdio: 'inherit',
  });
  const installed = path.join(temporary, 'node_modules', manifest.name);
  for (const [index, name] of readmes.entries()) {
    const readme = fs.readFileSync(path.join(installed, name), 'utf8');
    assert.match(originals[index], /utm_source=github/);
    assert.match(readme, /\/signup\?utm_source=npm/);
    assert.doesNotMatch(readme, /utm_source=github/);
    assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), originals[index]);
  }
  for (const file of packed.files.filter(file => /^(src|bin)\//.test(file.path))) {
    let expected = fs.readFileSync(path.join(root, file.path));
    // npm normalizes only the executable shebang's CRLF on Windows installation.
    if (file.path.startsWith('bin/')) expected = Buffer.from(expected.toString('utf8').replace(/^(#![^\r\n]*)\r\n/, '$1\n'));
    assert.deepEqual(fs.readFileSync(path.join(installed, file.path)), expected, file.path);
  }
  assert.throws(() => packCombined(temporary), /Refusing to overwrite/);
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
