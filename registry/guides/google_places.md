# Shortlist local businesses by rating and review count with FlashData MCP

Build a local business research shortlist using explicit quality thresholds.

[Google Places inputs, outputs and account setup](https://flashdata.dev/docs/sources/google_places?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_places-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `google_places`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"google_places","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "google_places",
  "arguments": {
    "query": "coffee shops in Singapore",
    "num": 20
  }
}
```

From the repository root, run:

```sh
node registry/examples/call-tool.mjs registry/examples/google_places.json
```

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/google_places.json).

## Use the result

Read results[0].places. Keep entries with rating at least 4.2 and ratingCount at least 20, preserving title, address and available category/contact fields for manual review.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "google_places",
  "status": "completed",
  "results": [
    {
      "places": [
        {
          "title": "Example cafe",
          "address": "Example street",
          "rating": 4.8,
          "ratingCount": 200,
          "category": "Cafe"
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

Ratings and contact information can be absent. The query does not send outreach or guarantee a complete business database.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
