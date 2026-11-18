# Google News Search MCP

Search Google News by topic, country and language. Get headlines, publisher names, date labels and article links for a news brief. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_news)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-news-0.3.0.mcpb). Expected SHA-256: `ea6cc8fec85695f97948560ca4ffd365bd34eebcf19c2a49ef8497b8be869030`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_news`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_news.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: find US coverage of battery recycling

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "google_news",
  "arguments": {
    "query": "battery recycling",
    "gl": "us",
    "hl": "en",
    "num": 10,
    "response_format": "json"
  }
}
```

Read `results[0].news`. Keep `title`, `source`, `link`, `date` and any `snippet` together. A label such as “2 hours ago” is relative to the search; retain the collection time. Open the article URL to read the full story.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_news.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-news/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
