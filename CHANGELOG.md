# Changelog

## 0.3.0 — 2026-11-05

- Update follow-redirects to 1.16.2 to address the dependency audit finding.

- Add transcript/caption language lists, the omitted-language fallback and guidance for partial results. Other source APIs are unchanged.

- Default local MCP text to Markdown; add explicit text and JSON presentation while preserving structured fields. REST and CLI defaults are unchanged.
- Describe tool inputs and structured outputs for all 22 tools.
- Retrieve complete Python example results, including Unicode chunks, without repeating paid queries.
- Rename the MCP research skill to `flashdata-mcp`, separate from the standalone CLI skill.
- Test Python examples on Windows and Linux; prepare npm metadata with the official repository links and SDK 1.32.1.

Release archives include npm task packages 0.2.0 and Smithery bundles 0.2.0. npm and PyPI uploads are handled separately from GitHub Releases; pinned client integrations keep their verified published versions until those uploads are confirmed.

## 2026-10-24 — Official repository

- Established `flashdatadev/flashdata-mcp` with the existing source history.
- Added the official repository links, Chinese setup guide and contributor notes.
- Added `flashdatadev/flashdata-skills` as the portable Skills installation source.
- Updated vulnerable transitive dependencies in the root lockfile; npm audit reports zero vulnerabilities.
- Included the Chinese README in the package content validation.
- Preserved existing package versions and distribution artifacts.

Earlier implementation history is available in Git commits. This repository setup
is not a new npm or MCP Registry package release.
