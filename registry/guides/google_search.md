# Google Search MCP: installation and example

Search Google by keyword, country and language. Each organic result can include a position, title, URL and snippet. Installation is free; you need a FlashData API key and each search page consumes paid Credits.

[Google Search inputs, outputs and account setup](https://flashdata.dev/docs/sources/google_search?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_search-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Download [Google Search MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-google-search-0.3.0.mcpb) from the official FlashData repository and verify its SHA-256 against the [manifest](../servers/google-search/server.json). It runs locally with Node.js 22.18+ and exposes `google_search`, `get_pricing`, `get_job` and `get_result` for this source.

In a client that supports MCPB installation, import that package and enter your own FlashData API Key into **FlashData API Key**. The bundled configuration supplies `FLASHDATA_API_KEY` to the local process. Your key must grant `google_search`. Client installation interfaces differ; Registry publication does not mean every client has indexed this entry.

For manual stdio setup, unpack the bundle into a permanent directory and configure:

```json
{
  "mcpServers": {
    "google-search": {
      "command": "node",
      "args": ["/absolute/path/to/unpacked/google-search/server.js"],
      "env": {"FLASHDATA_API_KEY": "YOUR_API_KEY"}
    }
  }
}
```

Use an absolute Node path if your desktop client cannot find it. Dependencies are included; no npm install is needed. Keep the key in protected client settings. List the tools to confirm the connection before running a paid search.

Call `get_pricing` with `{"source":"google_search","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Each page or follow-up API request is a separately billed query.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

```json
{
  "name": "google_search",
  "arguments": {
    "query": "battery recycling research",
    "gl": "us",
    "hl": "en",
    "num": 10,
    "response_format": "json"
  }
}
```

For the optional **combined hosted service** (a separate connection), clone this repository, use Python 3.10+, install `python3 -m pip install -r registry/examples/requirements.txt`, provide `FLASHDATA_API_KEY`, and run from the repository root:

```sh
python3 registry/examples/call_tool.py registry/examples/google_search.json
```

The hosted helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/google_search.json).

## Use the result

Read `results[0].organic` and keep `title`, `link`, `snippet` and `position` together with the query, region, language and `created_at`. Give the agent these records as external evidence. It can select promising sources, attach each URL to its notes and list unanswered questions. Read the original pages with an appropriate browsing tool before treating snippets as verified facts; this server does not fetch page full text.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

```json
{
  "source": "google_search",
  "status": "done",
  "results": [
    {
      "organic": [
        {
          "title": "battery recycling research",
          "link": "https://example.com/research",
          "snippet": "Search fixture",
          "position": 1
        }
      ]
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

For a large result, call `get_result` with the returned `result_id` and `next_offset` (as `offset`) in the same running process. Concatenate chunks in order. Parse JSON only when `encoding` is `json`; Markdown and plain text are documents. Do not repeat the paid query to fetch missing chunks. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

One page is one query. Ranking depends on query and location; actual result count may be lower than requested. Search snippets are not article full text.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
