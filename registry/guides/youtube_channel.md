# Snapshot a channel and its recent video inventory with FlashData MCP

Track the recent public video inventory of a known channel with stable identifiers.

[YouTube Channel inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_channel?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_channel-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

The dedicated Registry server is [`io.github.flashdata-dev/youtube-channel`](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-channel/versions/latest), with the local [MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-youtube-channel-0.1.1.mcpb) pinned by SHA-256 in its [manifest](../servers/youtube-channel/server.json). It runs on your machine with Node.js 22.18+ and exposes only `youtube_channel`, `get_pricing`, `get_job` and `get_result`. The data tool and all supporting reads are restricted to this source.

In a client that supports MCPB installation, import that package and enter your own FlashData API Key into **FlashData API Key**. The bundled configuration supplies `FLASHDATA_API_KEY` to the local process. Your key must grant `youtube_channel`. Client installation interfaces differ; Registry publication does not mean every client has indexed this entry.

For manual stdio setup, unpack the bundle into a permanent directory and configure:

```json
{
  "mcpServers": {
    "youtube-channel": {
      "command": "node",
      "args": ["/absolute/path/to/unpacked/youtube-channel/server.js"],
      "env": {"FLASHDATA_API_KEY": "YOUR_API_KEY"}
    }
  }
}
```

Use an absolute Node path if your desktop client cannot find it. Dependencies are included; no npm install is needed for the bundle. Keep the key in protected client settings, never in chat or committed configuration. These are the same reviewed 0.1.1 runtime artifacts distributed on Smithery; the release tag identifies their build, not an extra account requirement for direct local use. The full [runtime limits](../README.md#local-task-servers) apply.

A runnable first workflow is to list this server's four tools, call `get_pricing` with `{"request_count":1}`, and then submit the task request below only within your data-call budget. The Registry and the package are free to use; FlashData data calls are paid. Client/model providers have separate fees.

Call `get_pricing` with `{"source":"youtube_channel","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "youtube_channel",
  "arguments": {
    "handle": "@jawed",
    "video_limit": 10
  }
}
```

For the optional **combined hosted service** (a separate connection), clone this repository, run `npm ci`, provide `FLASHDATA_API_KEY`, and run from the repository root:

```sh
node registry/examples/call-tool.mjs registry/examples/youtube_channel.json
```

The hosted helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_channel.json).

## Use the result

Read results[0] for channelId, channelHandle, name and videos. Retain each videoId and available metrics so your application can compare later snapshots.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "youtube_channel",
  "status": "done",
  "results": [
    {
      "channelId": "channel-one",
      "channelHandle": "@jawed",
      "name": "Example",
      "videos": [
        {
          "videoId": "dQw4w9WgXcQ",
          "title": "Example video",
          "channel": "Example",
          "channelId": "channel-one",
          "channelUrl": "https://www.youtube.com/@Example",
          "viewCount": 100,
          "duration": 90
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

video_limit is 1 to 100; fewer videos or missing statistics are possible. A recent-video snapshot is not a complete historical archive.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
