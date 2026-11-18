# Google Video Search MCP

Find videos across websites by searching Google’s video results. See which site hosts each result and its duration when Google provides one. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_videos)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-video-search-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-video-search/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_videos`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_videos.md).
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

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_videos.md) for a representative response and instructions for reading large results without repeating the paid request.
