# Google Shopping Search MCP

Look up a product on Google Shopping in a specific country and language. Compare the prices displayed by different merchants at the time of the search. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_shopping)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-shopping-0.3.0.mcpb). Expected SHA-256: `4d3e2d7ad3579186995bd60498dff1ce46ff836ba99d086fa07ca698bae73be3`.
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_shopping`. For manual stdio configuration, use the **0.3.0 bundle above** with the [manual configuration example](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_shopping.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: compare headphone listings in the US

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "google_shopping",
  "arguments": {
    "query": "wireless headphones",
    "gl": "us",
    "hl": "en",
    "num": 10,
    "response_format": "json"
  }
}
```

Read `results[0].shopping`. Keep `title`, `source`, the original `price` string and any `productId` or `link`. Compare like currencies and variants; a displayed label does not establish availability, shipping costs or the checkout price.

For chunked output, use `get_result` with `result_id` and the returned `next_offset` (as `offset`) in the same running process. Concatenate chunks in order and parse them only when `encoding` is `json`. See the [sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_shopping.md#use-the-result).

The separate [Official MCP Registry manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-shopping/server.json) pins the official 0.1.1 compatibility package. The examples above target the direct 0.3.0 download.
