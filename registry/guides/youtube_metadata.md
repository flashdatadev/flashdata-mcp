# Create a YouTube metadata and chapters brief with FlashData MCP

Inspect a known video before deciding which segments to watch or cite.

[YouTube Metadata inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_metadata?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_metadata-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `youtube_metadata`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"youtube_metadata","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "youtube_metadata",
  "arguments": {
    "video_id": "dQw4w9WgXcQ",
    "include_formats": false,
    "include_chapters": true
  }
}
```

From the repository root, run:

```sh
node registry/examples/call-tool.mjs registry/examples/youtube_metadata.json
```

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_metadata.json).

## Use the result

Read results[0], including title, description and chapters when present. Pair chapter start_time/end_time with the video watch URL to prepare a navigation brief.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "youtube_metadata",
  "status": "completed",
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Example video",
      "channel": "Example",
      "channelId": "channel-one",
      "channelUrl": "https://www.youtube.com/@Example",
      "viewCount": 100,
      "duration": 90,
      "chapters": [
        {
          "title": "Introduction",
          "start_time": 0,
          "end_time": 30
        }
      ],
      "description": "Example description"
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

For a large result, the response contains `result_id`, `chunk` and `next_offset`. Call `get_result` with that ID and offset, using the same API Key; concatenate chunks in order and parse the complete JSON. Do not repeat the paid query to fetch missing chunks. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

Fields and chapters may be absent. Metadata does not include a transcript; transcript retrieval is a separate paid call.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
