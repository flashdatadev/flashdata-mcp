# Google News Search MCP

Search Google News by topic, country and language. Get headlines, publisher names, date labels and article links for a news brief. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_news)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-news-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-news/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_news`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_news.md).
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

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_news.md) for a representative response and instructions for reading large results without repeating the paid request.
