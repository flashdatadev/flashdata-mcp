# YouTube Autocomplete MCP

Enter a search prefix, language and region to see the phrases YouTube suggests. Use them to choose follow-up keywords before running a video search. Installation is free; each data request uses paid FlashData Credits.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_suggestions)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-autocomplete-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-autocomplete/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_suggestions`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_suggestions.md).
3. List the tools. Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Example: expand an English keyword in the US

Parameters for one paid MCP `tools/call` request:

```json
{
  "name": "youtube_suggestions",
  "arguments": {
    "query": "battery recycling",
    "language": "en",
    "region": "US",
    "response_format": "json"
  }
}
```

The strings in `results[0]` are suggested phrases. Keep the prefix and locale beside each phrase when comparing regions. Suggestions contain neither videos nor search-volume measurements.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_suggestions.md) for a representative response and instructions for reading large results without repeating the paid request.
