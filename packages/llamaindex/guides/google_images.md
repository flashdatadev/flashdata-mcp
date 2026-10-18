# Prepare an image reference shortlist

Collect image URLs and available dimensions for a design research assistant. Store the result metadata as Documents, then review the original image page and reuse rights before selecting an asset. This reader does not fetch or embed the image.

## Setup and run

Install with `python -m pip install 'llama-index-tools-flashdata==0.1.0'` (see the [package guide](../README.md)). Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

Save the [runnable example](../examples/google_images.py) as `google_images.py`, then run `python google_images.py`.

The example makes one paid request, retains the complete raw response, and converts it locally without a second request. The reader alternative below makes its own single request; choose one approach.

```python
from llama_index.tools.flashdata import FlashDataReader

reader = FlashDataReader(source="google_images")
documents = reader.load_data(**{"query": "rooftop solar installation", "num": 5})
for document in documents:
    print(document.metadata, document.text)
```

## Input and output

- Input: query; optional Google search parameters.
- API output: results[].images: image/source URLs and available dimensions; usage.credits.
- Reader output: LlamaIndex Documents; tool output: ToolOutput with the complete response in raw_output.
- Contract and current parameters: [Google Images API documentation](https://flashdata.dev/docs/sources/google_images).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Does not download images or establish image reuse rights.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. This example does not call a model or embedding service. Inspect external content before passing it into an agent.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
