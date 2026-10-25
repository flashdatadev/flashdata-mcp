# YouTube Download to Cloud Storage for Cursor — FlashData

Submit one video, audio or clip delivery to a storage destination you control. Save the returned job ID, read that job later, and inspect the delivery manifest after completion.

`@flashdata-dev/youtube-cloud-storage` exposes **youtube_download** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_download) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees, and storage charges where applicable, are separate.

## Install in Cursor

This plugin's public Marketplace listing is not yet confirmed. Once published, install **YouTube Download to Cloud Storage — FlashData** from Cursor's Marketplace and configure `FLASHDATA_API_KEY` through the plugin's protected settings.

For local evaluation now, copy this entire plugin directory into `~/.cursor/plugins/local/youtube-cloud-storage-flashdata/` as real files, then run **Developer: Reload Window** and check **Customize**. Do not use a symlink outside that directory. Configure the key through the plugin settings, then reload the entire Cursor window again so the server receives the saved value. Reloading only the MCP server may retain the previous configuration. Never put the key in Agent chat or commit it to a file. Organization policy can restrict local plugins.

The plugin starts `npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 mcp`. Node.js **22.18 or newer** and npm must be available to Cursor. First launch downloads the pinned package from npm.

## Use in Cursor

Activate the `youtube-cloud-storage-flashdata` Skill and use the `youtube-cloud-storage-flashdata` MCP server. Its tools are `youtube_download`, `get_pricing`, `get_job` and `get_result`. The server rejects other sources and their jobs even when your API key has broader permissions. If you install several FlashData task integrations, choose the supporting tools from this task's server.

First check the connection without a paid data request:

> Use youtube-cloud-storage-flashdata to call get_pricing for youtube_download, request_count 1. Do not submit a data query.

A per-request price is not a download-cost estimate: downloads reserve Credits and settle by actual uploaded bytes.

After approving the API cost, try:

> Prepare a 10-second MP4 delivery of YouTube video jNQXAC9IVRw to my own S3 bucket. First confirm the destination, credentials, rights and byte-based cost approval. After I approve, submit once, retain the job ID, and inspect the completed delivery manifest. Never retry the paid submission automatically.

The source tool accepts these flat arguments (example values; replace them for your task):

```json
{
  "video_id": "jNQXAC9IVRw",
  "mode": "async",
  "download_type": "audio_video",
  "video_quality": "<=720",
  "output_format": "mp4",
  "start_at": "00:00:00",
  "end_at": "00:00:10",
  "storage": {
    "storage_type": "s3",
    "storage_url": "your-media-bucket",
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "region": "us-east-1",
    "object_prefix": "flashdata-clips"
  }
}
```

MCP success data is in `structuredContent`; the terminal examples below wrap it under `result`. For asynchronous calls retain the returned `id`, call this server's `get_job` with `job_id`, and read `output` after completion. For chunked MCP responses follow `result_id` and `next_offset` with `get_result` on the same server. Never automatically repeat a paid submission after a timeout.

[Full input schema](skills/youtube-cloud-storage-flashdata/references/schema.json) · [Example arguments](skills/youtube-cloud-storage-flashdata/references/query.json)

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 --help
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 tools
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 call get_pricing
```

Save the following as `query.json`. It uses flat tool arguments; no REST `params` wrapper is needed.

```json
{
  "video_id": "jNQXAC9IVRw",
  "mode": "async",
  "download_type": "audio_video",
  "video_quality": "<=720",
  "output_format": "mp4",
  "start_at": "00:00:00",
  "end_at": "00:00:10",
  "storage": {
    "storage_type": "s3",
    "storage_url": "your-media-bucket",
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "region": "us-east-1",
    "object_prefix": "flashdata-clips"
  }
}
```

The storage values above are nonfunctional placeholders. Replace them with your own writable destination and scoped credentials in a protected file or supply JSON through stdin. Storage credentials are sent to FlashData to deliver the media; MCP clients may retain tool arguments in history.

This command submits **one asynchronous download job**, billed by actual uploaded bytes, and writes the submission response to a file:

```sh
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 call youtube_download --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-cloud-storage@0.1.1` and use `npx flashdata-youtube-cloud-storage` with the same arguments.

## Deliver media to your own cloud storage

The submission response contains `result.id`. Put that actual ID into `job.json` as `{"job_id":"job_REPLACE_WITH_RETURNED_ID"}`, then use the job-read command below and save its response to `result.json` before processing the manifest.

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

print(json.dumps({
    "location": data.get("file_url"), "bytes": data.get("file_size"),
    "format": data.get("output_format"),
}, ensure_ascii=False, indent=2))
```

