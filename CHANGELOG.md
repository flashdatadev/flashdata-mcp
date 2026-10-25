# Changelog

## 0.3.0 — unreleased

- Default local MCP text to Markdown; add explicit text and JSON presentation while preserving structured fields. REST and CLI defaults are unchanged.
- Describe tool inputs and structured outputs for all 22 tools.
- Retrieve complete Python example results, including Unicode chunks, without repeating paid queries.
- Rename the MCP research skill to `flashdata-mcp`, separate from the standalone CLI skill.
- Test Python examples on Windows and Linux; prepare npm metadata with the official repository links and SDK 1.32.1.

Publishing this source is separate from publishing npm, task packages, hosted MCP or marketplace entries.

## 2026-10-24 — Official repository

- Established `flashdatadev/flashdata-mcp` with the existing source history.
- Added the official repository links, Chinese setup guide and contributor notes.
- Added `flashdatadev/flashdata-skills` as the portable Skills installation source.
- Updated vulnerable transitive dependencies in the root lockfile; npm audit reports zero vulnerabilities.
- Included the Chinese README in the package content validation.
- Preserved existing package versions and distribution artifacts.

Earlier implementation history is available in Git commits. This repository setup
is not a new npm or MCP Registry package release.
