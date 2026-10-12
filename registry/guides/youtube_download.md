# Deliver a YouTube clip to S3 or customer cloud storage with FlashData MCP

Deliver an authorized clip to your own storage and keep a manifest for downstream processing.

[YouTube Download inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_download?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Follow the [hosted MCP setup](../README.md#connect-and-verify) using your own FlashData API Key, with access to `youtube_download`. The Official Registry entry connects to the hosted service; no local MCP server is needed. For the runnable SDK examples, clone this repository and run `npm ci` with Node.js 22.18 or later. Supply `FLASHDATA_API_KEY` through your environment or secret manager.

Call `get_pricing` with `{"source":"youtube_download","request_count":1}` before running the data request. Pricing reads are free. The software and examples are free; data queries consume paid FlashData Credits, billed separately by FlashData. Download pricing is per delivered byte volume, not per request.

## Tool request

MCP `tools/call` parameters use flat arguments, not a REST `params` wrapper. Adjust these example inputs for your task. Running the data request below is a paid operation.

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

Copy the request outside the repository, replace the video and storage placeholders with your authorized destination, and restrict the file permissions. Run the helper with that private file path; do not commit or paste storage credentials into chat.

The helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_download.json).

## Use the result

Submit once, save the returned id, and call get_job with job_id until job.status is completed. Read output.results[0] for file_url, file_size, downloaded_bytes and output_format. Pending or processing is not completed delivery.

Representative fixture showing selected response fields, **not a live query or a guaranteed result**:

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

For example, after receiving the real id, call `get_job` with `{"job_id":"job_REPLACE_WITH_RETURNED_ID"}`. Poll only the read, not the original download submission. Storage credentials travel to FlashData to perform the upload and may be retained by your MCP client in tool history; use narrowly scoped credentials and your client's protected configuration.

For a large result, the response contains `result_id`, `chunk` and `next_offset`. Call `get_result` with that ID and offset, using the same API Key; concatenate chunks in order and parse the complete JSON. Do not repeat the paid query to fetch missing chunks. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

Only asynchronous delivery is supported. Supply your own destination and credentials; media access and retention follow your storage settings. Private object URLs are not public download links. Charges reserve Credits and settle by uploaded bytes.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.