Selected fields from a **representative fixture**, not a live response or a guarantee that every field/result will be present. This is the content inside the CLI's `result` property:

```json
{
  "job": {
    "id": "job_EXAMPLE",
    "source": "youtube_download",
    "status": "completed"
  },
  "output": {
    "results": [
      {
        "file_url": "s3://customer-bucket/clip.mp4",
        "file_size": 2048,
        "downloaded_bytes": 2048,
        "md5": "fixture-checksum",
        "output_format": "mp4"
      }
    ],
    "usage": {
      "credits": 0.001
    }
  },
  "http_status": 200,
  "request_id": "fixture-request"
}
```

Only asynchronous delivery is supported. Supply your own destination and credentials; media access and retention follow your storage settings. Private object URLs are not public download links. Charges reserve Credits and settle by uploaded bytes.

## Parameters

| Parameter | Type | Required | Default and constraints |
| --- | --- | --- | --- |
| `video_id` | string | Yes | Pattern: `^[A-Za-z0-9_-]{11}$`. |
| `download_type` | string | No | Default: `"audio_video"`. Allowed: `audio_video`, `video`, `audio`. |
| `video_quality` | string | No | Default: `"<=720"`. Allowed: `best`, `worst`, `<=144`, `==144`, `>=144`, `<=360`, `==360`, `>=360`, `<=480`, `==480`, `>=480`, `<=720`, `==720`, `>=720`, `<=1080`, `==1080`, `>=1080`, `<=1440`, `==1440`, `>=1440`, `<=2160`, `==2160`, `>=2160`, `<=4320`, `==4320`, `>=4320`. |
| `fps` | string | No | Pattern: `^(?:>=&#124;<=&#124;==)(?:[1-9]\d?&#124;1\d\d&#124;2[0-3]\d&#124;240)$`. |
| `audio_language` | string | No | Default: `"default"`. Allowed: `default`, `original`. |
| `audio_quality` | string | No | Default: `"best"`. Allowed: `best`, `320`, `256`, `192`, `128`. |
| `yt_dlp_format` | string | No |  |
| `upload_metadata` | boolean | No | Default: `false`. |
| `output_format` | string | No | Allowed: `mp4`, `webm`, `mkv`, `m4a`, `mp3`, `opus`. Video defaults to mp4 (also webm/mkv); audio defaults to m4a (also mp3/opus). |
| `start_at` | string | No | Pattern: `^\d{1,2}:[0-5]\d:[0-5]\d$`. |
| `end_at` | string | No | Pattern: `^\d{1,2}:[0-5]\d:[0-5]\d$`. |
| `storage` | object | Yes | Customer-owned destination, using the same fields as Download API params.storage. Supply credentials from your configured storage; do not invent values or display secrets. GCS uses service_account; Azure uses account_name and a container SAS with write permission; other providers use access_key/secret_key and provider endpoint/region as needed. Required destination and provider credentials; see the linked Download API reference. Never commit real values. |
| `mode` | string | No | Default: `"async"`. Allowed: `async`. |

The package includes `schema.json` with the complete nested schema and `examples/query.json`. The `tools` command also returns the current schemas permitted by your key. Fields supplied by the remote source may be missing; preserve original values and source links.

## Jobs, errors and billing

Downloads are asynchronous. Save the returned `result.id`, create `job.json` with that job ID, and read it without submitting again:

```json
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
```

```sh
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.1 call get_job --input job.json > result.json
```

`pending` or `processing` means wait and read the same job later; `completed` provides the original JSON under `result.output`. The package never polls or retries paid submissions automatically. A timeout or lost response may still represent charged work: check Jobs before another submission. Download charges reserve Credits and settle by uploaded bytes, so a per-request quote is not a download-cost estimate.

CLI exit codes are 0 for a successful operation, 1 for an API/tool failure and 2 for invalid local input/configuration. Input is limited to 256 KiB and each API response to 4 MiB. CLI outputs complete JSON. Async JSON results have a 24-hour availability window; customer media retention follows storage settings.

## Connect an MCP client

This same package starts a persistent stdio server with the `mcp` subcommand:

```json
{
  "mcpServers": {
    "youtube-cloud-storage": {
      "command": "npx",
      "args": [
        "--yes",
        "@flashdata-dev/youtube-cloud-storage@0.1.1",
        "mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Use `npx.cmd` on Windows if your client requires it. Enter your own key through protected client settings. The four tools are `youtube_download`, `get_pricing`, `get_job` and `get_result`; the source is fixed, and job reads reject jobs belonging to other sources. API key permissions are rechecked on each operation.

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
