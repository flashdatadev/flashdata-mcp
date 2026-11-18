# YouTube Channel Data MCP

Look up a YouTube channel by handle and request a snapshot of its recent videos. Use the channel ID to compare uploads across snapshots. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_channel)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-channel-0.3.0.mcpb). Expected SHA-256: `1b800b03f212520b8a5f2f17cb4cb0ae18711ee52f9226963f5ab2041d6b45ee`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_channel`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_channel.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: look up a channel and ten recent videos

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_channel",
  "arguments": {
    "handle": "@jawed",
    "video_limit": 10,
    "response_format": "json"
  }
}
```

Read `channelId`, `channelHandle`, `name` and `videos` in `results[0]`. Keep each `videoId` with its available metrics. `video_limit` accepts 1–100; fewer videos can be returned, and this is not a full channel archive.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_channel.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-channel/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
