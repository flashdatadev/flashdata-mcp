# Inspect YouTube Creative Commons license labels with FlashData MCP

Record a video license-label signal as one input to a human rights review.

[YouTube License Metadata inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_trainability?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_trainability-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `youtube_trainability`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"youtube_trainability","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "youtube_trainability",
  "arguments": {
    "video_id": "dQw4w9WgXcQ"
  }
}
```

From the repository root, run:

```sh
node registry/examples/call-tool.mjs registry/examples/youtube_trainability.json
```

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_trainability.json).

## Use the result

Read results[0].permitted together with videoId and collection time. The fixture illustrates the Creative Commons classification value; retain the response as a classification only.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "youtube_trainability",
  "status": "completed",
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "permitted": [
        "all"
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

The tool name is youtube_trainability, but it checks a license label. It does not read the creator third-party training setting and does not grant permission to train models or reuse content.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
