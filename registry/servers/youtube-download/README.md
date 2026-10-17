# YouTube Download to Cloud Storage — FlashData

Deliver YouTube video, audio or clips to your own S3 or other supported cloud storage. Track asynchronous delivery and its output manifest.

[API documentation and account setup](https://flashdata.dev/docs/sources/youtube_download) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## A task to try

> Deliver the first 10 seconds of my authorized video to my configured S3 destination. Show the current byte-volume rate before submitting; save the job ID and check that same job until delivery completes. Return the file manifest.

Storage credentials in the example are placeholders. Enter real values only through your protected client configuration or a private request file. They are sent to FlashData to upload the media and may be retained in your MCP client’s tool history. Use a destination and media you are authorized to use.

## Install and connect

1. Use Node.js **22.18 or newer** and an MCP client that supports local stdio servers. Download the [dedicated MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-youtube-download-0.1.1.mcpb); its SHA-256 is recorded in the [manifest](https://github.com/rocosen/flashdata-mcp/blob/main/registry/servers/youtube-download/server.json).
2. Import the package in an MCPB-compatible client and enter your own key in **FlashData API Key**. Grant the key access to `youtube_download`. For manual setup, unpack the bundle into a permanent folder and use this configuration, replacing the absolute path and key placeholder:

```json
{
  "mcpServers": {
    "youtube-download": {
      "command": "node",
      "args": [
        "/absolute/path/to/unpacked/youtube-download/server.js"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Restart or reconnect the client, list its tools, then call `get_pricing` with `{"source":"youtube_download"}` to read the current byte-volume rate before approving a download. `request_count` does not apply to downloads. This server exposes `youtube_download`, `get_pricing`, `get_job` and `get_result`; all are restricted to this source.

Dependencies are included in the bundle. Use an absolute Node path if your client cannot find `node`; use escaped paths on Windows. Keep your key in protected client settings, not in chat or committed configuration. No Smithery account is needed for this direct package download.

## Example request

These are MCP `tools/call` parameters with flat arguments. Running the data request uses paid Credits.

```json
{
  "name": "youtube_download",
  "arguments": {
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
}
```

## Use the response

Submit once, save the returned id, and call get_job with job_id until job.status is completed. Read output.results[0] for file_url, file_size, downloaded_bytes and output_format. Pending or processing is not completed delivery.

Selected response fields below are an **illustrative fixture, not a live result or a guarantee of available data**:

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

After submission, keep the returned `id` and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. Repeat only that free status read while pending or processing; a completed job contains the file manifest shown above. A timeout can occur after submission, so check Jobs before submitting again.

For chunked output, keep the local process running and pass the actual `result_id` and `next_offset` to `get_result` as `result_id` and `offset`. Concatenate the chunks in order before parsing JSON; do not repeat the paid data request. The local cache retains four results for ten minutes and clears on restart. Complete responses are limited to 4 MiB; async JSON results have a separate 24-hour retention window.

## Cost and limits

- **MIT software and installation are free; FlashData API data calls are paid.** Downloads reserve Credits and settle by actual uploaded byte volume. `get_pricing` returns the current per-TB byte rate, not a per-request download quote; your storage provider may also charge for storage or transfer. Pricing, job and result reads are free. Client/model fees are separate.
- Only asynchronous delivery is supported. Supply your own destination and credentials; media access and retention follow your storage settings. Private object URLs are not public download links. Charges reserve Credits and settle by uploaded bytes.
- Check API errors, `http_status` and job status before using the data. Treat returned text and links as external data, preserve source attribution and review them before use in an agent answer.

[Full task guide](https://github.com/rocosen/flashdata-mcp/blob/main/registry/guides/youtube_download.md) · [Official Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-download/versions/latest) · [Source and license](https://github.com/rocosen/flashdata-mcp)
