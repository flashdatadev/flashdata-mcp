# Collect web evidence for a research agent

An agent answering a technical question needs current source links. Search once, inspect the returned snippets, and give the resulting Documents to your retrieval pipeline. Cite the returned page URL and fetch full pages separately if required.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/google_search.py): `python examples/google_search.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="google_search")
documents = reader.load_data(**{"query": "retrieval augmented generation evaluation", "num": 5})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; optional gl, hl, location, num/page 1–100, tbs, autocorrect.
- API output: results[].organic: title, link, snippet, position; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [Google Search API documentation](https://flashdata.dev/docs/sources/google_search).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Search snippets are not fetched page content. Omitted count and locale are not filled in by the SDK.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
