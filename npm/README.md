# Task packages for npm and npx

Choose the data capability you need. Each package provides a JSON CLI and a stdio MCP server, restricted to one FlashData source. The source code and dependencies are shared, while each published artifact contains only its own data schema and a fixed entry point. Package names and versions below are release targets; consult npm for publication availability.

Requires Node.js 22.18 or newer and your own FlashData API key with the selected source enabled. Installation is free under MIT; FlashData data queries consume paid Credits. Pricing and job reads are free. Client/model and customer storage fees are separate.

| Capability and guide | npm package | Task |
| --- | --- | --- |
| [Google Search](docs/google-search/README.md) | [`@flashdata-dev/google-search`](https://www.npmjs.com/package/@flashdata-dev/google-search) | `google_search` |
| [Google News](docs/google-news/README.md) | [`@flashdata-dev/google-news`](https://www.npmjs.com/package/@flashdata-dev/google-news) | `google_news` |
| [Google Images](docs/google-images/README.md) | [`@flashdata-dev/google-images`](https://www.npmjs.com/package/@flashdata-dev/google-images) | `google_images` |
| [Google Shopping](docs/google-shopping/README.md) | [`@flashdata-dev/google-shopping`](https://www.npmjs.com/package/@flashdata-dev/google-shopping) | `google_shopping` |
| [Google Video Search](docs/google-video-search/README.md) | [`@flashdata-dev/google-video-search`](https://www.npmjs.com/package/@flashdata-dev/google-video-search) | `google_videos` |
| [Google Places](docs/google-places/README.md) | [`@flashdata-dev/google-places`](https://www.npmjs.com/package/@flashdata-dev/google-places) | `google_places` |
| [YouTube Search](docs/youtube-search/README.md) | [`@flashdata-dev/youtube-search`](https://www.npmjs.com/package/@flashdata-dev/youtube-search) | `youtube_search` |
| [YouTube Extended Search](docs/youtube-extended-search/README.md) | [`@flashdata-dev/youtube-extended-search`](https://www.npmjs.com/package/@flashdata-dev/youtube-extended-search) | `youtube_search_extended` |
| [YouTube Metadata](docs/youtube-metadata/README.md) | [`@flashdata-dev/youtube-metadata`](https://www.npmjs.com/package/@flashdata-dev/youtube-metadata) | `youtube_metadata` |
| [YouTube Transcript](docs/youtube-transcript/README.md) | [`@flashdata-dev/youtube-transcript`](https://www.npmjs.com/package/@flashdata-dev/youtube-transcript) | `youtube_transcript` |
| [YouTube Captions](docs/youtube-captions/README.md) | [`@flashdata-dev/youtube-captions`](https://www.npmjs.com/package/@flashdata-dev/youtube-captions) | `youtube_captions` |
| [YouTube Creative Commons License Metadata](docs/youtube-trainability/README.md) | [`@flashdata-dev/youtube-trainability`](https://www.npmjs.com/package/@flashdata-dev/youtube-trainability) | `youtube_trainability` |
| [YouTube Channel Data](docs/youtube-channel/README.md) | [`@flashdata-dev/youtube-channel`](https://www.npmjs.com/package/@flashdata-dev/youtube-channel) | `youtube_channel` |
| [YouTube Autocomplete](docs/youtube-autocomplete/README.md) | [`@flashdata-dev/youtube-autocomplete`](https://www.npmjs.com/package/@flashdata-dev/youtube-autocomplete) | `youtube_suggestions` |
| [YouTube Download to Cloud Storage](docs/youtube-download/README.md) | [`@flashdata-dev/youtube-download`](https://www.npmjs.com/package/@flashdata-dev/youtube-download) | `youtube_download` |

## Run a task

Set `FLASHDATA_API_KEY` using your environment or secret manager. Choose a package from the table, then start with its help and free discovery:

```sh
npx --yes @flashdata-dev/google-news@0.1.0 --help
npx --yes @flashdata-dev/google-news@0.1.0 tools
npx --yes @flashdata-dev/google-news@0.1.0 call get_pricing
```

Each guide contains a task-specific query, output example, result-processing script, complete parameter table and its FlashData documentation link. Input comes from `--input <file>` or `--input -`; no credentials belong in command arguments. For MCP, use the same package with the single argument `mcp`.

Task CLIs expose their data source, `get_pricing` and `get_job`. MCP adds `get_result` for reading chunks in the same server process. Neither interface exposes batch or account-wide tools. Other-source calls and job reads are rejected, and API-key scopes are checked on each operation. CLI output is complete JSON; timed-out submissions are never automatically retried.

The existing [`@flashdata-dev/mcp`](https://www.npmjs.com/package/@flashdata-dev/mcp) remains the combined CLI/MCP package for multi-capability workflows. The two package types have independent versions. npm and npx use these same packages; npx is an execution path, not another public directory.

## Build and verify

```sh
npm ci
npm run build:npm-tasks
npm run test:npm-tasks
```

The build writes 15 tarballs plus an integrity manifest to `dist/npm`. It refuses to overwrite a task directory. Use a fresh output directory when rebuilding, for example `npm run build:npm-tasks -- /absolute/path/new-output`, then pass the same directory to `npm run test:npm-tasks -- /absolute/path/new-output`.

The installation test runs all 15 packed CLIs and MCP servers against local HTTP fixtures, including source boundaries, scope revocation, job isolation, large Unicode output and credential-free result downloads. It submits no paid API queries. Follow [the release procedure](../RELEASING.md) for publication and public installation verification; local tests do not establish public search visibility.
