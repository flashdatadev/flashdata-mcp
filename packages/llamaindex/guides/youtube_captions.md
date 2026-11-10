# Build a collection from uploader captions

Choose an existing uploader-authored caption track for a language-specific knowledge collection. Preserve segment times and the actual returned language. If that track is unavailable, report the failure instead of silently switching to generated captions.

## Setup and run

Install with `python -m pip install 'llama-index-tools-flashdata==0.2.0'` (see the [package guide](../README.md)). Get your API Key from the [FlashData console](https://flashdata.dev/signup?utm_source=llamaindex&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_captions-task) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

Save the [runnable example](../examples/youtube_captions.py) as `youtube_captions.py`, then run `python youtube_captions.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_captions")
documents = reader.load_data(**{"video_id": "dQw4w9WgXcQ", "language": "en", "auto": False})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: video_id; language (one code or 1–10 distinct codes; omitted: en-orig, then en); auto (default false).
- API output: results[]: single track with segments/fullText, or tracks and per-language errors for a language list; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube Captions API documentation](https://flashdata.dev/docs/sources/youtube_captions?utm_source=llamaindex&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_captions-task).

Pass `language=["en", "es"]` to request several tracks. The reader keeps each track’s language and timestamps, with failures in `subtitle_errors` metadata. If every language fails, it returns an error document.

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing?utm_source=llamaindex&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=youtube_captions-task). Model, embedding and customer-storage charges are separate. Defaults to uploader captions. No ASR, translation, or automatic fallback to generated captions.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
