# YouTube License Metadata MCP

Look up whether a YouTube video carries a Creative Commons license label. The underlying tool is named `youtube_trainability`; it reports a label, not a decision about training rights. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_trainability)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-trainability-0.3.0.mcpb). Expected SHA-256: `6032e98e074918265669d084cf95b12fe9fcd90fca39651415b8d3fec3e3b0be`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_trainability`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_trainability.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: check the license label of one video

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_trainability",
  "arguments": {
    "video_id": "dQw4w9WgXcQ",
    "response_format": "json"
  }
}
```

Read `results[0].permitted` alongside `videoId` and the capture time. Preserve the classification as returned. This tool does not read the creator’s third-party training setting or grant permission to train models or reuse the video.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_trainability.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-trainability/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
