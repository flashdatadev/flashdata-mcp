# Build a source-linked Google News topic digest with FlashData MCP

Turn a research topic into a news brief that retains publishers, links and original date labels.

[Google News inputs, outputs and account setup](https://flashdata.dev/docs/sources/google_news?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_news-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `google_news`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"google_news","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "google_news",
  "arguments": {
    "query": "battery recycling",
    "gl": "us",
    "hl": "en",
    "num": 10
  }
}
```

From the repository root, run:

```sh
node registry/examples/call-tool.mjs registry/examples/google_news.json
```

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/google_news.json).

## Use the result

Read results[0].news and group entries by source. Keep title, link, source, date and snippet; preserve relative date labels rather than inventing absolute publication times.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "google_news",
  "status": "completed",
  "results": [
    {
      "news": [
        {
          "title": "battery recycling",
          "link": "https://example.com/research",
          "snippet": "Search fixture",
          "position": 1,
          "source": "Example publisher",
          "date": "2 hours ago"
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

This call reads one news snapshot. Scheduling and delivering a recurring digest belong to your application. It does not retrieve article full text.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
