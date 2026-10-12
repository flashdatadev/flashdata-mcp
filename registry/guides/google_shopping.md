# Compare Google Shopping price-label snapshots with FlashData MCP

Collect product and merchant results for a repeatable price-comparison dataset.

[Google Shopping inputs, outputs and account setup](https://flashdata.dev/docs/sources/google_shopping?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_shopping-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `google_shopping`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"google_shopping","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

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

From the repository root, run:

```sh
node registry/examples/call-tool.mjs registry/examples/google_shopping.json
```

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/google_shopping.json).

## Use the result

Read results[0].shopping. Join a stored prior snapshot by productId or link, then compare the original price strings and retain title, source and captured time.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "google_shopping",
  "status": "completed",
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

For a large result, the response contains `result_id`, `chunk` and `next_offset`. Call `get_result` with that ID and offset, using the same API Key; concatenate chunks in order and parse the complete JSON. Do not repeat the paid query to fetch missing chunks. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

Currency-formatted price labels are not normalized numeric prices. This does not calculate exchange rates or guarantee stock, checkout prices or complete market coverage.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
