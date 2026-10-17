# YouTube Download to Cloud Storage CLI — FlashData

Deliver authorized YouTube media to your cloud storage. This command calls the `youtube_download` API and returns JSON for your
shell script, data pipeline or agent tool runner. It does not invoke a language model.

Paid asynchronous job. Requires customer storage. Save the receipt; never submit again to poll. Result JSON expires after 24 hours; media retention depends on storage.

## Install and run

Install [Homebrew](https://brew.sh), then add this repository as a third-party tap.
Homebrew builds an isolated Python 3.14 environment and the declared dependencies,
including two Rust extensions. First installation can take several minutes.

```sh
brew tap rocosen/flashdata-mcp https://github.com/rocosen/flashdata-mcp.git
brew install rocosen/flashdata-mcp/flashdata-youtube-cloud-storage
```

On Homebrew versions that require explicit trust, review
[this formula](../../Formula/flashdata-youtube-cloud-storage.rb), then authorize only this formula:
`brew trust --formula rocosen/flashdata-mcp/flashdata-youtube-cloud-storage` and repeat the install command.
This is a FlashData-maintained tap, separate from Homebrew's official core directory.

flashdata-youtube-cloud-storage is the installed command. Inspect inputs without an API call:

```sh
flashdata-youtube-cloud-storage --schema
```

1. [Create a FlashData account](https://flashdata.dev/signup), obtain an API Key and fund Credits.
2. Set `FLASHDATA_API_KEY` using your shell or secret manager. The CLI does not accept a key flag
   or persist credentials. [Authentication and source documentation](https://flashdata.dev/docs/sources/youtube_download).
3. Run this example after reviewing the input and cost:

```sh
flashdata-youtube-cloud-storage --operation result --job-id job_YOUR_SAVED_ID --output result.json
```

`--output` creates a new file with owner-only permissions where supported and refuses existing
files before making a paid request. Without it, the full JSON response goes to stdout. Errors
go to stderr. Exit 0 means the response was exported, 2 means local input/configuration failure,
and 1 means request or output failure. For downloads, exit 0 can describe an unfinished job.


## Inputs and output

Use `--video-id` for the primary input. Additional options use
`--options-json` as a JSON object, with strict field/type/range validation. Source is fixed by
this package.

| Option | Meaning |
| --- | --- |
| `download_type` | Source-specific option; see --schema. Default: `"audio_video"`. |
| `video_quality` | Source-specific option; see --schema. Default: `null`. |
| `fps` | Source-specific option; see --schema. Default: `null`. |
| `audio_language` | Source-specific option; see --schema. Default: `null`. |
| `audio_quality` | Source-specific option; see --schema. Default: `null`. |
| `yt_dlp_format` | Source-specific option; see --schema. Default: `null`. |
| `upload_metadata` | Source-specific option; see --schema. Default: `false`. |
| `output_format` | Source-specific option; see --schema. Default: `null`. |
| `start_at` | Source-specific option; see --schema. Default: `null`. |
| `end_at` | Source-specific option; see --schema. Default: `null`. |

Run `flashdata-youtube-cloud-storage --schema` to inspect all fields, nested filters, allowed values and
defaults without a Key or an API call. `--help` and `--version` are also local-only.

The JSON output preserves the API result envelope and optional fields: submit: id/status receipt; reads: job lifecycle; completed result: output JSON delivery manifest.
Missing fields remain missing; empty results remain empty. No article text, translated captions,
model conclusions, rights grants or keyword volumes are invented. Exact source contracts are
documented [here](https://flashdata.dev/docs/sources/youtube_download).

## Submit once and keep the job ID

The default operation is `status`. Status and result accept only a saved job ID,
and never submit a paid query. A pending/running response does not mean delivery is complete.

For a new delivery, supply your own authorized video and storage configuration:

```sh
flashdata-youtube-cloud-storage --operation submit --allow-submit \
  --video-id YOUR_VIDEO_ID \
  --options-json '{"download_type":"audio","output_format":"m4a"}' \
  --output delivery-receipt.json
```

Set `FLASHDATA_DOWNLOAD_STORAGE` through your secret manager, containing the documented
storage JSON. Never paste it into command arguments or source code. The supported providers
are s3, s3_compatible, gcs, azure, oss, bos, cos and tos. Use your own bucket/container,
optional object_prefix, and the provider-specific credentials. S3-compatible endpoints must
use HTTPS. [Storage fields and examples](https://flashdata.dev/docs/sources/youtube_download).

Keep the returned `id`. Read that same job with `--operation status --job-id ID` or
`--operation result --job-id ID`. Omit submission inputs when resuming. There is no automatic
polling or resubmission. Only the lifecycle receipt and delivery JSON are exported; media is
written by FlashData to your storage. Result JSON expires after 24 hours. Delivery manifests
can contain signed private URLs; protect the output file. Storage credentials from job params
are excluded from CLI output.

## Fees and failure handling

This MIT-licensed CLI is free to install. FlashData API requests consume paid Credits;
[current pricing](https://flashdata.dev/pricing) applies. Media delivery is billed by delivered volume; cloud-storage costs are separate.
There is no automatic pagination, retry, polling, scheduled execution or model call.

Each HTTP request has a 120-second network timeout (15-second connect timeout) and a 20-MiB response
limit. A timeout or failure may occur after a paid request has been accepted. Check Jobs in
the [FlashData console](https://flashdata.dev) before resubmitting. HTTP 401 means check the Key;
402 means insufficient Credits; 429 means rate/quota limit. A partial output file is retained
on failure. Do not retry a paid query just because output handling failed.

Input values and your API Key are sent to FlashData to perform the request. A completed
download-result read may fetch a signed JSON object from the result origin returned by
FlashData; the API Key is never sent to that object URL. Only process data appropriate for
your output destination. [Privacy policy](https://flashdata.dev/legal/privacy).

Update the tap with `brew update`, then `brew upgrade rocosen/flashdata-mcp/flashdata-youtube-cloud-storage` when a new
version is available. Remove only this command with `brew uninstall rocosen/flashdata-mcp/flashdata-youtube-cloud-storage`.
Other capability formulae have their own environments and can remain installed.
Homebrew installation and removal do not create, revoke or store your API Key.

Source and MIT license are included in the source distribution.
[Formula source](../../Formula/flashdata-youtube-cloud-storage.rb) · [All 15 Homebrew commands](../README.md)

[Source documentation](https://flashdata.dev/docs/sources/youtube_download) ·
[Pricing](https://flashdata.dev/pricing) · [Sign up](https://flashdata.dev/signup)
