# Google Places Search MCP

Search for businesses by place or service, such as coffee shops in Singapore. Compare nearby matches by address, rating and number of reviews when available. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/google_places)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-places-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/google-places/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `google_places`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_places.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: shortlist coffee shops in Singapore

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "google_places",
  "arguments": {
    "query": "coffee shops in Singapore",
    "num": 20,
    "response_format": "json"
  }
}
```

Read `results[0].places`. Compare `rating` together with `ratingCount`; a single five-star review means something different from hundreds. Save `title` and `address` to distinguish locations. Missing ratings or contact details are unknown, not zero.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/google_places.md) for a representative response and instructions for reading large results without repeating the paid request.
