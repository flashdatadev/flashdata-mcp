# Connect FlashData

Reuse an existing connection first. This skill does not provide a generic `flashdata` command or bundle an executable.

## Hosted MCP

- Endpoint: `https://data.flashdata.dev/mcp`
- Transport: Streamable HTTP
- API-key header for clients supporting custom headers: `X-API-Key`
- Setup reference: <https://flashdata.dev/mcp>
- Keys: <https://flashdata.dev/app/api-keys>

Configure the user's key through the MCP client's protected credential settings or environment-backed headers. Do not ask for a key in chat or put one into this skill, a URL, a repository, or a command-line argument. Use the client's documented configuration format; not every client supports custom API-key headers. Do not configure a protected server as unauthenticated to bypass that limitation.

FlashData also has OAuth endpoints, but a client requires a registered client ID and exact callback. Do not guess them or promise that an arbitrary client's OAuth connection already works.

## Local stdio alternative

The source repository includes a local MCP implementation:
<https://github.com/flashdata-dev/flashdata-mcp#run-locally>.

It requires Node.js 22.18 or newer. After the user authorizes installation, follow that repository's current setup instructions: install its dependencies with `npm ci`, configure `FLASHDATA_API_KEY` in the client's protected environment, and run `node` with the absolute path to `bin/flashdata-mcp.js`.

The `@flashdata/mcp` npm name is not a published installation path at this skill's release. Do not suggest `npx @flashdata/mcp` unless publication is independently verified. Installing the Skill with `npx skills add` is a separate operation from installing or configuring this MCP server.

## Free connection check

Discover tools, then call `get_pricing` with `{"source":"google_search","request_count":1}` if that source is permitted. This returns a quote; it does not execute Google Search. `get_balance` or `get_limits` can check an account without that source permission. Report only what was verified; a successful quote does not prove paid searches or transcript retrieval work.
