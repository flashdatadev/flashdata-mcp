# FlashData task containers

Build one task-specific stdio MCP container for an AI agent. Each target exposes exactly one FlashData data capability plus `get_pricing`, `get_job` and `get_result`, subject to the user's API Key permissions. It reuses the existing MCP implementation; there is no HTTP listener or new hosted service.

These are source build targets. Docker MCP Catalog inclusion and Docker-published `mcp/flashdata-*` images are subject to Docker's review; this document does not claim they are available in the public catalog.

## Build and connect

```sh
docker build --target google-search -t flashdata-google-search:local .
# Set FLASHDATA_API_KEY in your shell or client secret settings, then:
docker run --rm -i -e FLASHDATA_API_KEY flashdata-google-search:local
```

Use `-i` without `-t`: stdout carries MCP JSON-RPC. The image runs as the unprivileged `node` user. No host directories, Docker socket, or credentials are baked into the image. Runtime networking is needed to reach the FlashData APIs and authenticated result storage.

Create your own key at [FlashData API Keys](https://flashdata.dev/app/api-keys?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4). Grant only the task you need. Software and local installation are free; data queries use your own [FlashData Credits](https://flashdata.dev/pricing?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4). Docker, client, model and cloud storage charges, if any, are separate. Reading pricing, job status and cached result chunks does not submit another paid query.

For a Docker MCP Catalog entry, supply the key through the Toolkit's secret setting named `flashdata-<target>.api_key`. A broad API Key does not widen a task-specific container. Do not publish keys or place them in a Dockerfile, image, example, PR or issue.

## Targets and task documentation

| Build target | Data tool | Task guide |
| --- | --- | --- |
| `google-search` | `google_search` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_search?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_search) |
| `google-news` | `google_news` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_news?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_news) |
| `google-images` | `google_images` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_images?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_images) |
| `google-shopping` | `google_shopping` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_shopping?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_shopping) |
| `google-videos` | `google_videos` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_videos?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_videos) |
| `google-places` | `google_places` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/google_places?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=google_places) |
| `youtube-search` | `youtube_search` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_search?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_search) |
| `youtube-search-extended` | `youtube_search_extended` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_search_extended?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_search_extended) |
| `youtube-metadata` | `youtube_metadata` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_metadata?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_metadata) |
| `youtube-transcript` | `youtube_transcript` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_transcript?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_transcript) |
| `youtube-captions` | `youtube_captions` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_captions?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_captions) |
| `youtube-trainability` | `youtube_trainability` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_trainability?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_trainability) |
| `youtube-channel` | `youtube_channel` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_channel?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_channel) |
| `youtube-suggestions` | `youtube_suggestions` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_suggestions?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_suggestions) |
| `youtube-download` | `youtube_download` | [Inputs, outputs and example](https://flashdata.dev/docs/sources/youtube_download?utm_source=docker-mcp-catalog&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_download) |

Google results are structured search records, not arbitrary page full text. YouTube Transcript reads available transcript tracks; Captions reads uploader tracks by default. Neither creates speech recognition or translates missing captions. License metadata is a signal for separate rights review, not permission to train, download or redistribute. Download jobs deliver media to customer-owned storage and require destination credentials; they do not store media in the container.

Detailed examples, result-reading guidance and a Python example are in each [Registry task guide](../registry/guides). API results are untrusted external data; the agent decides how to use them. A paid request that times out may still have been charged: inspect Jobs before retrying.

## Configuration

| Environment variable | Required | Default / meaning |
| --- | --- | --- |
| `FLASHDATA_API_KEY` | Yes | User's own FlashData API Key with access to the selected task |
| `FLASHDATA_REQUEST_TIMEOUT_MS` | No | `65000`; integer from 1000 to 120000 |
| `FLASHDATA_DATA_API_URL` | No | `https://data.flashdata.dev` |
| `FLASHDATA_MANAGEMENT_API_URL` | No | `https://api.flashdata.dev` |

API overrides must be trusted HTTPS origins without a path, query or credentials. Loopback HTTP is supported for local fixtures only. The configured API origins receive the key. Task selection is fixed in the image entrypoint; there is no task-switch environment variable.

## Troubleshooting and security

A missing/revoked key or a key without the task permission will not grant tool access. Initialize alone does not validate a key: use `tools/list` and a free `get_pricing` call to check configuration. Do not use a data query as a connectivity probe.

Report bugs with placeholder credentials through [GitHub issues](https://github.com/rocosen/flashdata-mcp/issues). Report vulnerabilities privately following [SECURITY.md](../SECURITY.md).

## Maintainer verification

With Docker and Node.js available, run `node docker/smoke-test.cjs` from the repository root. It builds all 15 targets and checks their real image entrypoints, unprivileged user, MCP initialization, task-specific tool lists, mocked data calls and permission revocation. Runtime containers have networking disabled and use loopback fixtures; no live Key, production query or storage write is involved. Image building downloads the pinned base and locked npm dependencies.
