# Glama build and schema inspection

The local server runs directly from JavaScript; there is no `build` script.
Configure the Glama Dockerfile admin page with:

- Node.js: `24`
- Build steps: `["npm ci --omit=dev"]`
- CMD arguments: `["mcp-proxy", "--", "node", "bin/flashdata-mcp.js"]`
- Placeholder parameters: `{"FLASHDATA_SCHEMA_ONLY":"true"}`

Include `FLASHDATA_SCHEMA_ONLY` as an optional string in the environment schema,
with default `"false"`. Keep `FLASHDATA_API_KEY` required for normal deployments.
Only Glama's inspection placeholders should set schema-only mode to `"true"`.
Never put a real account key in placeholder parameters.

Schema-only mode starts the same stdio entry point and serves the actual public
tool definitions. It constructs no API clients and rejects every tool call,
including account reads, downloads, batch submission and cached-result reads.
It explicitly reports this limitation in MCP initialization instructions.
This verifies startup and tool definitions, not authenticated data retrieval.

Normal deployments must leave the mode disabled and use the customer's own
`FLASHDATA_API_KEY`. Existing key validation, per-source permissions and billing
are unchanged. After a successful build test, create a Glama release; Glama then
queues the tool definitions for TDQS evaluation. This does not publish to npm.
