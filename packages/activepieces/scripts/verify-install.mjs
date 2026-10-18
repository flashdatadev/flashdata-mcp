import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('..', import.meta.url));
const tasks = JSON.parse(await readFile(resolve(root, 'tasks.json'), 'utf8'));
const npm = process.env.npm_execpath ?? fileURLToPath(new URL('../lib/node_modules/npm/bin/npm-cli.js', `file://${process.execPath}`));
function command(args, cwd) {
  return execFileSync(process.execPath, [npm, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 });
}
const target = resolve(root, 'dist/tarballs');
await mkdir(target, { recursive: true });
const temp = await mkdtemp(resolve(tmpdir(), 'flashdata-activepieces-install-'));
const report = [];
try {
  for (const task of tasks) {
    const packed = JSON.parse(command(['pack', '--ignore-scripts', '--json', '--pack-destination', target], resolve(root, 'dist', task.slug)))[0];
    const tarball = resolve(target, packed.filename);
    const dir = resolve(temp, task.slug);
    await mkdir(dir);
    await writeFile(resolve(dir, 'package.json'), '{"private":true}');
    command(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball], dir);
    const name = `@flashdata-dev/piece-${task.slug}`;
    const result = JSON.parse(execFileSync(process.execPath, ['-e', `const assert=require('node:assert/strict');const p=Object.values(require(${JSON.stringify(name)}));assert.equal(p.length,1);assert.equal(p[0].constructor.name,'Piece');console.log(JSON.stringify({displayName:p[0].displayName,actions:Object.keys(p[0].actions())}));`], { cwd: dir, encoding: 'utf8' }));
    if (result.displayName !== `${task.title} — FlashData` || result.actions.length !== (task.source === 'youtube_download' ? 3 : 1)) throw new Error('Installed Piece differs.');
    report.push({ source: task.source, name, tarball: packed.filename, sha256: createHash('sha256').update(await readFile(tarball)).digest('hex'), ...result });
  }
  const together = resolve(temp, 'together');
  await mkdir(together);
  await writeFile(resolve(together, 'package.json'), '{"private":true}');
  command(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', ...report.map(item => resolve(target, item.tarball))], together);
  execFileSync(process.execPath, ['-e', `const assert=require('node:assert/strict');for(const name of ${JSON.stringify(report.map(item => item.name))})assert.equal(Object.values(require(name))[0].constructor.name,'Piece');`], { cwd: together });
  await writeFile(resolve(root, 'dist/install-report.json'), JSON.stringify({ isolated: report.length, together: report.length, packages: report }, null, 2) + '\n');
  console.log(`Verified ${report.length} isolated tarball installs and ${report.length} coinstalled Pieces (offline, no API execution).`);
} finally { await rm(temp, { recursive: true, force: true }); }
