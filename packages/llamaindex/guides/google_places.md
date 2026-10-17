# Collect local options for a planning assistant

Find candidate local businesses for a trip or site visit. Preserve available address, rating and coordinate fields as JSON Documents. Review missing contact details and verify opening hours before recommending a visit.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/google_places.py): `python examples/google_places.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="google_places")
documents = reader.load_data(**{"query": "coworking Singapore", "num": 5})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; optional location and other Google search parameters.
- API output: results[].places: names and available addresses, ratings and contact fields; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [Google Places API documentation](https://flashdata.dev/docs/sources/google_places).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Contact details may be missing; verify current hours and availability with the business.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
