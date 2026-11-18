# Google Search MCP

Search Google by keyword, country and language. Get the position, title, URL and snippet for each organic result. This local MCP server requires a FlashData API key with Google Search access. Installation is free; each search page uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [Google Search API documentation](https://flashdata.dev/docs/sources/google_search)

## Install

1. Install Node.js **22.18 or newer**. Download [Google Search MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-search-0.3.0.mcpb) from FlashData's official release. The [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-search/server.json) includes its SHA-256 checksum.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key** and enable `google_search` for that key. For a client with manual stdio configuration, follow the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_search.md).
3. List the tools and call `get_pricing` with `{"request_count":1}` to see the price of one search page. Pricing, job and result reads are free; running the search uses Credits.

## Example: get US search results in English

These are the parameters for one paid MCP `tools/call` request. `num` specifies the requested number of results, not the number of paid queries.

```json
{
  "name": "google_search",
  "arguments": {
    "query": "battery recycling research",
    "gl": "us",
    "hl": "en",
    "num": 10,
    "response_format": "json"
  }
}
```

Read `results[0].organic`. Each record can contain `position`, `title`, `link` and `snippet`. Keep the query, country, language and capture time with the results when comparing rankings. The number of results can vary; snippets do not contain the full page text.

For background requests, use `get_job` with the returned job ID. For a chunked result, use `get_result` with its `result_id` and `next_offset` in the same running client; do not pay for the search again. See the [full guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_search.md).
