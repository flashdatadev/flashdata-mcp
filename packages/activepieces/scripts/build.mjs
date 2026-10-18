import { build } from 'esbuild';
import { createRequire, builtinModules } from 'node:module';
import { mkdir, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
execFileSync(process.execPath, [resolve(root, 'scripts/generate.mjs'), '--check'], { stdio: 'inherit' });
const tasks = JSON.parse(await readFile(resolve(root, 'tasks.json'), 'utf8'));
const builtins = new Set([...builtinModules, ...builtinModules.map(name => `node:${name}`)]);
const summary = [];
for (const task of tasks) {
  const dir = resolve(root, 'pieces', task.slug);
  const dist = resolve(root, 'dist', task.slug);
  await mkdir(resolve(dist, 'src'), { recursive: true });
  const result = await build({ entryPoints: [resolve(dir, 'src/index.ts')], outfile: resolve(dist, 'src/index.js'),
    platform: 'node', target: 'node22', format: 'cjs', bundle: true, minify: true, keepNames: true,
    treeShaking: true, metafile: true, logLevel: 'silent', legalComments: 'eof' });
  if (result.warnings.length) throw new Error(JSON.stringify(result.warnings));
  const outputs = Object.values(result.metafile.outputs);
  for (const output of outputs) for (const entry of output.imports) {
    if (entry.external && !builtins.has(entry.path)) throw new Error(`Unexpected external import ${entry.path}`);
  }
  if (outputs.some(output => output.bytes > 5 * 1024 * 1024)) throw new Error('Bundle exceeds the official 5 MiB cap.');
  for (const name of ['package.json', 'README.md']) await copyFile(resolve(dir, name), resolve(dist, name));
  await copyFile(resolve(root, '../../LICENSE'), resolve(dist, 'LICENSE'));
  const dependencyRoots = new Set();
  for (const input of Object.keys(result.metafile.inputs)) {
    const match = input.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)/);
    if (match) dependencyRoots.add(resolve(match[1]));
  }
  const notices = [await readFile(resolve(root, 'ACTIVEPIECES-LICENSE.txt'), 'utf8')];
  for (const dir of [...dependencyRoots].sort()) {
    const manifest = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'));
    for (const filename of (await readdir(dir)).filter(name => /^(?:LICENSE|COPYING|NOTICE)(?:\.|$)/i.test(name))) {
      notices.push(`${manifest.name}@${manifest.version} — ${filename}\n${await readFile(resolve(dir, filename), 'utf8')}`);
    }
  }
  await writeFile(resolve(dist, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n-----\n\n'));
  const exported = Object.values(require(resolve(dist, 'src/index.js')));
  if (exported.length !== 1 || exported[0].constructor.name !== 'Piece') throw new Error('Invalid Piece export.');
  const piece = exported[0];
  summary.push({ source: task.source, package: JSON.parse(await readFile(resolve(dist, 'package.json'), 'utf8')).name,
    bytes: outputs.reduce((n, output) => n + output.bytes, 0), action_count: Object.keys(piece.actions()).length,
    minimumSupportedRelease: piece.minimumSupportedRelease });
  await writeFile(resolve(dist, '../', `${task.slug}.metadata.json`), JSON.stringify(piece.metadata(), null, 2) + '\n');
}
await writeFile(resolve(root, 'dist/build-summary.json'), JSON.stringify(summary, null, 2) + '\n');
for (const name of ['client', 'piece']) await build({ entryPoints: [resolve(root, 'src', `${name}.ts`)],
  outfile: resolve(root, 'dist/test', `${name}.cjs`), platform: 'node', target: 'node22', format: 'cjs', bundle: true, logLevel: 'silent' });
console.log(`Built ${summary.length} independently loadable Pieces / ${summary.reduce((n, p) => n + p.action_count, 0)} actions.`);
