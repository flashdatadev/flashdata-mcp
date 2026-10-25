# YouTube Captions for Gemini CLI — FlashData

Retrieve an existing uploader-provided caption track, then format its timed segments locally. The API returns JSON; the example below performs the SRT conversion without a second data call.

`@flashdata-dev/youtube-captions` exposes **youtube_captions** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_captions) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees are separate.

## Install in Gemini CLI

Install from this extension's repository (GitHub installation and gallery indexing are separate):

```sh
gemini extensions install https://github.com/rocosen/youtube-captions-gemini
```

Review the extension and enter your own FlashData API key at the sensitive setting prompt. To change it later, run `gemini extensions config youtube-captions-flashdata`. Restart Gemini CLI after configuration. Run `gemini extensions list`, `gemini skills list --all` and `gemini mcp list` to inspect installation, Skill availability and connection.

Node.js **22.18 or newer**, npm and Git must be available. The extension starts `npx --yes @flashdata-dev/youtube-captions@0.1.1 mcp`; first launch downloads the pinned package. Local evaluation also supports `gemini extensions install /absolute/path/to/this-extension`. Model access and fees are separate; this does not claim Antigravity CLI compatibility.

## Use in Gemini CLI

Activate the `youtube-captions-flashdata` Skill and use the `youtube-captions-flashdata` MCP server. Its tools are `youtube_captions`, `get_pricing`, `get_job` and `get_result`. The server rejects other sources and their jobs even when your API key has broader permissions. If you install several FlashData task integrations, choose the supporting tools from this task's server.

First check the connection without a paid data request:

> Use youtube-captions-flashdata to call get_pricing for youtube_captions, request_count 1. Do not submit a data query.

After approving the API cost, try:

> Retrieve the English uploader captions for YouTube video dQw4w9WgXcQ once, with auto=false. Convert the returned timed segments to SRT locally; report a missing track without substituting another.

The source tool accepts these flat arguments (example values; replace them for your task):

```json
{
  "video_id": "dQw4w9WgXcQ",
  "language": "en",
  "auto": false
}
```

MCP success data is in `structuredContent`; the terminal examples below wrap it under `result`. For asynchronous calls retain the returned `id`, call this server's `get_job` with `job_id`, and read `output` after completion. For chunked MCP responses follow `result_id` and `next_offset` with `get_result` on the same server. Never automatically repeat a paid submission after a timeout.

[Full input schema](skills/youtube-captions-flashdata/references/schema.json) · [Example arguments](skills/youtube-captions-flashdata/references/query.json)

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-captions@0.1.1 --help
npx --yes @flashdata-dev/youtube-captions@0.1.1 tools
npx --yes @flashdata-dev/youtube-captions@0.1.1 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "video_id": "dQw4w9WgXcQ",
  "language": "en",
  "auto": false
}
```

This command performs **one paid data request** and writes its response to a file:

```sh
npx --yes @flashdata-dev/youtube-captions@0.1.1 call youtube_captions --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-captions@0.1.1` and use `npx flashdata-youtube-captions` with the same arguments.

## Convert uploader captions to an SRT file

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

import math

def timestamp(seconds):
    milliseconds = math.floor(seconds * 1000 + 0.5)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"

for number, segment in enumerate(data.get("segments") or [], start=1):
    print(number)
    print(f"{timestamp(segment['start'])} --> {timestamp(segment['end'])}")
    print(segment["text"])
    print()
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

```json
{
  "source": "youtube_captions",
  "status": "done",
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "languageCode": "en",
      "isAutoGenerated": false,
      "segments": [
        {
          "start": 0,
          "end": 3,
          "text": "Uploader captions."
        }
      ]
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

auto=false selects existing uploader captions. This does not generate, translate or automatically substitute a missing track.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `video_id` | string | Yes | Pattern: `^[A-Za-z0-9_-]{11}$`. |
| `language` | string | No | Default: `"en"`. Pattern: `^[A-Za-z0-9-]+$`. |
| `auto` | boolean | No | Default: `false`. true selects automatically generated captions; false selects manually provided captions. Does not fall back between the two. |
| `mode` | string | No | Default: `"realtime"`. Allowed: `realtime`, `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

For a longer-running query, set `mode` to `"async"`. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/youtube-captions@0.1.1 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Each submitted query is charged at this source’s current rate; the number of returned records is not the request count.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "youtube-captions": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/youtube-captions@0.1.1",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `youtube_captions`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, and parse only `encoding: "json"`. Other encodings are Markdown or plain-text documents. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/rocosen/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.

## MCP presentation

Task MCP 0.2.0 source builds default to Markdown text while retaining original
fields in `structuredContent`. Use `response_format: "text"` or `"json"` for another
presentation; `get_result` inherits the original format. Earlier published
versions return JSON and do not accept this argument: check the running tool
schema before using it. CLI calls default to JSON; explicit text formats return
a document string in the JSON `result` field. Formatting never repeats the query.
