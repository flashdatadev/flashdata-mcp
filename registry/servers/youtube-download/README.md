# YouTube Download to Cloud Storage MCP

Send an authorized YouTube video or clip to storage you control. The tool starts a background job; the completed job identifies the uploaded file. It does not save media to the MCP client. Installation is free; delivery reserves Credits and settles on actual uploaded bytes.

[Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing) · [API documentation](https://flashdata.dev/docs/sources/youtube_download)

## Install

1. Install Node.js **22.18 or newer** and download the [official MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-download-0.3.0.mcpb). Verify its SHA-256 against the [manifest](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/servers/youtube-download/server.json).
2. Import the bundle into an MCPB-compatible client. Enter your own key in **FlashData API Key**; it must grant `youtube_download`. For manual stdio configuration, use the [setup guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_download.md).
3. List the tools. Call `get_pricing` with `{}` for the per-TB rate. Do not pass `request_count`: delivery cost depends on uploaded bytes.

## Example: deliver a ten-second MP4 clip to your S3 bucket

Use a video you are authorized to download and a bucket you can write to. Replace the storage placeholders in your private client configuration. See the [storage guide](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_download.md#temporary-storage-credentials-sts) for temporary credentials.

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
    },
    "response_format": "json"
  }
}
```

Save the returned `id`. Call `get_job` with `{"job_id":"RETURNED_JOB_ID","response_format":"json"}` and wait for `job.status` to be `completed`. Read `output.results[0]` for `file_url`, `file_size`, `downloaded_bytes` and `output_format`. Access to the file follows your storage permissions; a private object URL is not a public download link.

See the [guide and sample output](https://github.com/flashdatadev/flashdata-mcp/blob/main/registry/guides/youtube_download.md) for a representative response and instructions for reading large results without repeating the paid request.
