# Contributing

Use Node.js 22.18 or newer. Run `npm ci`, `npm test`, `npm run check:package`,
`npm run check:claude-plugin`, `npm run check:task-integrations` and
`npm run test:install` before submitting a pull request. The workflow also checks
published task integrations and builds source-restricted packages.

Use local fixtures and placeholder credentials. Do not submit paid API queries as
part of tests. Include the affected version, runtime, expected behavior and a
minimal reproduction in issues; remove keys, storage credentials, signed URLs and
private result data. Report vulnerabilities privately as described in SECURITY.md.

Portable skills are maintained in https://github.com/flashdatadev/flashdata-skills.
When changing shared skill content, update the compatibility copies here and run
`npm run sync:claude-plugin`. Follow RELEASING.md for package releases and
PROVENANCE.md for repository and publisher identities.
