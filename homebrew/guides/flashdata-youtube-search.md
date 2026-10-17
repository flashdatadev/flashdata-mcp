# YouTube Search CLI — FlashData

Discover videos for a research shortlist. This command calls the `youtube_search` API and returns JSON for your
shell script, data pipeline or agent tool runner. It does not invoke a language model.

The requested count is a ceiling, not a guaranteed result count. This CLI defaults to 10 requested results (maximum 20).

## Install and run

Install [Homebrew](https://brew.sh), then add this repository as a third-party tap.
Homebrew builds an isolated Python 3.14 environment and the declared dependencies,
including two Rust extensions. First installation can take several minutes.

```sh
brew tap rocosen/flashdata-mcp https://github.com/rocosen/flashdata-mcp.git
brew install rocosen/flashdata-mcp/flashdata-youtube-search
```

On Homebrew versions that require explicit trust, review
[this formula](../../Formula/flashdata-youtube-search.rb), then authorize only this formula:
`brew trust --formula rocosen/flashdata-mcp/flashdata-youtube-search` and repeat the install command.
This is a FlashData-maintained tap, separate from Homebrew's official core directory.

flashdata-youtube-search is the installed command. Inspect inputs without an API call:

```sh
flashdata-youtube-search --schema
```

1. [Create a FlashData account](https://flashdata.dev/signup), obtain an API Key and fund Credits.
2. Set `FLASHDATA_API_KEY` using your shell or secret manager. The CLI does not accept a key flag
   or persist credentials. [Authentication and source documentation](https://flashdata.dev/docs/sources/youtube_search).
3. Run this example after reviewing the input and cost:

```sh
flashdata-youtube-search --query 'RAG evaluation tutorials' --options-json '{"max_results": 5}' --output result.json
```

`--output` creates a new file with owner-only permissions where supported and refuses existing
files before making a paid request. Without it, the full JSON response goes to stdout. Errors
go to stderr. Exit 0 means the response was exported, 2 means local input/configuration failure,
and 1 means request or output failure. For downloads, exit 0 can describe an unfinished job.


## Inputs and output

Use `--query` for the primary input. Additional options use
`--options-json` as a JSON object, with strict field/type/range validation. Source is fixed by
this package. Google count and locale options remain omitted unless supplied.

| Option | Meaning |
| --- | --- |
| `max_results` | Requested number of videos. Default: `10`. |
| `filters` | Source-specific option; see --schema. Default: `null`. |

Run `flashdata-youtube-search --schema` to inspect all fields, nested filters, allowed values and
defaults without a Key or an API call. `--help` and `--version` are also local-only.

The JSON output preserves the API result envelope and optional fields: results[].results: video search records; totalResults and query; usage.credits.
Missing fields remain missing; empty results remain empty. No article text, translated captions,
model conclusions, rights grants or keyword volumes are invented. Exact source contracts are
documented [here](https://flashdata.dev/docs/sources/youtube_search).

## Fees and failure handling

This MIT-licensed CLI is free to install. FlashData API requests consume paid Credits;
[current pricing](https://flashdata.dev/pricing) applies. Extended YouTube Search has a separate
rate. Media delivery is billed by delivered volume, and your cloud-storage costs are separate.
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

Update the tap with `brew update`, then `brew upgrade rocosen/flashdata-mcp/flashdata-youtube-search` when a new
version is available. Remove only this command with `brew uninstall rocosen/flashdata-mcp/flashdata-youtube-search`.
Other capability formulae have their own environments and can remain installed.
Homebrew installation and removal do not create, revoke or store your API Key.

Source and MIT license are included in the source distribution.
[Formula source](../../Formula/flashdata-youtube-search.rb) · [All 15 Homebrew commands](../README.md)

[Source documentation](https://flashdata.dev/docs/sources/youtube_search) ·
[Pricing](https://flashdata.dev/pricing) · [Sign up](https://flashdata.dev/signup)
