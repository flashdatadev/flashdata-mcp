# Google Video Search for Gemini CLI — FlashData

Search Google’s video results for demonstrations or tutorials, then group the returned links by website. Use this when research needs sources beyond YouTube.

`@flashdata-dev/google-video-search` exposes **google_videos** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/google_videos) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees are separate.

## Install in Gemini CLI

Install from this extension's repository (GitHub installation and gallery indexing are separate):

```sh
gemini extensions install https://github.com/rocosen/google-video-search-gemini
```

Review the extension and enter your own FlashData API key at the sensitive setting prompt. To change it later, run `gemini extensions config google-video-search-flashdata`. Restart Gemini CLI after configuration. Run `gemini extensions list`, `gemini skills list --all` and `gemini mcp list` to inspect installation, Skill availability and connection.

Node.js **22.18 or newer**, npm and Git must be available. The extension starts `npx --yes @flashdata-dev/google-video-search@0.1.0 mcp`; first launch downloads the pinned package. Local evaluation also supports `gemini extensions install /absolute/path/to/this-extension`. Model access and fees are separate; this does not claim Antigravity CLI compatibility.

## Use in Gemini CLI

Activate the `google-video-search-flashdata` Skill and use the `google-video-search-flashdata` MCP server. Its tools are `google_videos`, `get_pricing`, `get_job` and `get_result`. The server rejects other sources and their jobs even when your API key has broader permissions. If you install several FlashData task integrations, choose the supporting tools from this task's server.

First check the connection without a paid data request:

> Use google-video-search-flashdata to call get_pricing for google_videos, request_count 1. Do not submit a data query.

After approving the API cost, try:

> Search Google Videos once for battery recycling process demonstrations. Request 10 results and group the returned titles, URLs and available durations by website.

The source tool accepts these flat arguments (example values; replace them for your task):

```json
{
  "query": "battery recycling process",
  "num": 10
}
```

MCP success data is in `structuredContent`; the terminal examples below wrap it under `result`. For asynchronous calls retain the returned `id`, call this server's `get_job` with `job_id`, and read `output` after completion. For chunked MCP responses follow `result_id` and `next_offset` with `get_result` on the same server. Never automatically repeat a paid submission after a timeout.

[Full input schema](skills/google-video-search-flashdata/references/schema.json) · [Example arguments](skills/google-video-search-flashdata/references/query.json)

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/google-video-search@0.1.0 --help
npx --yes @flashdata-dev/google-video-search@0.1.0 tools
npx --yes @flashdata-dev/google-video-search@0.1.0 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "query": "battery recycling process",
  "num": 10
}
```

This command performs **one paid data request** and writes its response to a file:

```sh
npx --yes @flashdata-dev/google-video-search@0.1.0 call google_videos --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/google-video-search@0.1.0` and use `npx flashdata-google-video-search` with the same arguments.

## Compare video sources across websites

The CLI returns `{"ok":true,"tool":"...","result":...}`. Check `ok` and the API/job status before consuming data. Save this as `process-result.cjs` and run `node process-result.cjs`:

```js
const response = JSON.parse(require('node:fs').readFileSync('result.json', 'utf8'));
if (!response.ok) throw new Error('The request failed; inspect the response before retrying.');
const sites = {};
for (const video of response.result.results[0].videos ?? []) {
  if (!video.link) continue;
  const host = new URL(video.link).hostname;
  (sites[host] ??= []).push({ title: video.title, url: video.link, duration: video.duration });
}
console.log(JSON.stringify(sites, null, 2));
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

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

This is Google video search, distinct from YouTube Search. Results contain search metadata, not media files.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `query` | string | Yes |  |
| `gl` | string | No | Pattern: `^[A-Za-z]{2}$`. Country code. Set explicitly when needed; omitted values use the search provider’s behavior. |
| `hl` | string | No | Pattern: `^[A-Za-z0-9-]+$`. Interface language. Set explicitly when needed; omitted values use the search provider’s behavior. |
| `location` | string | No |  |
| `num` | integer | No | Range: 1–100. Requested result count. Actual count varies by query and search type; no fixed value is added when omitted. |
| `page` | integer | No | Range: 1–100. Requested page. Set explicitly for pagination; each page is a separate query. |
| `tbs` | string | No |  |
| `autocorrect` | boolean | No |  |
| `mode` | string | No | Default: `"realtime"`. Allowed: `realtime`, `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

For a longer-running query, set `mode` to `"async"`. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/google-video-search@0.1.0 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Each requested search page is a separate paid query; result count is not request count.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "google-video-search": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/google-video-search@0.1.0",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `google_videos`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, then parse JSON. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/rocosen/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
