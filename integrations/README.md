# Google and YouTube tasks for Cursor and Gemini CLI

Choose the capability you need. Each plugin or extension runs a pinned, source-restricted npm package and exposes one data tool plus pricing, job and result reads for that source. Node.js 22.18 or newer and a source-enabled FlashData API key are required.

Installation is free. FlashData data calls consume paid Credits; client/model and applicable storage fees are separate. Get a key from [your console](https://flashdata.dev/app/api-keys) and review [API pricing](https://flashdata.dev/pricing).

| Task | Cursor plugin source | Gemini extension repository | Data tool |
| --- | --- | --- | --- |
| Google Search | [google-search-flashdata](../plugins/cursor/google-search/README.md) | [google-search-flashdata](https://github.com/flashdata-dev/google-search-gemini) | `google_search` |
| Google News | [google-news-flashdata](../plugins/cursor/google-news/README.md) | [google-news-flashdata](https://github.com/flashdata-dev/google-news-gemini) | `google_news` |
| Google Images | [google-images-flashdata](../plugins/cursor/google-images/README.md) | [google-images-flashdata](https://github.com/flashdata-dev/google-images-gemini) | `google_images` |
| Google Shopping | [google-shopping-flashdata](../plugins/cursor/google-shopping/README.md) | [google-shopping-flashdata](https://github.com/flashdata-dev/google-shopping-gemini) | `google_shopping` |
| Google Video Search | [google-video-search-flashdata](../plugins/cursor/google-video-search/README.md) | [google-video-search-flashdata](https://github.com/flashdata-dev/google-video-search-gemini) | `google_videos` |
| Google Places | [google-places-flashdata](../plugins/cursor/google-places/README.md) | [google-places-flashdata](https://github.com/flashdata-dev/google-places-gemini) | `google_places` |
| YouTube Search | [youtube-search-flashdata](../plugins/cursor/youtube-search/README.md) | [youtube-search-flashdata](https://github.com/flashdata-dev/youtube-search-gemini) | `youtube_search` |
| YouTube Extended Search | [youtube-extended-search-flashdata](../plugins/cursor/youtube-extended-search/README.md) | [youtube-extended-search-flashdata](https://github.com/flashdata-dev/youtube-extended-search-gemini) | `youtube_search_extended` |
| YouTube Metadata | [youtube-metadata-flashdata](../plugins/cursor/youtube-metadata/README.md) | [youtube-metadata-flashdata](https://github.com/flashdata-dev/youtube-metadata-gemini) | `youtube_metadata` |
| YouTube Transcript | [youtube-transcript-flashdata](../plugins/cursor/youtube-transcript/README.md) | [youtube-transcript-flashdata](https://github.com/flashdata-dev/youtube-transcript-gemini) | `youtube_transcript` |
| YouTube Captions | [youtube-captions-flashdata](../plugins/cursor/youtube-captions/README.md) | [youtube-captions-flashdata](https://github.com/flashdata-dev/youtube-captions-gemini) | `youtube_captions` |
| YouTube Creative Commons License Metadata | [youtube-trainability-flashdata](../plugins/cursor/youtube-trainability/README.md) | [youtube-trainability-flashdata](https://github.com/flashdata-dev/youtube-trainability-gemini) | `youtube_trainability` |
| YouTube Channel Data | [youtube-channel-flashdata](../plugins/cursor/youtube-channel/README.md) | [youtube-channel-flashdata](https://github.com/flashdata-dev/youtube-channel-gemini) | `youtube_channel` |
| YouTube Autocomplete | [youtube-autocomplete-flashdata](../plugins/cursor/youtube-autocomplete/README.md) | [youtube-autocomplete-flashdata](https://github.com/flashdata-dev/youtube-autocomplete-gemini) | `youtube_suggestions` |
| YouTube Download to Cloud Storage | [youtube-cloud-storage-flashdata](../plugins/cursor/youtube-cloud-storage/README.md) | [youtube-cloud-storage-flashdata](https://github.com/flashdata-dev/youtube-cloud-storage-gemini) | `youtube_download` |

## Installation and directory status

Cursor uses the root [.cursor-plugin/marketplace.json](../.cursor-plugin/marketplace.json): 15 independent plugins plus the existing combined plugin. The original publisher application is pending; source registration does not mean these plugins are publicly listed. Each plugin README includes local evaluation instructions and the eventual Marketplace installation path. Do not submit another publisher application for this repository.

Gemini CLI installs each extension from its own repository URL. For example:

```sh
gemini extensions install https://github.com/flashdata-dev/google-news-gemini
```

Enter the API key at the sensitive setting prompt, then restart the CLI. Repository availability and [gallery](https://geminicli.com/extensions/) indexing are separate. The gallery automatically crawls public repositories with the `gemini-cli-extension` topic; 15 local directories alone do not create 15 gallery entries. Each extension's complete publishable source is under [extensions/gemini](../extensions/gemini).

The existing combined Cursor plugin and Gemini extension remain available for workflows that need several data sources. Keep only the connections you intend to use; support tools must be selected from the same task server as the data call.

## Maintaining these assets

Edit the original task content in `npm/docs/<slug>/README.md`, examples in `registry/examples/`, the capability schema in `src/catalog/sourceCatalog.js`, and native prompts in `integrations/task-prompts.json`. The task package names and pinned versions come from `npm/tasks.json`. Then run:

```sh
npm run sync:task-integrations
npm run check:task-integrations
npm run test:task-integrations
```

The sync command writes self-contained Cursor plugins and Gemini extensions, including their Skill references, input schemas, examples and license. The manifest test launches all 30 configurations against localhost fixtures using the pinned public npm packages; it performs no paid FlashData requests. Official Cursor validation, Gemini CLI validation/installation and native UI checks are separate release checks.

Gemini publishing copies each complete generated directory to its corresponding repository root and adds the `gemini-cli-extension` topic. Check anonymous repository access before claiming a public release. No new npm package or product deployment is needed. Source updates must be regenerated, tested, versioned and published to the affected extension repository; directory indexing is verified afterward.
