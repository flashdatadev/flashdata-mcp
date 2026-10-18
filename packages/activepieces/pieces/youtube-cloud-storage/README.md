# YouTube Cloud Storage — FlashData

Deliver YouTube video or audio to your cloud storage, then inspect the asynchronous job and delivery manifest. Billed by delivered bytes; use media only with the rights your use requires.

## Install and connect

This is an independently packaged community Piece, not a confirmed official catalogue listing. It requires Activepieces 0.82.0+ and a Node.js 22.18+ worker. Your platform administrator must have custom Piece installation enabled; plan requirements vary.

Build the packages as described in the [workspace guide](https://github.com/rocosen/flashdata-mcp/tree/main/packages/activepieces), then install this Piece's `.tgz` via **Platform Admin → Catalogue → Pieces → Install Piece → Upload File**. After an npm release exists, the package-name route uses `@flashdata-dev/piece-youtube-cloud-storage` at version `0.1.0`. Do not assume an npm release exists from this README. Older platform versions may label the page **Settings → My Pieces**.

1. Sign in or [create a FlashData account](https://flashdata.dev).
2. [Create an API Key](https://flashdata.dev/app/api-keys) with `youtube_download` permission. The secret is shown once; save it in an Activepieces connection.
3. Add **YouTube Cloud Storage — FlashData** to a flow, choose **Submit download to storage**, connect the key and storage as described below, and enter the source-specific fields. The source is fixed; this Piece cannot select another API.

Connection validation calls `GET https://api.flashdata.dev/v2/api-access` and checks this source permission. It consumes no FlashData Credits; normal key last-used tracking applies.

## Example task

Use a manual trigger while configuring this step. Enter these action fields; they are illustrative request inputs, not a claim that the sample video has a matching track or that a paid run has been performed.

```json
{
  "video_id": "jNQXAC9IVRw",
  "download_type": "audio",
  "output_format": "m4a"
}
```

Submit returns id, status and source. Read status returns lifecycle fields. Once completed, Read result returns a JSON manifest with file_url, file_size and delivered-byte metadata; private objects keep their storage access controls.

Use the lifecycle described below before processing a delivery manifest.

## Inputs

| Field | Type | Requirement | Constraint |
| --- | --- | --- | --- |
| `video_id` | string | Required | `^[A-Za-z0-9_-]{11}$` |
| `download_type` | string | Optional | `audio_video`, `video`, `audio` |
| `video_quality` | string | Optional | `best`, `worst`, `<=144`, `==144`, `>=144`, `<=360`, `==360`, `>=360`, `<=480`, `==480`, `>=480`, `<=720`, `==720`, `>=720`, `<=1080`, `==1080`, `>=1080`, `<=1440`, `==1440`, `>=1440`, `<=2160`, `==2160`, `>=2160`, `<=4320`, `==4320`, `>=4320` |
| `fps` | string | Optional | `^(?:>=|<=|==)(?:[1-9]\d?|1\d\d|2[0-3]\d|240)$` |
| `audio_language` | string | Optional | `default`, `original` |
| `audio_quality` | string | Optional | `best`, `320`, `256`, `192`, `128` |
| `yt_dlp_format` | string | Optional | 1–1024 characters |
| `upload_metadata` | boolean | Optional | true / false or documented object |
| `output_format` | string | Optional | `mp4`, `webm`, `mkv`, `m4a`, `mp3`, `opus` |
| `start_at` | string | Optional | `^\d{1,2}:[0-5]\d:[0-5]\d$` |
| `end_at` | string | Optional | `^\d{1,2}:[0-5]\d:[0-5]\d$` |

Download defaults are selected together by mode. Leave video quality/FPS empty for audio-only output and audio quality empty for video output. Clip end must follow start; both must be within 12 hours. Advanced format selectors override video quality/FPS/audio language.

### Download connection

Enter the following JSON in the **secret connection field**, replacing the placeholders with your own key and storage credentials. Never put it in action inputs or a flow export. The whole value is a secret-text connection. Status/result-only connections may omit storage.

```json
{
  "api_key": "YOUR_FLASHDATA_API_KEY",
  "storage": {
    "storage_type": "s3",
    "storage_url": "your-media-bucket",
    "region": "us-east-1",
    "access_key": "YOUR_STORAGE_ACCESS_KEY",
    "secret_key": "YOUR_STORAGE_SECRET_KEY",
    "object_prefix": "research/YYYYMMDD"
  }
}
```

Also supports s3_compatible, oss, gcs, azure, cos, bos and tos; use the exact provider fields in the [download guide](https://flashdata.dev/docs/sources/youtube_download). S3-compatible endpoints must use HTTPS. Credentials are validated locally; the free key check does not test storage permissions.

Submit once, save the receipt's `id`, then use **Read download status** with that ID. If pending/processing, wait before another read. After completed, use **Read download result**. Neither read submits a job or downloads media bytes. A failed job raises an error; inspect [Jobs](https://flashdata.dev/app/jobs) before deciding whether to submit again. Result JSON is retained for 24 hours; media retention depends on your storage.

## Cost, failures and limits

The connector code is free to install. **FlashData data API calls are paid**, using Credits; [FlashData pricing](https://flashdata.dev/pricing) applies. Media delivery is charged by delivered bytes and can incur your storage provider charges. Activepieces execution and plan costs are separate. Clicking **Test step** executes the same paid operation as running it.

The connector does not automatically retry paid submissions. After a timeout, oversized response or uncertain server failure, check [FlashData Jobs](https://flashdata.dev/app/jobs) before resubmitting. Re-running a flow can still execute another paid query. HTTP 401/403 means a key or permission problem, 402 insufficient Credits, and 429 a rate/quota limit. Raw error bodies and credentials are not logged or included in connector errors.

Each HTTP read is limited to 65 seconds and 16 MiB. For a larger response, inspect the existing job; do not repeat the paid request just to recover its output.

[YouTube Cloud Storage inputs, outputs and limits](https://flashdata.dev/docs/sources/youtube_download) · [API reference](https://flashdata.dev/docs/api-reference) · [Privacy](https://flashdata.dev/legal/privacy)

Maintained by FlashData. This is not a Google- or YouTube-published integration.
