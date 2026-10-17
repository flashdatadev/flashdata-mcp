# Google Shopping — FlashData

Search Google Shopping for products, merchants and price labels. Collect comparable offer snapshots with product IDs and source links.

[API documentation and account setup](https://flashdata.dev/docs/sources/google_shopping) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## A task to try

> Build a wireless-headphone offer comparison sheet with product names, merchant names, links and the original price labels. Keep different currencies separate and flag missing prices.

## Install and connect

1. Use Node.js **22.18 or newer** and an MCP client that supports local stdio servers. Download the [dedicated MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-google-shopping-0.1.1.mcpb); its SHA-256 is recorded in the [manifest](https://github.com/rocosen/flashdata-mcp/blob/main/registry/servers/google-shopping/server.json).
2. Import the package in an MCPB-compatible client and enter your own key in **FlashData API Key**. Grant the key access to `google_shopping`. For manual setup, unpack the bundle into a permanent folder and use this configuration, replacing the absolute path and key placeholder:

```json
{
  "mcpServers": {
    "google-shopping": {
      "command": "node",
      "args": [
        "/absolute/path/to/unpacked/google-shopping/server.js"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Restart or reconnect the client, list its tools, then call `get_pricing` with `{"source":"google_shopping","request_count":1}` before approving a paid request. This server exposes `google_shopping`, `get_pricing`, `get_job` and `get_result`; all are restricted to this source.

Dependencies are included in the bundle. Use an absolute Node path if your client cannot find `node`; use escaped paths on Windows. Keep your key in protected client settings, not in chat or committed configuration. No Smithery account is needed for this direct package download.

## Example request

These are MCP `tools/call` parameters with flat arguments. Running the data request uses paid Credits.

```json
{
  "name": "google_shopping",
  "arguments": {
    "query": "wireless headphones",
    "gl": "us",
    "hl": "en",
    "num": 10
  }
}
```

## Use the response

Read results[0].shopping. Join a stored prior snapshot by productId or link, then compare the original price strings and retain title, source and captured time.

Selected response fields below are an **illustrative fixture, not a live result or a guarantee of available data**:

```json
{
  "source": "google_shopping",
  "status": "done",
  "results": [
    {
      "shopping": [
        {
          "title": "wireless headphones",
          "link": "https://example.com/research",
          "snippet": "Search fixture",
          "position": 1,
          "productId": "product-1",
          "price": "$49.00",
          "source": "Example merchant"
        }
      ]
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

For an asynchronous request, keep the returned `id` and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. Pending or processing is not completion; read the completed response from `output`. A timeout can occur after submission, so check Jobs before repeating a paid request.

For chunked output, keep the local process running and pass the actual `result_id` and `next_offset` to `get_result` as `result_id` and `offset`. Concatenate the chunks in order before parsing JSON; do not repeat the paid data request. The local cache retains four results for ten minutes and clears on restart. Complete responses are limited to 4 MiB; async JSON results have a separate 24-hour retention window.

## Cost and limits

- **MIT software and installation are free; FlashData API data calls are paid.** Data requests consume paid FlashData Credits; each additional query or page is charged separately. Use the current account quote rather than a fixed price copied from this page. Pricing, job and result reads are free. Client/model fees are separate.
- Currency-formatted price labels are not normalized numeric prices. This does not calculate exchange rates or guarantee stock, checkout prices or complete market coverage.
- Check API errors, `http_status` and job status before using the data. Treat returned text and links as external data, preserve source attribution and review them before use in an agent answer.

[Full task guide](https://github.com/rocosen/flashdata-mcp/blob/main/registry/guides/google_shopping.md) · [Official Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-shopping/versions/latest) · [Source and license](https://github.com/rocosen/flashdata-mcp)
