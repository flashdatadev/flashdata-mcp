# npm releases

The combined package `@flashdata-dev/mcp` contains the `flashdata` JSON CLI and `flashdata-mcp` stdio server. The [15 task packages](npm/README.md) each expose one capability through a single executable, with an optional `mcp` subcommand. Node.js 22.18 or newer is required. Hosted MCP Registry, Smithery, Skills and client plugin releases are separate from npm.

## Prepare reviewed artifacts

1. Work from reviewed, clean `main`. The combined version is in `package.json` and `package-lock.json`; task versions and metadata are in `npm/tasks.json`. Combined and task versions are independent. Never overwrite a published version or replace a released artifact.
2. Run `npm ci`, `npm test`, `npm run check:package`, `npm run check:claude-plugin`, `npm run test:install`, and `npm audit --audit-level=high`. Build and test the Smithery bundles as in CI to check shared-runtime compatibility. The GitHub workflow must pass on Ubuntu and Windows.
3. Run `npm run build:npm-tasks -- <fresh-artifact-directory>` and `npm run test:npm-tasks -- <same-directory>`. The test installs all 15 packed artifacts in a temporary project, then exercises every CLI and MCP server against local fixtures. Preserve the generated `index.json`, SHA-256 values and npm integrities. Builds refuse to overwrite existing task directories.
4. Run `npm pack --pack-destination <artifact-directory>` for the combined package. Its prepack hook runs tests and checks the file allowlist. Preserve its SHA-256 and registry integrity too.
5. Inspect each task README, manifest, source-specific schema, `examples/query.json`, fixed entry point and file list. Artifacts must contain no credentials, tests, private backend code or node_modules. Check public registry state for each exact name/version before publishing.
6. Use a dedicated npm user configuration. Run `npm whoami --userconfig <private-npmrc> --registry https://registry.npmjs.org` and require the exact identity `flashdata-dev`. If login expired, use `npm login --auth-type=web` with the same options; the account owner completes npm’s verification. Never commit that configuration or paste tokens into an issue.

## Publish and verify

Publish the exact reviewed tarball using the authenticated publisher, for example:

```sh
npm publish /absolute/path/flashdata-dev-google-news-0.1.0.tgz --access public --userconfig /absolute/path/private-npmrc --registry https://registry.npmjs.org
```

Use each manifest’s exact name, version and artifact filename, including the combined package when it is part of the release. Complete npm’s required account or 2FA verification. If an upload’s outcome is unclear, inspect that exact registry name/version before repeating it. Do not replace an existing version or assume that one successful package means the others were published.

Verify each public registry version and integrity. Install the exact public versions into a fresh temporary project and test their actual executables. With a new npm cache, verify npx resolution for every task package:

```sh
npx --yes @flashdata-dev/google-news@0.1.0 --version
npx --yes @flashdata-dev/google-news@0.1.0 --help
```

For the combined package, explicitly choose one of its two bins:

```sh
npx --yes --package=@flashdata-dev/mcp@0.2.0 flashdata --version
npx --yes --package=@flashdata-dev/mcp@0.2.0 flashdata-mcp --version
```

With a protected test key, run task `tools` and `call get_pricing`. These reads are free. Never embed the key in a command argument, tarball, log or release note. Tests of paid operations need an explicit budget; a timed-out query must not be automatically retried. Download tests must not write to real storage without authorization.

Record the source commit, exact artifact fingerprints, public package IDs/URLs, installed version checks and free-read evidence. Read all 15 public npm pages and their README/homepage links. Test at least the primary and alias query for each task under recorded, comparable conditions. npm website search, npm CLI/registry search and external search are different surfaces; local tool discovery proves no public ranking. Publication, README synchronization, search discovery, website referral and actual conversion are separate milestones.

Only mark an individual package public after the registry, public package page and installation work. Keep incomplete search or referral acceptance open. Future automation can use a package-specific npm Trusted Publisher; another package’s publisher configuration does not authorize these packages.
