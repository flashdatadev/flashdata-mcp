const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runNpm } = require('./npm');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist/npm'));
const index = JSON.parse(fs.readFileSync(path.join(output, 'index.json'), 'utf8'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdata-npm-tasks-'));
try {
  fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true }));
  runNpm(['install', '--prefix', temporary, '--ignore-scripts', '--no-audit', '--no-fund',
    ...index.map(entry => path.join(output, entry.filename))], { cwd: root, stdio: 'inherit' });
  const installed = index.map(entry => ({ ...entry, bin: path.join(temporary, 'node_modules', entry.name, 'bin/run.js') }));
  const installedIndex = path.join(temporary, 'installed.json');
  fs.writeFileSync(installedIndex, JSON.stringify(installed));
  execFileSync(process.execPath, ['--test', path.join(root, 'test/npm-tasks.test.js'), path.join(root, 'test/task-servers.test.js')], {
    cwd: temporary, stdio: 'inherit', env: { ...process.env, FLASHDATA_TASK_NPM_INDEX: installedIndex },
  });
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
