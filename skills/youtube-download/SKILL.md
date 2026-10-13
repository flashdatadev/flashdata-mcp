---
name: youtube-download
description: "Download YouTube video, audio or a clip to your cloud storage with FlashData. Use for YouTube-to-S3 delivery, MP4 or MP3 exports and media ingestion through asynchronous jobs."
license: MIT
metadata:
  author: FlashData
---

# YouTube Video and Audio Download

Send a YouTube video, audio track or selected clip directly to your own cloud storage. Choose the media type, format and quality, then use the returned job ID to retrieve the completed file location and size.

[Documentation](https://flashdata.dev/docs/sources/youtube_download?utm_source=skills-sh&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download-task) · [Get an API key](https://flashdata.dev/app/api-keys)

## Example requests

- “Save the first 30 seconds of this video to my S3 bucket.”
- “Download this video’s audio as MP3 to my storage.”
- “Deliver a 720p MP4 and its metadata to my media pipeline.”

## Quick start: a clip to your storage

You need Node.js 22.18+, `FLASHDATA_API_KEY` in your environment, and your storage configuration in a private JSON file. Set `FLASHDATA_STORAGE_FILE` to that file's path; [storage setup](references/storage.md) shows its fields. Calls use paid [FlashData Credits](https://flashdata.dev/pricing).

This example sends the first 10 seconds of a video as MP4. Replace the video ID and clip bounds for the user's request. The storage file is read locally and sent as part of the request; its credentials are not printed in the example command.

```sh
node -e '
const fs = require("node:fs");
const storage = JSON.parse(fs.readFileSync(process.env.FLASHDATA_STORAGE_FILE, "utf8"));
process.stdout.write(JSON.stringify({
  video_id: "jNQXAC9IVRw", mode: "async",
  download_type: "audio_video", video_quality: "<=720", output_format: "mp4",
  start_at: "00:00:00", end_at: "00:00:10", storage
}));
' | npx --yes --package=@flashdata-dev/mcp@0.1.0 flashdata call youtube_download --input -
```

With [FlashData MCP](https://flashdata.dev/mcp), call `youtube_download` using the same fields and a `storage` object from the user's protected configuration.

## Choose the media

| Parameter | Use |
| --- | --- |
| `video_id` | Required 11-character YouTube video ID. |
| `download_type` | `audio_video` (default), `video` or `audio`. |
| `video_quality` | `<=720` by default; also `best`, `worst`, or `<=`, `==`, `>=` with 144, 360, 480, 720, 1080, 1440, 2160 or 4320. |
| `output_format` | Video: `mp4` (default), `webm`, `mkv`. Audio: `m4a` (default), `mp3`, `opus`. |
| `start_at`, `end_at` | Clip times as `HH:MM:SS`; end must follow start. Omit for the full video. |
| `storage` | Required destination configuration; see [storage setup](references/storage.md). |
| `mode` | `async`; downloads return a job ID. |

### Audio as MP3

Use `download_type: "audio"`, `output_format: "mp3"` and optionally `audio_quality: "192"`. Audio quality accepts `best` (default), `320`, `256`, `192` or `128`. Omit `video_quality` and `fps` for audio-only requests.

### Higher resolution or a metadata sidecar

Set `video_quality: "<=1080"` for a maximum of 1080p. Add `upload_metadata: true` to upload a metadata JSON sidecar alongside the media. Availability depends on the video's formats.

Advanced selection supports `fps` constraints such as `<=30`, `audio_language: "default"` or `"original"`, and `yt_dlp_format`. A custom `yt_dlp_format` overrides `video_quality`, `fps` and `audio_language`. Use `audio_quality` only with audio downloads and omit `audio_language` for video-only downloads.

## Read the job and get the file

The submission response contains `id` (`result.id` in the CLI). Pass that returned ID to `get_job`:

```sh
npx --yes --package=@flashdata-dev/mcp@0.1.0 flashdata call get_job --input - <<'JSON'
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
JSON
```

While `job.status` is `pending` or `processing`, read the same job again as needed. When it is `completed`, inspect `output.results[0]` for `file_url`, `file_size`, `downloaded_bytes`, `md5` and `output_format`. CLI responses wrap these objects inside `result`. A private storage URL requires access through your storage provider.

Downloads reserve Credits before work and settle by actual uploaded bytes. `get_pricing` with `{"source":"youtube_download"}` returns the per-TB rate; it cannot give an exact file cost from duration alone. Job reads are free. Use this for media the user is authorized to download.

## Connection and errors

For hosted MCP, connect `https://data.flashdata.dev/mcp` using Streamable HTTP and an `X-API-Key` header in your client's protected settings. Keep keys out of chat and committed files.

Storage credentials are transmitted to FlashData to perform the upload; MCP clients may retain tool arguments in their history. Use narrowly scoped credentials, and do not print credentials or signed access tokens in the returned file summary.

If a submission times out, do not resubmit automatically; it may already have been charged. Use `get_job` if an ID was returned. Without an ID, report the outcome as unknown and check Jobs in the FlashData console; `get_job` cannot look up a job without its ID. A failed or pending job is not a completed upload. For a chunked MCP response, use `get_result` with the returned `result_id` and `next_offset` as `offset`, then join the text chunks before parsing. The CLI returns complete JSON.
