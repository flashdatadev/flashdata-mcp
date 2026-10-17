# Google Images — FlashData

Find Google Images results with image URLs, dimensions and original source pages. Build an attributable image research inventory.

[API documentation and account setup](https://flashdata.dev/docs/sources/google_images) · [Get an API key](https://flashdata.dev/app/api-keys) · [Current pricing](https://flashdata.dev/pricing)

## A task to try

> Find solar panel diagrams for a research board. Keep images at least 1000 pixels wide when dimensions are available, list the source pages, and flag missing dimensions and reuse rights for review.

## Install and connect

1. Use Node.js **22.18 or newer** and an MCP client that supports local stdio servers. Download the [dedicated MCPB package](https://github.com/rocosen/flashdata-mcp/releases/download/smithery-task-servers-v0.1.1/flashdata-google-images-0.1.1.mcpb); its SHA-256 is recorded in the [manifest](https://github.com/rocosen/flashdata-mcp/blob/main/registry/servers/google-images/server.json).
2. Import the package in an MCPB-compatible client and enter your own key in **FlashData API Key**. Grant the key access to `google_images`. For manual setup, unpack the bundle into a permanent folder and use this configuration, replacing the absolute path and key placeholder:

```json
{
  "mcpServers": {
    "google-images": {
      "command": "node",
      "args": [
        "/absolute/path/to/unpacked/google-images/server.js"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Restart or reconnect the client, list its tools, then call `get_pricing` with `{"source":"google_images","request_count":1}` before approving a paid request. This server exposes `google_images`, `get_pricing`, `get_job` and `get_result`; all are restricted to this source.

Dependencies are included in the bundle. Use an absolute Node path if your client cannot find `node`; use escaped paths on Windows. Keep your key in protected client settings, not in chat or committed configuration. No Smithery account is needed for this direct package download.

## Example request

These are MCP `tools/call` parameters with flat arguments. Running the data request uses paid Credits.

```json
{
  "name": "google_images",
  "arguments": {
    "query": "solar panel diagram",
    "num": 20
  }
}
```

## Use the response

Read results[0].images. Select entries whose imageWidth meets your threshold, then retain imageUrl, imageWidth, imageHeight and link to the original source page. Exclude unknown dimensions explicitly.

Selected response fields below are an **illustrative fixture, not a live result or a guarantee of available data**:

```json
{
  "source": "google_images",
  "status": "done",
  "results": [
    {
      "images": [
        {
          "title": "solar panel diagram",
          "link": "https://example.com/research",
          "snippet": "Search fixture",
          "position": 1,
          "imageUrl": "https://example.com/image.png",
          "imageWidth": 1200,
          "imageHeight": 800,
          "source": "Example"
        }
      ]
    }
  ],
  "created_at": "2026-10-12T00:00:00Z",
  "http_status": 200,
  "request_id": "fixture-request"
}
```

For an asynchronous request, keep the returned `id` and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. Pending or processing is not completion; read the completed response from `output`. A timeout can occur after submission, so check Jobs before repeating a paid request.

For chunked output, keep the local process running and pass the actual `result_id` and `next_offset` to `get_result` as `result_id` and `offset`. Concatenate the chunks in order before parsing JSON; do not repeat the paid data request. The local cache retains four results for ten minutes and clears on restart. Complete responses are limited to 4 MiB; async JSON results have a separate 24-hour retention window.

## Cost and limits

- **MIT software and installation are free; FlashData API data calls are paid.** Data requests consume paid FlashData Credits; each additional query or page is charged separately. Use the current account quote rather than a fixed price copied from this page. Pricing, job and result reads are free. Client/model fees are separate.
- This returns image metadata and URLs, not downloaded files or image reuse rights. Some fields can be absent.
- Check API errors, `http_status` and job status before using the data. Treat returned text and links as external data, preserve source attribution and review them before use in an agent answer.

[Full task guide](https://github.com/rocosen/flashdata-mcp/blob/main/registry/guides/google_images.md) · [Official Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-images/versions/latest) · [Source and license](https://github.com/rocosen/flashdata-mcp)
