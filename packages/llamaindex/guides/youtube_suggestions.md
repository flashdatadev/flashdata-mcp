# Explore query phrasing before a video search

Give a topic-research assistant candidate query phrases from YouTube autocomplete. Load each suggestion as a text Document, then decide which phrases deserve a search. Suggestions do not measure demand, popularity or search volume.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/youtube_suggestions.py): `python examples/youtube_suggestions.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="youtube_suggestions")
documents = reader.load_data(**{"query": "vector database", "language": "en", "region": "US"})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; language (default en); region (default US, two letters).
- API output: results: autocomplete suggestion strings; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [YouTube Autocomplete API documentation](https://flashdata.dev/docs/sources/youtube_suggestions).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Suggestions are not keyword volume or popularity measurements.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
