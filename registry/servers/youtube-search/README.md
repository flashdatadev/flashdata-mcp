# YouTube Video Search MCP

Search YouTube by keyword to build a shortlist of videos. Standard search accepts 1–20 requested results per query and can return video IDs, titles, channels and durations. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_search)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-search-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-search/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_search`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: find ten videos on battery recycling

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_search",
  "arguments": {
    "query": "battery recycling",
    "max_results": 10,
    "response_format": "json"
  }
}
```

Read `results[0].results`. Use `videoId` to build a watch URL; retain `title`, `channel`, `channelUrl`, `viewCount` and `duration` when available. The actual count can be lower. Retrieving a transcript or detailed metadata requires a separate paid call.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search.md) for a representative response and instructions for reading large results without repeating the paid request.
