# YouTube Video Search MCP

Search YouTube by keyword to build a shortlist of videos. Standard search accepts 1–20 requested results per query and can return video IDs, titles, channels and durations. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_search)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-search-0.3.0.mcpb). Expected SHA-256: `ed3e8fe5abf0f72513bfb2333120157437892a87b06173ed3ba67b8ebe101484`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_search`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search.md).
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

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_search.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-search/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
