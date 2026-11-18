# YouTube Video Metadata MCP

Look up a single YouTube video by ID. Request chapters for a navigation index, or leave formats out when you only need the title and description. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_metadata)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-metadata-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-metadata/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_metadata`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_metadata.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: read chapters for one video

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_metadata",
  "arguments": {
    "video_id": "dQw4w9WgXcQ",
    "include_formats": false,
    "include_chapters": true,
    "response_format": "json"
  }
}
```

Read `title`, `description` and any `chapters` in `results[0]`. Each returned chapter can include `start_time` and `end_time`; use them to link back to that point in the video. A video may have no chapters. Transcript retrieval is a separate call.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_metadata.md) for a representative response and instructions for reading large results without repeating the paid request.
