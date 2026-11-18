# Google Video Search MCP: installation and example

Find videos across websites by searching Google’s video results. See which site hosts each result and its duration when Google provides one. Installation is free; each data request uses paid FlashData Credits.

[Google Video Search inputs, outputs and account setup](https://flashdata.dev/docs/sources/google_videos?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_videos-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Download [MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-video-search-0.3.0.mcpb) from the official FlashData repository and verify its SHA-256 against the [manifest](../servers/google-video-search/server.json). It runs locally with Node.js 22.18+ and exposes `google_videos`, `get_pricing`, `get_job` and `get_result`.

In a client that supports MCPB installation, import that package and enter your own FlashData API Key into **FlashData API Key**. The bundled configuration supplies `FLASHDATA_API_KEY` to the local process. Your key must grant `google_videos`. Client installation interfaces differ; Registry publication does not mean every client has indexed this entry.

For manual stdio setup, unpack the bundle into a permanent directory and configure:

```json
{
  "mcpServers": {
    "google-video-search": {
      "command": "node",
      "args": ["/absolute/path/to/unpacked/google-video-search/server.js"],
      "env": {"FLASHDATA_API_KEY": "YOUR_API_KEY"}
    }
  }
}
```

If your client cannot find Node, configure its absolute path. The bundle includes its dependencies. Keep the key in protected client settings.

Call `get_pricing` with `{"request_count":1}` for the price of one query. Pricing, job and result reads are free.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "google_videos",
  "arguments": {
    "query": "battery recycling process",
    "num": 10,
    "response_format": "json"
  }
}
```

For the optional **combined hosted service** (a separate connection), clone this repository, use Python 3.10+, install `python3 -m pip install -r registry/examples/requirements.txt`, provide `FLASHDATA_API_KEY`, and run from the repository root:

```sh
python3 registry/examples/call_tool.py registry/examples/google_videos.json
```

The hosted helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/google_videos.json).

## Use the result

Read `results[0].videos`. Keep `title`, `link`, `source` and any `duration`; group the links by hostname to compare sources. Results can come from several video sites and formats. This call returns search records, not media files.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "google_videos",
  "status": "done",
  "results": [
    {
      "videos": [
        {
          "title": "battery recycling process",
          "link": "https://example.com/research",
          "snippet": "Search fixture",
          "position": 1,
          "source": "Example",
          "duration": "01:30"
        }
      ]
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

For a chunked response, call `get_result` with the returned `result_id` and `next_offset` (as `offset`) in the same running process. Concatenate the chunks in order. Parse JSON only when `encoding` is `json`; Markdown and plain text are documents. Do not repeat the paid request. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

This is Google video search, distinct from YouTube Search. Results contain search metadata, not media files.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
