# Discover videos before building a caption collection

Search for tutorials relevant to a research question. Inspect the returned video IDs and channels before deciding which videos merit a separate caption request. A video title alone is not evidence of what its speaker said.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/youtube_search.py): `python examples/youtube_search.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_search")
documents = reader.load_data(**{"query": "RAG evaluation tutorials", "max_results": 5})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; max_results 1–20 (default 10); optional filters.
- API output: results[].results: video search records; totalResults and query; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube Search API documentation](https://flashdata.dev/docs/sources/youtube_search).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. The requested count is a ceiling, not a guaranteed result count.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
