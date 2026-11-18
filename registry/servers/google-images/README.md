# Google Images Search MCP

Search Google Images by keyword to find the original page behind an image. Returned records can include the image URL and its pixel dimensions. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_images)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-images-0.3.0.mcpb). Expected SHA-256: `2ebea6354f5a2395fb154eb8845d206ad07d5f9cd7a4c6c00d5e9b8d2e2bd6cc`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_images`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_images.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: find diagrams by image width

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "google_images",
  "arguments": {
    "query": "solar panel diagram",
    "num": 20,
    "response_format": "json"
  }
}
```

Read `results[0].images`. Filter on `imageWidth` and `imageHeight` when present; keep `imageUrl` with `link` so you can visit the source. The response contains metadata, not image files or reuse rights.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_images.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-images/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
