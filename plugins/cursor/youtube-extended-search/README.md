# YouTube Extended Search for Cursor — FlashData

Collect a larger YouTube search sample and count observed videos by channel. Request up to 700 results when needed, while treating the actual result count as the observed sample size.

`@flashdata-dev/youtube-extended-search` exposes **youtube_search_extended** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_search_extended) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees are separate.

## Install in Cursor

This plugin's public Marketplace listing is not yet confirmed. Once published, install **YouTube Extended Search — FlashData** from Cursor's Marketplace and configure `FLASHDATA_API_KEY` through the plugin's protected settings.

For local evaluation now, copy this entire plugin directory into `~/.cursor/plugins/local/youtube-extended-search-flashdata/` as real files, then run **Developer: Reload Window** and check **Customize**. Do not use a symlink outside that directory. Configure the key through the plugin settings, then reload the entire Cursor window again so the server receives the saved value. Reloading only the MCP server may retain the previous configuration. Never put the key in Agent chat or commit it to a file. Organization policy can restrict local plugins.

The plugin starts `npx --yes @flashdata-dev/youtube-extended-search@0.1.1 mcp`. Node.js **22.18 or newer** and npm must be available to Cursor. First launch downloads the pinned package from npm.

## Use in Cursor

Activate the `youtube-extended-search-flashdata` Skill and use the `youtube-extended-search-flashdata` MCP server. Its tools are `youtube_search_extended`, `get_pricing`, `get_job` and `get_result`. The server rejects other sources and their jobs even when your API key has broader permissions. If you install several FlashData task integrations, choose the supporting tools from this task's server.

First check the connection without a paid data request:

> Use youtube-extended-search-flashdata to call get_pricing for youtube_search_extended, request_count 1. Do not submit a data query.

After approving the API cost, try:

> Run one extended YouTube search for battery recycling with 100 requested results. Count the returned videos by channel and state the actual sample size.

The source tool accepts these flat arguments (example values; replace them for your task):

```json
{
  "query": "battery recycling",
  "max_results": 100
}
```

MCP success data is in `structuredContent`; the terminal examples below wrap it under `result`. For asynchronous calls retain the returned `id`, call this server's `get_job` with `job_id`, and read `output` after completion. For chunked MCP responses follow `result_id` and `next_offset` with `get_result` on the same server. Never automatically repeat a paid submission after a timeout.

[Full input schema](skills/youtube-extended-search-flashdata/references/schema.json) · [Example arguments](skills/youtube-extended-search-flashdata/references/query.json)

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-extended-search@0.1.1 --help
npx --yes @flashdata-dev/youtube-extended-search@0.1.1 tools
npx --yes @flashdata-dev/youtube-extended-search@0.1.1 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "query": "battery recycling",
  "max_results": 100
}
```

This command performs **one paid data request** and writes its response to a file:

```sh
npx --yes @flashdata-dev/youtube-extended-search@0.1.1 call youtube_search_extended --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-extended-search@0.1.1` and use `npx flashdata-youtube-extended-search` with the same arguments.

## Map channels in a larger result set

The CLI returns `{"ok":true,"tool":"...","result":...}`. Check `ok` and the API/job status before consuming data. Use Python **3.10 or newer**; only the standard library is needed. Save this as `process-result.py` beside `result.json` and run `python3 process-result.py` (Windows: `py -3 process-result.py`). The script reads the saved CLI response; it makes no API call. Missing optional fields in JSON summaries are represented as `null`:

```python
import json
from pathlib import Path

response = json.loads(Path("result.json").read_text(encoding="utf-8"))
if not response.get("ok"):
    raise SystemExit("The request failed; inspect the response before retrying.")
result = response["result"]
if "job" in result:
    status = result["job"]["status"]
    if status != "completed":
        raise SystemExit(f"Job status: {status}. Inspect this job; do not resubmit.")
    result = result["output"]
if result.get("status") not in (None, "done"):
    raise SystemExit("No completed data yet. Read the existing job before processing.")
if not result.get("results"):
    raise SystemExit("No result record was returned.")
data = result["results"][0]

channels = {}
for video in data.get("results") or []:
    key = next((video[field] for field in ("channelId", "channelUrl", "channel")
                if video.get(field) is not None), "Unknown")
    channels[key] = channels.get(key, 0) + 1
print(json.dumps(channels, ensure_ascii=False, indent=2))
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

```json
{
  "source": "youtube_search_extended",
  "status": "done",
  "results": [
    {
      "results": [
        {
          "videoId": "dQw4w9WgXcQ",
          "title": "battery recycling",
          "channel": "Example",
          "channelId": "channel-one",
          "channelUrl": "https://www.youtube.com/@Example",
          "viewCount": 100,
          "duration": 90
        },
        {
          "videoId": "aqz-KE-bpKQ",
          "title": "battery recycling",
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

The request limit is 700, not a promise of 700 returned videos or pagination. Extended search has its own rate, higher than standard search.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `query` | string | Yes |  |
| `max_results` | integer | No | Default: `20`. Range: 1–700. |
| `filters` | object/null | No | Optional object; see the full JSON schema for upload_date, duration, sort and feature filters. Null is also accepted. |
| `mode` | string | No | Default: `"realtime"`. Allowed: `realtime`, `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

For a longer-running query, set `mode` to `"async"`. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/youtube-extended-search@0.1.1 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Each submitted query is charged at this source’s current rate; the number of returned records is not the request count.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "youtube-extended-search": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/youtube-extended-search@0.1.1",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `youtube_search_extended`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, then parse JSON. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/rocosen/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
