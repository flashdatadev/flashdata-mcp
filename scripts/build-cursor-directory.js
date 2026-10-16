const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const catalog = require('../integrations/catalog.json');
const { tasks } = require('../npm/tasks.json');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist/cursor-directory'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const entries = [];
assert.equal(catalog.length, 15);

for (const task of catalog) {
  const npmTask = tasks.find(entry => entry.source === task.source);
  const repositoryName = `${npmTask.slug}-cursor`;
  const repository = `https://github.com/rocosen/${repositoryName}`;
  const directory = path.join(output, repositoryName);
  assert.ok(!fs.existsSync(directory), `Refusing to overwrite ${directory}`);
  const homepage = `${task.homepage}?utm_source=cursor-directory&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=${task.source}-task`;
  const skillPath = `skills/${task.name}`;
  const manifest = JSON.parse(read(`${task.cursorDirectory}/.cursor-plugin/plugin.json`));
  manifest.version = '0.1.1';
  manifest.repository = repository;
  manifest.homepage = homepage;
  // Directory installs components separately, without plugin variable settings.
  delete manifest.variables;
  const config = JSON.parse(read(`${task.cursorDirectory}/mcp.json`));
  config.mcpServers[task.name].type = 'stdio';
  config.mcpServers[task.name].env.FLASHDATA_API_KEY = '${env:FLASHDATA_API_KEY}';
  const setup = `## Install in Cursor\n\nThis repository contains one ${task.title} MCP server and one task Skill. Its cursor.directory submission and official Cursor Marketplace approval are separate. A public source repository is not proof of a directory listing.\n\n1. Install Node.js **22.18 or newer** with npm. Cursor must be able to find \`npx\` on its PATH; use \`npx.cmd\` on Windows if required.\n2. Get a source-enabled [FlashData API key](https://flashdata.dev/app/api-keys). Set \`FLASHDATA_API_KEY\` in the environment inherited by Cursor, then fully restart Cursor. The config uses Cursor's documented \`\${env:FLASHDATA_API_KEY}\` interpolation. Never put the key in chat, source control, or this Skill.\n3. Once a directory entry is public, its **MCP Servers → Add to Cursor** control installs only the server. Alternatively merge the \`mcpServers\` entry from [mcp.json](${repository}/blob/main/mcp.json) into your global \`~/.cursor/mcp.json\`; preserve other servers.\n4. Install the Skill separately by copying this repository's \`${skillPath}/\` directory to your project's \`.cursor/skills/${task.name}/\`. The directory may also offer a Skill install/copy control. Its text is self-contained; no local reference files are required to follow it.\n5. In **Customize**, check that \`${task.name}\` connects and exposes \`${task.source}\`, \`get_pricing\`, \`get_job\` and \`get_result\`. Ask for a free price check first: “Use ${task.name} to call get_pricing for ${task.source}, request_count 1. Do not submit a data query.” This checks access, not paid data retrieval.\n\nThe server downloads the pinned \`${task.npmPackage}\` package from npm on first launch. Installation is free; FlashData data requests use paid Credits. Cursor/model fees and applicable storage charges are separate. Organization policy can restrict local MCP servers. [Cursor MCP configuration](https://cursor.com/docs/context/mcp) · [Source documentation](${homepage}) · [Current API pricing](https://flashdata.dev/pricing).\n`;
  let guide = read(`npm/docs/${npmTask.slug}/README.md`)
    .replace(/https:\/\/flashdata\.dev\/docs\/sources\/[^\s)]+/g, homepage);
  guide = guide.replaceAll('Enter your own key through protected client settings.', 'For Cursor, use the environment interpolation shown in this repository’s mcp.json. Keep the key out of chat and source control.');
  let skill = read(`${task.cursorDirectory}/${skillPath}/SKILL.md`);
  skill = skill.replaceAll('(references/', `(${repository}/blob/main/${skillPath}/references/`)
    .replace("enter it in Cursor's protected extension/plugin setting", 'set FLASHDATA_API_KEY in the environment inherited by Cursor, then fully restart Cursor')
    .replaceAll(task.homepage, homepage);
  skill += `\n${setup}\n## Complete task reference\n\n${guide.replace(/^# .+\n/, '### Inputs, output handling and examples\n')}`;
  if (task.source === 'google_search') {
    skill = skill.replace('Build a small source list for a research question. Save each result’s position with its link and capture time so later comparisons use a recorded snapshot.', 'Find authoritative sources for an agent answer, such as official PostgreSQL documentation for logical replication. Return linked evidence with titles and snippets; distinguish snippets from pages actually read. Save the query, locale and retrieval time so the result is a traceable snapshot.');
  }
  const files = new Map([
    ['.cursor-plugin/plugin.json', json(manifest)],
    ['mcp.json', json(config)],
    ['README.md', `# ${task.title} for Cursor — FlashData\n\n${manifest.description}\n\n[Documentation](${homepage}) · [Get an API key](https://flashdata.dev/app/api-keys)\n\n${setup}\n${guide.replace(/^# .+\n/, '## Task guide\n')}`],
    [`${skillPath}/SKILL.md`, skill],
    ['LICENSE', read('LICENSE')],
    ['SECURITY.md', read('SECURITY.md')],
    ['assets/logo.svg', read('assets/logo.svg')],
  ]);
  for (const file of ['api.md', 'schema.json', 'query.json']) {
    files.set(`${skillPath}/references/${file}`, file === 'api.md' ? guide : read(`${task.cursorDirectory}/${skillPath}/references/${file}`));
  }
  for (const [relative, content] of files) {
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  entries.push({ source: task.source, name: task.name, title: `${task.title} — FlashData`, version: manifest.version,
    repositoryName, repository, directory: repositoryName, homepage, npmPackage: task.npmPackage,
    description: manifest.description, componentCount: 2, directoryId: null, directoryUrl: null });
}
fs.writeFileSync(path.join(output, 'catalog.json'), json(entries));
console.log(`Prepared ${entries.length} independent Cursor repositories at ${output}. No remote writes or API data calls performed.`);
