# YouTube Creative Commons License Metadata CLI and MCP — FlashData

Inspect the Creative Commons license-label signal and keep it with the video ID. The source is named youtube_trainability, but the response does not grant training rights or inspect the creator’s third-party training settings.

`@flashdata-dev/youtube-trainability` exposes **youtube_trainability** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_trainability) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees are separate.

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-trainability@0.1.0 --help
npx --yes @flashdata-dev/youtube-trainability@0.1.0 tools
npx --yes @flashdata-dev/youtube-trainability@0.1.0 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "video_id": "dQw4w9WgXcQ"
}
```

This command performs **one paid data request** and writes its response to a file:

```sh
npx --yes @flashdata-dev/youtube-trainability@0.1.0 call youtube_trainability --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-trainability@0.1.0` and use `npx flashdata-youtube-trainability` with the same arguments.

## Record a license classification for review

The CLI returns `{"ok":true,"tool":"...","result":...}`. Check `ok` and the API/job status before consuming data. Save this as `process-result.cjs` and run `node process-result.cjs`:

```js
const response = JSON.parse(require('node:fs').readFileSync('result.json', 'utf8'));
if (!response.ok) throw new Error('The request failed; inspect the response before retrying.');
const record = response.result.results[0];
console.log(JSON.stringify({ videoId: record.videoId, licenseLabelSignal: record.permitted,
  interpretation: 'Classification only; separate rights review required.' }, null, 2));
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

```json
{
  "source": "youtube_trainability",
  "status": "done",
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

The tool name is youtube_trainability, but it checks a license label. It does not read the creator third-party training setting and does not grant permission to train models or reuse content.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `video_id` | string | Yes | Pattern: `^[A-Za-z0-9_-]{11}$`. |
| `mode` | string | No | Default: `"realtime"`. Allowed: `realtime`, `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

For a longer-running query, set `mode` to `"async"`. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/youtube-trainability@0.1.0 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Each submitted query is charged at this source’s current rate; the number of returned records is not the request count.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "youtube-trainability": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/youtube-trainability@0.1.0",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `youtube_trainability`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, then parse JSON. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/rocosen/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
