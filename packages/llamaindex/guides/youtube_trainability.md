# Record license-label metadata during dataset review

Add the available YouTube license-label signal to a content-review record. The field named permitted is metadata only: it does not establish training rights, third-party training settings or permission to download. Keep legal review and source provenance separate.

## Setup and run

Install with `python -m pip install 'llama-index-tools-flashdata==0.1.0'` (see the [package guide](../README.md)). Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

Save the [runnable example](../examples/youtube_trainability.py) as `youtube_trainability.py`, then run `python youtube_trainability.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_trainability")
documents = reader.load_data(**{"video_id": "dQw4w9WgXcQ"})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: video_id (11 characters).
- API output: results[]: videoId and license-label indicator permitted, with available kind/etag; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube License Metadata API documentation](https://flashdata.dev/docs/sources/youtube_trainability).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. permitted is a license-label signal, not legal training permission or creator third-party training settings.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
