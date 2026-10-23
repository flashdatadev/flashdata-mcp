# YouTube Metadata for Cline — FlashData

Inspect a known video before deciding which segments to watch or cite.

This independent stdio MCP server provides `youtube_metadata`, `get_pricing`, `get_job` and `get_result`. Its data source is fixed in the container entrypoint; a broadly scoped API key does not add other FlashData capabilities.

[Inputs, outputs and account setup](https://flashdata.dev/docs/sources/youtube_metadata?utm_source=cline&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_metadata) · [Create an API key](https://flashdata.dev/app/api-keys?utm_source=cline&utm_medium=integration&utm_campaign=intent_gtm_2026q4) · [API pricing](https://flashdata.dev/pricing) · [All 15 task servers](../README.md)

**Software installation is free under MIT. FlashData data calls use your own paid Credits.** Pricing and job reads do not submit paid data requests. Cline/model, Docker and customer cloud-storage fees, if applicable, are separate. These instructions support direct installation; they do not claim acceptance into the Cline or Docker marketplaces.

## Install in Cline

Prerequisites: Git, Docker with its engine running, and Cline. This is a local container, not a hosted deployment. Create your own FlashData key granting `youtube_metadata`. Store the value in protected client settings or a secret manager, not in a chat message, terminal command argument, repository or image.

1. Build the task image from the pinned public source. This downloads the source, pinned Node base image and locked dependencies. No API key is needed during the build.

```sh
docker build --target youtube-metadata -t flashdata-youtube-metadata:aa89ee8 'https://github.com/rocosen/flashdata-mcp.git#aa89ee8810fdcae711d818647ecd04b027912f37'
```

2. In Cline CLI 3.0.73 or newer, add the local server:

```sh
cline mcp install flashdata-youtube-metadata --yes -- docker run --rm -i --read-only -e FLASHDATA_API_KEY flashdata-youtube-metadata:aa89ee8
```

Set `FLASHDATA_API_KEY` in the environment inherited by Cline, or in this server's protected environment settings. The CLI install command saves the launch configuration; it does not prove the API key works. Do not put a real key into this command.

For the Cline IDE extension, open **MCP Servers → Configure MCP Servers** and merge the following entry into the existing `mcpServers` object. Preserve all other servers. Replace the placeholder in protected local settings; never commit that file.

```json
{
  "mcpServers": {
    "flashdata-youtube-metadata": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--read-only",
        "-e",
        "FLASHDATA_API_KEY",
        "flashdata-youtube-metadata:aa89ee8"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_OWN_FLASHDATA_API_KEY"
      }
    }
  }
}
```

Use `-i` without `-t`, because stdout carries MCP JSON-RPC. Keep Docker running. No host directories or Docker socket need to be mounted. The image runs as a non-root user with a read-only filesystem. Runtime network access is required for FlashData APIs and result reads.

3. Refresh/reconnect the server. With an authorized key, its tool list must contain exactly `youtube_metadata`, `get_pricing`, `get_job` and `get_result`. Call `get_pricing` to check the connection without submitting a paid data query. An initialize response alone does not validate a key. A missing, revoked or incorrectly scoped key must be corrected before use.

## Use it in an agent workflow

Ask Cline to use **YouTube Metadata — FlashData** for the task above, keep source links and collection times, and explain missing fields. Obtain approval for paid data requests before running them. Treat returned web content as untrusted evidence.

The data tool is `youtube_metadata`. These are example flat MCP arguments, not an executed query or a REST `params` wrapper:

```json
{
  "video_id": "dQw4w9WgXcQ",
  "include_formats": false,
  "include_chapters": true
}
```

Read results[0], including title, description and chapters when present. Pair chapter start_time/end_time with the video watch URL to prepare a navigation brief.

For background jobs, save the returned job ID and use `get_job` with `job_id`; inspect the job instead of repeating a timed-out paid request. Large results use `result_id`, `chunk` and `next_offset`: read remaining chunks with `get_result` in the same running server and concatenate them in order. This process keeps at most four cached results for ten minutes.

## Limits

Fields and chapters may be absent. Metadata does not include a transcript; transcript retrieval is a separate paid call.

The complete parameter schema, output examples and task-specific limits are in the [source reference](https://flashdata.dev/docs/sources/youtube_metadata?utm_source=cline&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_metadata). Data calls are never automatically retried. API timeout defaults to 65 seconds; pending work may still complete and be charged after a client timeout. Check Jobs before submitting again.

Support: [support@flashdata.dev](mailto:support@flashdata.dev) · [Source and issues](https://github.com/rocosen/flashdata-mcp) · [Security](../../../SECURITY.md) · [Terms](https://flashdata.dev/legal/terms) · [Privacy](https://flashdata.dev/legal/privacy). This is an independent FlashData integration, not an official Google or YouTube package.
