# YouTube Extended Search MCP

Request a larger set of YouTube video matches for one keyword. Extended search accepts up to 700 requested results and has a higher per-query rate than standard search. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_search_extended)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-extended-search-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-extended-search/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_search_extended`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search_extended.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the extended-search rate; it estimates one query, not one video.

## Example: compare channels across up to 100 video matches

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_search_extended",
  "arguments": {
    "query": "battery recycling",
    "max_results": 100,
    "response_format": "json"
  }
}
```

Read `results[0].results`. Group records by `channelId` or `channelUrl` and retain `videoId` for each observed match. `max_results` sets a ceiling; the call does not guarantee that many distinct videos or provide a pagination cursor.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search_extended.md) for a representative response and instructions for reading large results without repeating the paid request.
