---
name: youtube-download
description: "将 YouTube 视频、音频或片段异步交付至用户自有云存储，提交后按job ID读取状态与交付清单；按实际交付量计费。需确认下载权限、存储目标和预算。 需配置FlashData API Key，数据调用消耗付费Credits。"
license: MIT
metadata:
  author: FlashData
---

# FlashData YouTube 下载到云存储

将 YouTube 视频、音频或片段异步交付至用户自有云存储，提交后按job ID读取状态与交付清单；按实际交付量计费。需确认下载权限、存储目标和预算。 需配置FlashData API Key，数据调用消耗付费Credits。

[功能文档与官网](https://flashdata.dev/docs/sources/youtube_download?utm_source=modelscope&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download-task) · [获取 API Key](https://flashdata.dev/app/api-keys) · [当前价格](https://flashdata.dev/pricing)

## 在支持 Skills 的 Agent 中使用

从魔搭下载此 Skill，保留文件夹结构，放入所用 Agent 支持的 Skills 目录，再按客户端文档启用。此 Skill 使用终端命令；运行环境需要 Node.js 22.18+、npm 和联网能力，并通过该环境的密钥配置提供 `FLASHDATA_API_KEY`。沙箱需要在沙箱内配置这些依赖，不能假设宿主机配置自动可用。

示例任务：

> 在确认下载权限、目标存储和预算后，将指定视频的前10秒交付到我的云存储；只提交一次，使用job ID跟踪结果。

安装 Skill 和 CLI 免费；下面的数据查询消耗 FlashData Credits，客户端/模型和适用的存储费用另计。读取 Skill 不代表授权执行付费示例；根据用户任务和已授权预算选择参数。API Key 不应写进 Skill、公开表单或对话。

先检查本地CLI能否启动（不提交数据请求）：

```sh
npx --yes --package=@flashdata-dev/youtube-cloud-storage@0.1.0 flashdata-youtube-cloud-storage --help
```

已配置密钥后，可使用 `npx --yes --package=@flashdata-dev/youtube-cloud-storage@0.1.0 flashdata-youtube-cloud-storage call get_pricing` 免费读取当前价格；价格检查不等于实际数据查询成功。普通同步查询直接处理返回的 `result`，不要求存在job ID。需要异步时显式传入 `mode: "async"`，保存提交返回的 `id`（CLI为 `result.id`），用 `get_job` 的 `job_id` 读取同一任务，完成后从 `output`（CLI为 `result.output`）取结果。下载始终使用异步模式。不要在超时后自动重复提交收费请求。

下载还需要用户自有存储；在私密JSON文件中保存目标与凭据，并将 `FLASHDATA_STORAGE_FILE` 设置为文件路径，见[存储配置](references/storage.md)。上传所需的存储凭据会随请求发送至FlashData；只使用用户授权的目标和预算。

## API 调用、参数与结果参考


Send a YouTube video, audio track or selected clip directly to your own cloud storage. Choose the media type, format and quality, then use the returned job ID to retrieve the completed file location and size.

[Documentation](https://flashdata.dev/docs/sources/youtube_download?utm_source=modelscope&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download-task) · [Get an API key](https://flashdata.dev/app/api-keys)

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
' | npx --yes --package=@flashdata-dev/youtube-cloud-storage@0.1.0 flashdata-youtube-cloud-storage call youtube_download --input -
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
npx --yes --package=@flashdata-dev/youtube-cloud-storage@0.1.0 flashdata-youtube-cloud-storage call get_job --input - <<'JSON'
{"job_id":"job_REPLACE_WITH_RETURNED_ID"}
JSON
```

While `job.status` is `pending` or `processing`, read the same job again as needed. When it is `completed`, inspect `output.results[0]` for `file_url`, `file_size`, `downloaded_bytes`, `md5` and `output_format`. CLI responses wrap these objects inside `result`. A private storage URL requires access through your storage provider.

Downloads reserve Credits before work and settle by actual uploaded bytes. `get_pricing` with `{"source":"youtube_download"}` returns the per-TB rate; it cannot give an exact file cost from duration alone. Job reads are free. Use this for media the user is authorized to download.

## Connection and errors

For hosted MCP, connect `https://data.flashdata.dev/mcp` using Streamable HTTP and an `X-API-Key` header in your client's protected settings. Keep keys out of chat and committed files.

Storage credentials are transmitted to FlashData to perform the upload; MCP clients may retain tool arguments in their history. Use narrowly scoped credentials, and do not print credentials or signed access tokens in the returned file summary.

If a submission times out, do not resubmit automatically; it may already have been charged. Use `get_job` if an ID was returned. Without an ID, report the outcome as unknown and check Jobs in the FlashData console; `get_job` cannot look up a job without its ID. A failed or pending job is not a completed upload. For a chunked MCP response, use `get_result` with the returned `result_id` and `next_offset` as `offset`, then join the text chunks before parsing. The CLI returns complete JSON.
