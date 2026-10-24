# Repository provenance and distribution

This official repository was established on 2026-10-24 from
[`rocosen/flashdata-mcp` at `c09d97d52a4354a50657cc0da2205f23c989add7`](https://github.com/rocosen/flashdata-mcp/commit/c09d97d52a4354a50657cc0da2205f23c989add7).
The Git commit history and original MIT copyright notice are retained. The personal
repository remains available for existing integrations and release downloads.

## Official repositories

- MCP implementation and client integrations: [flashdatadev/flashdata-mcp](https://github.com/flashdatadev/flashdata-mcp)
- Portable Skills: [flashdatadev/flashdata-skills](https://github.com/flashdatadev/flashdata-skills)
- Standalone CLI: [flashdatadev/flashdata-cli](https://github.com/flashdatadev/flashdata-cli)

The Skills repository starts with the 16 portable skills and their reference files
from the source revision above. Its MCP connection reference points here. This MCP
repository keeps its skill copies for compatibility with the bundled plugins.
Update corresponding copies together when changing a shared skill.

## Existing distribution identities

Creating the official repositories does not publish new npm/PyPI packages, move
GitHub Release assets, or update external marketplace listings. The existing npm
scope `@flashdata-dev` and MCP Registry namespace `io.github.flashdata-dev/*` are
separate identities from the GitHub account `flashdatadev`.

Historical Registry manifests, task integration metadata, generated subpackages,
and Homebrew formulae preserve their existing repository and download references.
Their artifacts continue to resolve from the personal repositories; published
versions and hashes must not be changed in place. Root package metadata, client
entry points and the portable Skill's connection guide now identify the official
source. Any later distribution migration needs its own version, metadata and
installation checks.

The imported PyPI publishing workflows retain their original repository guards;
they do not authorize this repository to publish. MCP Registry OIDC publication
requires the namespace owner `flashdata-dev`, not `flashdatadev`. Validation jobs
continue to run, but publishing requires the correct external publisher setup and
an explicit release task. No credentials were copied into this repository.
