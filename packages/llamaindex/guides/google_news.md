# Build a news evidence feed for an agent

Track a subject before drafting a briefing. Load news result records with available dates, publisher names and links; let your application choose which reports to read next. Search snippets cannot support claims about an entire article.

## Setup and run

Install with `python -m pip install 'llama-index-tools-flashdata==0.1.0'` (see the [package guide](../README.md)). Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

Save the [runnable example](../examples/google_news.py) as `google_news.py`, then run `python google_news.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="google_news")
documents = reader.load_data(**{"query": "reusable rockets", "num": 5})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; optional Google search parameters.
- API output: results[].news: titles, links and available dates/snippets; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [Google News API documentation](https://flashdata.dev/docs/sources/google_news).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Returns news search results, not article full text.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
