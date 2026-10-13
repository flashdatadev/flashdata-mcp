# MCPB manifest schema

`mcpb-manifest-v0.3.schema.json` and `MCPB-LICENSE` are unmodified files from
`@anthropic-ai/mcpb@2.1.2` (official npm distribution). The builder validates
against this schema and writes the ZIP-based MCPB format using `fflate`.
See https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md.

The MCPB authoring CLI is not a runtime or build dependency. Bundles contain
only production dependencies installed from this repository's lockfile.
