# YouTube Extended Search MCP

Request a larger set of YouTube video matches for one keyword. Extended search accepts up to 700 requested results and has a higher per-query rate than standard search. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_search_extended)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-extended-search-0.3.0.mcpb). Expected SHA-256: `3ccf7571df72fe82dad7d84c423d8286a87732abf0ee19fb540e5888b6103f04`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_search_extended`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search_extended.md).
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

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search_extended.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-extended-search/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
