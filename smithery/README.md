# Independent Smithery task servers

Each entry below is a separate local stdio MCP server, with one fixed FlashData source and three supporting tools: `get_pricing`, `get_job` and `get_result`. Read its guide for inputs, output examples, costs and installation. Node.js 22.18+ and a FlashData API Key are required. MCPB bundles include their production JavaScript dependencies.

The MIT-licensed software is free. FlashData data calls consume paid Credits; Smithery and client/model plans are separate. A pricing check is free and does not run a data query.

| Capability | Smithery entry | Usage guide |
| --- | --- | --- |
| Google Search | [flashdata/google-search](https://smithery.ai/servers/flashdata/google-search) | [Guide](servers/google-search/README.md) |
| Google News | [flashdata/google-news](https://smithery.ai/servers/flashdata/google-news) | [Guide](servers/google-news/README.md) |
| Google Images | [flashdata/google-images](https://smithery.ai/servers/flashdata/google-images) | [Guide](servers/google-images/README.md) |
| Google Shopping | [flashdata/google-shopping](https://smithery.ai/servers/flashdata/google-shopping) | [Guide](servers/google-shopping/README.md) |
| Google Video Search | [flashdata/google-video-search](https://smithery.ai/servers/flashdata/google-video-search) | [Guide](servers/google-video-search/README.md) |
| Google Places | [flashdata/google-places](https://smithery.ai/servers/flashdata/google-places) | [Guide](servers/google-places/README.md) |
| YouTube Search | [flashdata/youtube-search](https://smithery.ai/servers/flashdata/youtube-search) | [Guide](servers/youtube-search/README.md) |
| YouTube Extended Search | [flashdata/youtube-extended-search](https://smithery.ai/servers/flashdata/youtube-extended-search) | [Guide](servers/youtube-extended-search/README.md) |
| YouTube Metadata | [flashdata/youtube-metadata](https://smithery.ai/servers/flashdata/youtube-metadata) | [Guide](servers/youtube-metadata/README.md) |
| YouTube Transcript | [flashdata/youtube-transcript](https://smithery.ai/servers/flashdata/youtube-transcript) | [Guide](servers/youtube-transcript/README.md) |
| YouTube Captions | [flashdata/youtube-captions](https://smithery.ai/servers/flashdata/youtube-captions) | [Guide](servers/youtube-captions/README.md) |
| YouTube Trainability | [flashdata/youtube-trainability](https://smithery.ai/servers/flashdata/youtube-trainability) | [Guide](servers/youtube-trainability/README.md) |
| YouTube Channel Data | [flashdata/youtube-channel](https://smithery.ai/servers/flashdata/youtube-channel) | [Guide](servers/youtube-channel/README.md) |
| YouTube Autocomplete | [flashdata/youtube-autocomplete](https://smithery.ai/servers/flashdata/youtube-autocomplete) | [Guide](servers/youtube-autocomplete/README.md) |
| YouTube Download | [flashdata/youtube-download](https://smithery.ai/servers/flashdata/youtube-download) | [Guide](servers/youtube-download/README.md) |

The original [combined server](https://smithery.ai/servers/flashdata/flashdata) remains available. Listing visibility and search indexing are separate from building or uploading a bundle; release and discovery evidence is maintained in [FlashData GTM](https://github.com/flashdata-dev/flashdata-gtm/blob/main/docs/channel-plans/09-smithery.md).

## Build and verify

```sh
npm ci
npm test
npm run build:smithery
```

The builder writes 15 bundles, SHA-256 hashes, metadata and release payloads to `dist/smithery`. It validates manifests against the official MCPB 0.3 schema, installs locked production dependencies in an isolated temporary directory, and refuses to overwrite a bundle file. Use a new empty output directory for a rebuild: `npm run build:smithery -- /absolute/path/to/output`.

To test the actual bundles, set `FLASHDATA_TASK_BUNDLE_DIR` to the output directory and run `node --test test/task-servers.test.js`. The tests unpack all 15 bundles and connect to each over stdio against isolated local HTTP fixtures. They verify permitted queries, rejected cross-source calls and pricing, job provenance before result download, scope removal, revocation and large-result reads. They do not make paid API calls or write to real storage.

## Scope and publication design

Each generated `server.js` fixes its source in code; neither a broad API Key nor environment variables can change it. Tool listing and direct calls enforce the same boundary. Job source is checked before returning details or downloading results; source permissions are revalidated on every operation. Every process owns a separate short-lived result cache. The original combined CLI/MCP behavior is unchanged.

Smithery's [Local MCPB publishing](https://smithery.ai/docs/build/publish) supports pre-built bundles and [stdio releases](https://smithery.ai/docs/api-reference/servers/publish-a-server). These entries distribute local software; they do not create new hosted endpoints or deploy the FlashData product. The builder's release payload uses the same stdio fields as official `smithery@1.2.0`, with complete tool input schemas from the runtime.

Publishing requires the owner's Smithery credentials. Create the qualified server, upload its bundle and `.release.json` payload, apply its `.metadata.json`, then verify release status, public detail, download and search separately. Do not print tokens, overwrite a published version, or infer public search coverage from `SUCCESS` alone. Optional Verified is not part of this release.
