# npm releases

The public package is `@flashdata-dev/mcp`. It contains the `flashdata` JSON CLI and `flashdata-mcp` stdio server. Node.js 22.18 or newer is required. Hosted MCP Registry and client plugin releases are separate from npm.

## Prepare

1. Work from reviewed, clean `main`. Check the version in `package.json` and `package-lock.json`; npm versions cannot be overwritten.
2. Run `npm ci`, `npm test`, `npm run check:package`, `npm run check:claude-plugin`, `npm run test:install`, and `npm audit --audit-level=high`. The GitHub workflow must also pass on Ubuntu and Windows.
3. Run `npm pack --pack-destination <private-artifact-directory>`. Its prepack hook tests the package and checks its file allowlist. Preserve the tarball's SHA-256 and registry integrity in the release record.
4. Use a dedicated npm user configuration for the `flashdata-dev` publisher. Run `npm whoami --userconfig <private-npmrc> --registry https://registry.npmjs.org` and require the exact identity `flashdata-dev`. If login expired, use `npm login --auth-type=web` with the same options; complete npm's verification. Never commit that configuration or paste tokens into an issue.

## Publish and verify

Publish the exact reviewed tarball using the authenticated publisher:

```sh
npm publish /absolute/path/flashdata-dev-mcp-0.1.0.tgz --access public --userconfig /absolute/path/private-npmrc --registry https://registry.npmjs.org
```

Use the current version's filename. Confirm the package name, version and public access before publishing. Complete npm's required account or 2FA verification. If an upload's outcome is unclear, inspect the registry before repeating it.

Verify the public registry version and integrity, install that version into a fresh temporary project, and run its executables. Check public npx resolution explicitly because this package has two bins:

```sh
npx --yes --package=@flashdata-dev/mcp@0.1.0 flashdata --version
npx --yes --package=@flashdata-dev/mcp@0.1.0 flashdata-mcp --version
```

With a protected test key, run `flashdata tools` and `flashdata call get_pricing` once. These reads are free. Never embed the key in a command argument, tarball, log or release note. Tests of paid operations must have an explicit budget; a timed-out query must not be automatically retried.

Record the source commit, version, tarball integrity, installation and free-read evidence. Only mark npm live after the public package page and installation work. Future CI publishing can use a package-specific npm Trusted Publisher; another package's publisher configuration does not authorize this package.
