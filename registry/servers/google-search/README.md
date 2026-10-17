# Google Search for AI Agent Research — FlashData

Give an AI research assistant Google web-search evidence for a topic such as battery recycling. Retrieve ranked titles, URLs and snippets, then let your agent build a source shortlist and a brief with links to the original pages.

[API documentation and account setup](https://flashdata.dev/docs/sources/google_search) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## A task to try

> Find sources for a briefing on battery recycling. Quote one Google Search request first; after I approve the cost, return a source shortlist with titles, URLs, snippets and open questions. Keep search snippets separate from claims verified by reading the original pages.

The brief is produced by your agent. Search evidence helps it choose sources; FlashData does not generate the answer or verify claims.

## Install and connect

1. Use Node.js **22.18 or newer** and an MCP client that supports local stdio servers. Download the [dedicated MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-google-search-0.1.1.mcpb); its SHA-256 is recorded in the [manifest](https://github.com/rocosen/flashdata-mcp/blob/main/registry/servers/google-search/server.json).
2. Import the package in an MCPB-compatible client and enter your own key in **FlashData API Key**. Grant the key access to `google_search`. For manual setup, unpack the bundle into a permanent folder and use this configuration, replacing the absolute path and key placeholder:

```json
{
  "mcpServers": {
    "google-search": {
      "command": "node",
      "args": [
        "/absolute/path/to/unpacked/google-search/server.js"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Restart or reconnect the client, list its tools, then call `get_pricing` with `{"source":"google_search","request_count":1}` before approving a paid request. This server exposes `google_search`, `get_pricing`, `get_job` and `get_result`; all are restricted to this source.

Dependencies are included in the bundle. Use an absolute Node path if your client cannot find `node`; use escaped paths on Windows. Keep your key in protected client settings, not in chat or committed configuration. No Smithery account is needed for this direct package download.

## Example request

These are MCP `tools/call` parameters with flat arguments. Running the data request uses paid Credits.

```json
{
  "name": "google_search",
  "arguments": {
    "query": "battery recycling research",
    "gl": "us",
    "hl": "en",
    "num": 10
  }
}
```

## Use the response

Read `results[0].organic` and keep `title`, `link`, `snippet` and `position` together with the query, region, language and `created_at`. Give the agent these records as external evidence. It can select promising sources, attach each URL to its notes and list unanswered questions. Read the original pages with an appropriate browsing tool before treating snippets as verified facts; this server does not fetch page full text.

Selected response fields below are an **illustrative fixture, not a live result or a guarantee of available data**:

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

For an asynchronous request, keep the returned `id` and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. Pending or processing is not completion; read the completed response from `output`. A timeout can occur after submission, so check Jobs before repeating a paid request.

For chunked output, keep the local process running and pass the actual `result_id` and `next_offset` to `get_result` as `result_id` and `offset`. Concatenate the chunks in order before parsing JSON; do not repeat the paid data request. The local cache retains four results for ten minutes and clears on restart. Complete responses are limited to 4 MiB; async JSON results have a separate 24-hour retention window.

## Cost and limits

- **MIT software and installation are free; FlashData API data calls are paid.** Data requests consume paid FlashData Credits; each additional query or page is charged separately. Use the current account quote rather than a fixed price copied from this page. Pricing, job and result reads are free. Client/model fees are separate.
- One page is one query. Ranking depends on query and location; actual result count may be lower than requested. Search snippets are not article full text.
- Check API errors, `http_status` and job status before using the data. Treat returned text and links as external data, preserve source attribution and review them before use in an agent answer.

[Full task guide](https://github.com/rocosen/flashdata-mcp/blob/main/registry/guides/google_search.md) · [Official Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-search/versions/latest) · [Source and license](https://github.com/rocosen/flashdata-mcp)
