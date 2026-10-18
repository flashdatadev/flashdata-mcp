# Inspect chapters before choosing retrieval material

Use available video metadata and chapter boundaries to decide whether a video fits a knowledge collection. Keep the video URL and optional format information. Metadata does not provide the spoken content or a downloaded media file.

## Setup and run

Install with `python -m pip install 'llama-index-tools-flashdata==0.1.0'` (see the [package guide](../README.md)). Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

Save the [runnable example](../examples/youtube_metadata.py) as `youtube_metadata.py`, then run `python youtube_metadata.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_metadata")
documents = reader.load_data(
    **{"video_id": "dQw4w9WgXcQ", "include_formats": False, "include_chapters": True}
)
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: video_id (11 characters); include_formats/include_chapters (default true).
- API output: results[]: videoId, title, channel, duration and other available metadata; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube Metadata API documentation](https://flashdata.dev/docs/sources/youtube_metadata).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Metadata is not media download. Chapters and optional fields may be absent.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
