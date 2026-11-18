# Google Shopping Search MCP

Look up a product on Google Shopping in a specific country and language. Compare the prices displayed by different merchants at the time of the search. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_shopping)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-shopping-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-shopping/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_shopping`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_shopping.md).
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

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_shopping.md) for a representative response and instructions for reading large results without repeating the paid request.
