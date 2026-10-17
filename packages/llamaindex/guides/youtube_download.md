# Deliver approved media for a downstream workflow

After selecting media you are entitled to process, submit a single delivery to your configured customer-owned storage. Persist the job receipt, inspect the same job, and pass the returned delivery manifest to your own processing workflow. The tool does not transcribe or embed the media.

## Setup and run

Install the package from the [public source instructions](../README.md). PyPI publication is pending. Get your API Key from the [FlashData console](https://flashdata.dev/console) and configure `FLASHDATA_API_KEY` in your application's secret manager. Python 3.11+ is required.

[Runnable example](../examples/youtube_download.py): `python examples/youtube_download.py` (supply the explicit flags below).

The script requires an explicit --submit for a paid write. Use --job-id for later reads; do not rerun --submit to poll. Destination credentials stay in application configuration and are excluded from model arguments. See the README for provider fields and the result lifecycle.

```sh
# First configure FLASHDATA_API_KEY and FLASHDATA_DOWNLOAD_STORAGE securely.
python examples/youtube_download.py --submit --video-id jNQXAC9IVRw
# Save the returned job ID. Later reads never submit again:
python examples/youtube_download.py --job-id job_YOUR_RECEIPT
python examples/youtube_download.py --job-id job_YOUR_RECEIPT --result
```

## Input and output

- Input: submit: video_id, optional format/quality/clip fields; reads: job_id. Storage comes from FLASHDATA_DOWNLOAD_STORAGE..
- API output: submit: id/status receipt; reads: job lifecycle; completed result: output JSON delivery manifest.
- Download returns a job receipt/lifecycle/delivery manifest, not a text Document.
- Contract and current parameters: [YouTube Download to Cloud Storage API documentation](https://flashdata.dev/docs/sources/youtube_download).

## Cost, limits and errors

The package is free to install. FlashData API calls use paid Credits; see [pricing](https://flashdata.dev/pricing). Model, embedding and customer-storage charges are separate. Paid asynchronous job. Requires customer storage. Save the receipt; never submit again to poll. Result JSON expires after 24 hours; media retention depends on storage.

There is no automatic retry. On a timeout or ambiguous submission, inspect FlashData Jobs before paying for another request. Read the same job ID to poll. Completed result JSON expires after 24 hours; media retention is controlled by your storage.

This guide is source documentation for an independent integration, not evidence of an official LlamaHub listing.
