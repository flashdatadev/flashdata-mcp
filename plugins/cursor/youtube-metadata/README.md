# YouTube Metadata for Cursor — FlashData

Inspect a known video before deciding whether to fetch its transcript. Available chapter boundaries can become timestamped navigation links for a review or research notebook.

`@flashdata-dev/youtube-metadata` exposes **youtube_metadata** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_metadata) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees are separate.

## Install in Cursor

This plugin's public Marketplace listing is not yet confirmed. Once published, install **YouTube Metadata — FlashData** from Cursor's Marketplace and configure `FLASHDATA_API_KEY` through the plugin's protected settings.

For local evaluation now, copy this entire plugin directory into `~/.cursor/plugins/local/youtube-metadata-flashdata/` as real files, then run **Developer: Reload Window** and check **Customize**. Do not use a symlink outside that directory. Configure the key through the plugin settings, then reload the entire Cursor window again so the server receives the saved value. Reloading only the MCP server may retain the previous configuration. Never put the key in Agent chat or commit it to a file. Organization policy can restrict local plugins.

The plugin starts `npx --yes @flashdata-dev/youtube-metadata@0.1.0 mcp`. Node.js **22.18 or newer** and npm must be available to Cursor. First launch downloads the pinned package from npm.

## Use in Cursor

Activate the `youtube-metadata-flashdata` Skill and use the `youtube-metadata-flashdata` MCP server. Its tools are `youtube_metadata`, `get_pricing`, `get_job` and `get_result`. The server rejects other sources and their jobs even when your API key has broader permissions. If you install several FlashData task integrations, choose the supporting tools from this task's server.

First check the connection without a paid data request:

> Use youtube-metadata-flashdata to call get_pricing for youtube_metadata, request_count 1. Do not submit a data query.

After approving the API cost, try:

> Read metadata for YouTube video dQw4w9WgXcQ once, including chapters but excluding formats. Turn any returned chapter boundaries into timestamped navigation links.

The source tool accepts these flat arguments (example values; replace them for your task):

```json
{
  "video_id": "dQw4w9WgXcQ",
  "include_formats": false,
  "include_chapters": true
}
```

MCP success data is in `structuredContent`; the terminal examples below wrap it under `result`. For asynchronous calls retain the returned `id`, call this server's `get_job` with `job_id`, and read `output` after completion. For chunked MCP responses follow `result_id` and `next_offset` with `get_result` on the same server. Never automatically repeat a paid submission after a timeout.

[Full input schema](skills/youtube-metadata-flashdata/references/schema.json) · [Example arguments](skills/youtube-metadata-flashdata/references/query.json)

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-metadata@0.1.0 --help
npx --yes @flashdata-dev/youtube-metadata@0.1.0 tools
npx --yes @flashdata-dev/youtube-metadata@0.1.0 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "video_id": "dQw4w9WgXcQ",
  "include_formats": false,
  "include_chapters": true
}
```

This command performs **one paid data request** and writes its response to a file:

```sh
npx --yes @flashdata-dev/youtube-metadata@0.1.0 call youtube_metadata --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-metadata@0.1.0` and use `npx flashdata-youtube-metadata` with the same arguments.

## Turn available chapters into navigation

The CLI returns `{"ok":true,"tool":"...","result":...}`. Check `ok` and the API/job status before consuming data. Save this as `process-result.cjs` and run `node process-result.cjs`:

```js
const response = JSON.parse(require('node:fs').readFileSync('result.json', 'utf8'));
if (!response.ok) throw new Error('The request failed; inspect the response before retrying.');
const video = response.result.results[0];
console.log((video.chapters ?? []).map(chapter => ({
  title: chapter.title, start: chapter.start_time, end: chapter.end_time,
  url: `https://www.youtube.com/watch?v=${video.videoId}&t=${Math.floor(chapter.start_time)}s`
})));
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

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

Fields and chapters may be absent. Metadata does not include a transcript; transcript retrieval is a separate paid call.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `video_id` | string | Yes | Pattern: `^[A-Za-z0-9_-]{11}$`. |
| `include_formats` | boolean | No | Default: `true`. |
| `include_chapters` | boolean | No | Default: `true`. |
| `mode` | string | No | Default: `"realtime"`. Allowed: `realtime`, `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

For a longer-running query, set `mode` to `"async"`. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/youtube-metadata@0.1.0 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Each submitted query is charged at this source’s current rate; the number of returned records is not the request count.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "youtube-metadata": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/youtube-metadata@0.1.0",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `youtube_metadata`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, then parse JSON. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/rocosen/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
