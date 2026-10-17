# FlashData for Haystack

Build research pipelines and agent tools with six Google sources and nine YouTube sources.
This package exposes 17 components for 15 capabilities: YouTube delivery has separate submit,
status and result components. It does not include a model, embeddings, or a vector store.

Requires Python 3.11+ and Haystack 3.4. Install from the versioned source release:

```bash
pip install "git+https://github.com/rocosen/flashdata-mcp.git@haystack-v0.1.0#subdirectory=packages/haystack"
```

There is no published PyPI package yet. Installation is free under MIT; FlashData API calls use
paid Credits. Configure `FLASHDATA_API_KEY` through your environment or secret manager after
creating a key in your FlashData account. Use the linked source guides for current rates and limits.

```python
from haystack import Pipeline
from flashdata_haystack import FlashDataGoogleSearch, as_tool

pipe = Pipeline()
pipe.add_component("search", FlashDataGoogleSearch())
result = pipe.run({"search": {"query": "retrieval augmented generation evaluation", "num": 5}})
print(result["search"]["result"])

# Constructing a tool does not call an API or a model.
tool = as_tool(FlashDataGoogleSearch())
# Add it to an existing Haystack Agent; the agent decides when to search.
```

The full API JSON is available as `result`. Realtime components also return `documents`, one
Haystack Document per top-level API result. Document content is complete JSON, with source and
result index metadata. Search snippets are not fetched webpage content; no media is automatically
downloaded. Each example also shows how to format results into context without a model call.

| Capability | Guide and runnable pipeline | Source contract |
| --- | --- | --- |
| Google Search | [Web evidence for an agent](integration-pages/google-search-flashdata.md) | [Inputs, outputs, pricing](https://flashdata.dev/docs/sources/google_search) |
| Google News | [News briefing](integration-pages/google-news-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/google_news) |
| Google Images | [Image shortlist](integration-pages/google-images-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/google_images) |
| Google Shopping | [Offer comparison](integration-pages/google-shopping-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/google_shopping) |
| Google Videos | [Video references](integration-pages/google-videos-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/google_videos) |
| Google Places | [Local business shortlist](integration-pages/google-places-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/google_places) |
| YouTube Search | [Tutorial discovery](integration-pages/youtube-search-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_search) |
| YouTube Extended Search | [Larger research inventory](integration-pages/youtube-search-extended-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_search_extended) |
| YouTube Metadata | [Video inspection](integration-pages/youtube-metadata-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_metadata) |
| YouTube Transcript | [Timestamped evidence](integration-pages/youtube-transcript-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_transcript) |
| YouTube Captions | [Uploader caption review](integration-pages/youtube-captions-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_captions) |
| YouTube License Metadata | [License-label inspection](integration-pages/youtube-trainability-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_trainability) |
| YouTube Channel | [Channel briefing](integration-pages/youtube-channel-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_channel) |
| YouTube Autocomplete | [Topic discovery](integration-pages/youtube-suggestions-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_suggestions) |
| YouTube Delivery | [Saved job and storage delivery](integration-pages/youtube-download-flashdata.md) | [Source guide](https://flashdata.dev/docs/sources/youtube_download) |

These are source documentation and proposed directory pages. They are not proof of 15 approved
Haystack directory entries. Actual IDs, URLs and review state are tracked separately in `entries.json`.

Save pipelines with `pipe.dumps()` and load reviewed YAML using
`Pipeline.loads(saved, allowed_modules=["flashdata_haystack"])`. API keys use Haystack `Secret`;
only environment variable names are serialized. Token secrets deliberately refuse serialization.
Key and storage values never appear in tool input schemas.

YouTube delivery is asynchronous and needs customer storage. `FlashDataYouTubeDownloadSubmit`
defaults to `allow_submit=False`; the operator must explicitly enable a paid storage write and set
`FLASHDATA_DOWNLOAD_STORAGE`. Save the receipt and use `FlashDataYouTubeDownloadStatus` or
`FlashDataYouTubeDownloadResult` to read that job. There is no automatic retry or polling.

Requests use a 120-second network timeout (15-second connect timeout) and a 20 MiB response limit.
After an uncertain submission, inspect Jobs before resubmitting to avoid duplicate charges.
API errors are reported as `FlashDataError` without raw credentials or response bodies.
Model, storage and API costs are separate. See [pricing](https://flashdata.dev/pricing) and
[privacy](https://flashdata.dev/legal/privacy).

Development:

```bash
uv sync --group dev
uv run python scripts/sync_contract.py
uv run python scripts/generate.py
uv run ruff check --fix .
uv run ruff format .
uv run ruff check .
HAYSTACK_TELEMETRY_ENABLED=false uv run pytest
uv run python -m build
uv run twine check dist/*
```

The HTTP, input and storage contracts are vendored from the reviewed Python CLI implementation.
`scripts/sync_contract.py` reproduces them and records source hashes; only the User-Agent differs.
Generated component classes have explicit input sockets and fixed sources. Tests use HTTP fixtures
and block network access; they do not prove production API, model or customer-storage execution.
