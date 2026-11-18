# YouTube Download to Cloud Storage MCP: installation and example

Send an authorized YouTube video or clip to storage you control. The tool starts a background job; the completed job identifies the uploaded file. It does not save media to the MCP client. Installation is free; delivery reserves Credits and settles on actual uploaded bytes.

[YouTube Download inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_download?utm_source=official-mcp-registry&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download-guide) · [Create an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## Connect and check cost

Download [MCPB 0.3.0](https://github.com/flashdatadev/flashdata-mcp/releases/download/v0.4.0/flashdata-youtube-download-0.3.0.mcpb) from the official FlashData repository and verify its SHA-256 against the [manifest](../servers/youtube-download/server.json). It runs locally with Node.js 22.18+ and exposes `youtube_download`, `get_pricing`, `get_job` and `get_result`.

In a client that supports MCPB installation, import that package and enter your own FlashData API Key into **FlashData API Key**. The bundled configuration supplies `FLASHDATA_API_KEY` to the local process. Your key must grant `youtube_download`. Client installation interfaces differ; Registry publication does not mean every client has indexed this entry.

For manual stdio setup, unpack the bundle into a permanent directory and configure:

```json
{
  "mcpServers": {
    "youtube-download": {
      "command": "node",
      "args": ["/absolute/path/to/unpacked/youtube-download/server.js"],
      "env": {"FLASHDATA_API_KEY": "YOUR_API_KEY"}
    }
  }
}
```

If your client cannot find Node, configure its absolute path. The bundle includes its dependencies. Keep the key in protected client settings.

Call `get_pricing` with `{}` for the per-TB rate. Do not pass `request_count`: delivery cost depends on uploaded bytes.

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
    },
    "response_format": "json"
  }
}
```

Copy the request outside the repository, replace the video and storage placeholders with your authorized destination, and restrict the file permissions. Use Python 3.10+ and first install `python3 -m pip install -r registry/examples/requirements.txt`. The optional combined hosted helper (`python3 registry/examples/call_tool.py /absolute/path/to/private-request.json`) accepts that private file; do not commit or paste storage credentials into chat.

The hosted helper sends one tool call and prints its structured response. It does not automatically retry paid submissions or poll jobs. [Request file](../examples/youtube_download.json).

## Use the result

Save the returned `id`. Call `get_job` with `{"job_id":"RETURNED_JOB_ID","response_format":"json"}` and wait for `job.status` to be `completed`. Read `output.results[0]` for `file_url`, `file_size`, `downloaded_bytes` and `output_format`. Access to the file follows your storage permissions; a private object URL is not a public download link.

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

For a chunked response, call `get_result` with the returned `result_id` and `next_offset` (as `offset`) in the same running process. Concatenate the chunks in order. Parse JSON only when `encoding` is `json`; Markdown and plain text are documents. Do not repeat the paid request. See [result handling](../README.md#results-and-background-jobs).

## Limits and interpretation

Only asynchronous delivery is supported. Supply your own destination and credentials; media access and retention follow your storage settings. Private object URLs are not public download links. Charges reserve Credits and settle by uploaded bytes.

Treat retrieved titles, captions, descriptions and links as external data. Inspect API errors, `http_status` and job status before consuming output. A timed-out submission may already have been charged; check Jobs before trying again.

## Temporary storage credentials (STS)

Use `session_token` with the matching temporary `access_key` and `secret_key` for
`s3`, `s3_compatible` (when the provider supports STS), `oss`, `cos`, `bos` and `tos`.
Map AWS/BOS/TOS SessionToken, OSS SecurityToken or COS Token to `session_token`.
Keep the usual bucket, region and `endpoint_url` fields for your provider.
For example, the storage object can be:

```json
{
  "storage_type": "s3",
  "storage_url": "your-media-bucket",
  "region": "us-east-1",
  "access_key": "YOUR_TEMPORARY_ACCESS_KEY",
  "secret_key": "YOUR_TEMPORARY_SECRET_KEY",
  "session_token": "YOUR_SESSION_TOKEN",
  "object_prefix": "flashdata/downloads"
}
```

Put this object in the integration's private storage configuration, not a model
prompt. MCP download arguments use `storage`; the REST API uses `params.storage`.
Single and batch downloads use the same storage fields. Omit the token for
long-term keys, GCS (`service_account`) and Azure (`sas_token`). A token must be a
nonempty string of at most 16,384 characters without whitespace/control characters.
Credentials must last through queueing, download and upload retries. FlashData does
not refresh them automatically. Use a release containing this STS update; older
pinned packages can reject the new field.
