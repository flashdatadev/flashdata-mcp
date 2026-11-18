# Google Video Search MCP

Find videos across websites by searching Google’s video results. See which site hosts each result and its duration when Google provides one. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_videos)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-video-search-0.3.0.mcpb). Expected SHA-256: `08cff9f6f9c20060eaefa1c14f907a01e48ddc016145616983cff36f27e47f05`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_videos`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_videos.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: find sites with videos about battery recycling

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "google_videos",
  "arguments": {
    "query": "battery recycling process",
    "num": 10,
    "response_format": "json"
  }
}
```

Read `results[0].videos`. Keep `title`, `link`, `source` and any `duration`; group the links by hostname to compare sources. Results can come from several video sites and formats. This call returns search records, not media files.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_videos.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-video-search/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
