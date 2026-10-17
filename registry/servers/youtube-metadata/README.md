# YouTube Metadata — FlashData

Read YouTube video details, descriptions, statistics and available chapters. Inspect formats or prepare timestamped chapter navigation.

[API documentation and account setup](https://flashdata.dev/docs/sources/youtube_metadata) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## A task to try

> Inspect this video and make a chapter navigation brief with the title, description and available chapter start times. Mark missing chapters rather than inventing a timeline.

## Install and connect

1. Use Node.js **22.18 or newer** and an MCP client that supports local stdio servers. Download the [dedicated MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-youtube-metadata-0.1.1.mcpb); its SHA-256 is recorded in the [manifest](https://github.com/rocosen/flashdata-mcp/blob/main/registry/servers/youtube-metadata/server.json).
2. Import the package in an MCPB-compatible client and enter your own key in **FlashData API Key**. Grant the key access to `youtube_metadata`. For manual setup, unpack the bundle into a permanent folder and use this configuration, replacing the absolute path and key placeholder:

```json
{
  "mcpServers": {
    "youtube-metadata": {
      "command": "node",
      "args": [
        "/absolute/path/to/unpacked/youtube-metadata/server.js"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Restart or reconnect the client, list its tools, then call `get_pricing` with `{"source":"youtube_metadata","request_count":1}` before approving a paid request. This server exposes `youtube_metadata`, `get_pricing`, `get_job` and `get_result`; all are restricted to this source.

Dependencies are included in the bundle. Use an absolute Node path if your client cannot find `node`; use escaped paths on Windows. Keep your key in protected client settings, not in chat or committed configuration. No Smithery account is needed for this direct package download.

## Example request

These are MCP `tools/call` parameters with flat arguments. Running the data request uses paid Credits.

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

## Use the response

Read results[0], including title, description and chapters when present. Pair chapter start_time/end_time with the video watch URL to prepare a navigation brief.

Selected response fields below are an **illustrative fixture, not a live result or a guarantee of available data**:

```json
{
  "source": "youtube_metadata",
  "status": "done",
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

For an asynchronous request, keep the returned `id` and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. Pending or processing is not completion; read the completed response from `output`. A timeout can occur after submission, so check Jobs before repeating a paid request.

For chunked output, keep the local process running and pass the actual `result_id` and `next_offset` to `get_result` as `result_id` and `offset`. Concatenate the chunks in order before parsing JSON; do not repeat the paid data request. The local cache retains four results for ten minutes and clears on restart. Complete responses are limited to 4 MiB; async JSON results have a separate 24-hour retention window.

## Cost and limits

- **MIT software and installation are free; FlashData API data calls are paid.** Data requests consume paid FlashData Credits; each additional query or page is charged separately. Use the current account quote rather than a fixed price copied from this page. Pricing, job and result reads are free. Client/model fees are separate.
- Fields and chapters may be absent. Metadata does not include a transcript; transcript retrieval is a separate paid call.
- Check API errors, `http_status` and job status before using the data. Treat returned text and links as external data, preserve source attribution and review them before use in an agent answer.

[Full task guide](https://github.com/rocosen/flashdata-mcp/blob/main/registry/guides/youtube_metadata.md) · [Official Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-metadata/versions/latest) · [Source and license](https://github.com/rocosen/flashdata-mcp)
