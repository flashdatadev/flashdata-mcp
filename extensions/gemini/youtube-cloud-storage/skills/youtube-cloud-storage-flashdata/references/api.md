# YouTube Download to Cloud Storage CLI and MCP — FlashData

Submit one video, audio or clip delivery to a storage destination you control. Save the returned job ID, read that job later, and inspect the delivery manifest after completion.

`@flashdata-dev/youtube-cloud-storage` exposes **youtube_download** and the supporting reads for that task. It runs locally and calls the FlashData API. Node.js **22.18 or newer** and a FlashData API key with this source enabled are required.

[Inputs, outputs and source documentation](https://flashdata.dev/docs/sources/youtube_download) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current API pricing](https://flashdata.dev/pricing)

**The MIT software is free to install. FlashData API data calls are paid and consume Credits.** Pricing and job reads are free. MCP client/model fees, and storage charges where applicable, are separate.

## Run with npx

Set `FLASHDATA_API_KEY` in your shell environment or secret manager. Keep the real value out of chat, committed files and command arguments. These first checks do not submit a data query:

```sh
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.0 --help
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.0 tools
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.0 call get_pricing
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
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.0 call youtube_download --input query.json > result.json
```

Use `--input -` to read JSON from stdin. For a local project installation, run `npm install @flashdata-dev/youtube-cloud-storage@0.1.0` and use `npx flashdata-youtube-cloud-storage` with the same arguments.

## Deliver media to your own cloud storage

The submission response contains `result.id`. Put that actual ID into `job.json` as `{"job_id":"job_REPLACE_WITH_RETURNED_ID"}`, then use the job-read command below and save its response to `result.json` before processing the manifest.

The CLI returns `{"ok":true,"tool":"...","result":...}`. Check `ok` and the API/job status before consuming data. Save this as `process-result.cjs` and run `node process-result.cjs`:

```js
const response = JSON.parse(require('node:fs').readFileSync('result.json', 'utf8'));
if (!response.ok) throw new Error('The request failed; inspect the response before retrying.');
if (response.result.job?.status !== 'completed') throw new Error('Delivery has not completed. Read this job later.');
const delivered = response.result.output.results[0];
console.log(JSON.stringify({ location: delivered.file_url, bytes: delivered.file_size, format: delivered.output_format }, null, 2));
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
npx --yes @flashdata-dev/youtube-cloud-storage@0.1.0 call get_job --input job.json > result.json
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
        "@flashdata-dev/youtube-cloud-storage@0.1.0",
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

MCP responses longer than 16,000 UTF-16 code units use `result_id`, `chunk` and `next_offset`. Read the remaining chunks with `get_result` in the same running server, concatenate them in order, then parse JSON. The process retains at most four results for ten minutes. The one-shot CLI has no `get_result` command because it returns the whole response.

Optional environment settings are `FLASHDATA_REQUEST_TIMEOUT_MS` (1000–120000, default 65000), `FLASHDATA_DATA_API_URL` and `FLASHDATA_MANAGEMENT_API_URL`. Custom URLs must be trusted HTTPS origins; loopback HTTP is accepted for local tests. The package does not load `.env` files automatically.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issue tracker](https://github.com/flashdata-dev/flashdata-mcp) · [FlashData terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
