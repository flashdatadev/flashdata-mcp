# Create a larger video research candidate set

When a standard search ceiling is insufficient, collect a larger candidate list for human or agent review. This source accepts up to 700 requested results and has its own higher rate. Deduplicate and select candidates before paying for downstream transcript calls.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/youtube_search_extended.py): `python examples/youtube_search_extended.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_search_extended")
documents = reader.load_data(**{"query": "retrieval evaluation tutorials", "max_results": 50})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; max_results 1–700 (default 20); optional filters.
- API output: results[].results: video search records; totalResults and query; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube Extended Search API documentation](https://flashdata.dev/docs/sources/youtube_search_extended).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. This is a distinct source with a separate higher rate than standard search. Requested count is not guaranteed.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
