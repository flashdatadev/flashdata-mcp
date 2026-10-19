# Create a YouTube metadata and chapters brief with FlashData MCP

Inspect a known video before deciding which segments to watch or cite.

[YouTube Metadata inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_metadata?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_metadata-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

The dedicated Registry server is [`io.github.flashdata-dev/youtube-metadata`](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-metadata/versions/latest), with the local [MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-youtube-metadata-0.1.1.mcpb) pinned by SHA-256 in its [manifest](../servers/youtube-metadata/server.json). It runs on your machine with Node.js 22.18+ and exposes only `youtube_metadata`, `get_pricing`, `get_job` and `get_result`. The data tool and all supporting reads are restricted to this source.

In a client that supports MCPB installation, import that package and enter your own FlashData API Key into **FlashData API Key**. The bundled configuration supplies `FLASHDATA_API_KEY` to the local process. Your key must grant `youtube_metadata`. Client installation interfaces differ; Registry publication does not mean every client has indexed this entry.

For manual stdio setup, unpack the bundle into a permanent directory and configure:

```json
{
  "mcpServers": {
    "youtube-metadata": {
      "command": "node",
      "args": ["/absolute/path/to/unpacked/youtube-metadata/server.js"],
      "env": {"FLASHDATA_API_KEY": "YOUR_API_KEY"}
    }
  }
}
```

Use an absolute Node path if your desktop client cannot find it. Dependencies are included; no npm install is needed for the bundle. Keep the key in protected client settings, never in chat or committed configuration. These are the same reviewed 0.1.1 runtime artifacts distributed on Smithery; the release tag identifies their build, not an extra account requirement for direct local use. The full [runtime limits](../README.md#local-task-servers) apply.

A runnable first workflow is to list this server's four tools, call `get_pricing` with `{"request_count":1}`, and then submit the task request below only within your data-call budget. The Registry and the package are free to use; FlashData data calls are paid. Client/model providers have separate fees.

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

For the optional **combined hosted service** (a separate connection), clone this repository, use Python 3.10+, install `python3 -m pip install -r registry/examples/requirements.txt`, provide `FLASHDATA_API_KEY`, and run from the repository root:

```sh
python3 registry/examples/call_tool.py registry/examples/youtube_metadata.json
```

The hosted helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_metadata.json).

## Use the result

Read results[0], including title, description and chapters when present. Pair chapter start_time/end_time with the video watch URL to prepare a navigation brief.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

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

For a large result, the response contains `result_id`, `chunk` and `next_offset`. Call `get_result` with that ID and offset, using the same API Key; concatenate chunks in order and parse the complete JSON. Do not repeat the paid query to fetch missing chunks. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

Fields and chapters may be absent. Metadata does not include a transcript; transcript retrieval is a separate paid call.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
