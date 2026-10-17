# Google Shopping CLI — FlashData

Compare product offers in a purchasing research pipeline. This command calls the `google_shopping` API and returns JSON for your
shell script, data pipeline or agent tool runner. It does not invoke a language model.

Prices are search snapshots; inventory and checkout price are not guaranteed.

## Install and run

Install [Homebrew](https://brew.sh), then add this repository as a third-party tap.
Homebrew builds an isolated Python 3.14 environment and the declared dependencies,
including two Rust extensions. First installation can take several minutes.

```sh
brew tap rocosen/flashdata-mcp https://github.com/rocosen/flashdata-mcp.git
brew install rocosen/flashdata-mcp/flashdata-google-shopping
```

On Homebrew versions that require explicit trust, review
[this formula](../../Formula/flashdata-google-shopping.rb), then authorize only this formula:
`brew trust --formula rocosen/flashdata-mcp/flashdata-google-shopping` and repeat the install command.
This is a FlashData-maintained tap, separate from Homebrew's official core directory.

flashdata-google-shopping is the installed command. Inspect inputs without an API call:

```sh
flashdata-google-shopping --schema
```

1. [Create a FlashData account](https://flashdata.dev/signup), obtain an API Key and fund Credits.
2. Set `FLASHDATA_API_KEY` using your shell or secret manager. The CLI does not accept a key flag
   or persist credentials. [Authentication and source documentation](https://flashdata.dev/docs/sources/google_shopping).
3. Run this example after reviewing the input and cost:

```sh
flashdata-google-shopping --query 'USB microphone' --options-json '{"num": 5}' --output result.json
```

`--output` creates a new file with owner-only permissions where supported and refuses existing
files before making a paid request. Without it, the full JSON response goes to stdout. Errors
go to stderr. Exit 0 means the response was exported, 2 means local input/configuration failure,
and 1 means request or output failure.


## Inputs and output

Use `--query` for the primary input. Additional options use
`--options-json` as a JSON object, with strict field/type/range validation. Source is fixed by
this package. Google count and locale options remain omitted unless supplied.

| Option | Meaning |
| --- | --- |
| `num` | Requested result count. Default: `null`. |
| `page` | Search result page. Default: `null`. |
| `autocorrect` | Enable spelling autocorrection. Default: `null`. |
| `gl` | Two-letter country code, for example us. Default: `null`. |
| `hl` | Interface language code, for example en. Default: `null`. |
| `location` | Optional geographic search location. Default: `null`. |
| `tbs` | Optional Google time filter, for example qdr:w. Default: `null`. |

Run `flashdata-google-shopping --schema` to inspect all fields, nested filters, allowed values and
defaults without a Key or an API call. `--help` and `--version` are also local-only.

The JSON output preserves the API result envelope and optional fields: results[].shopping: title, link, price and available merchant/rating fields; usage.credits.
Missing fields remain missing; empty results remain empty. No article text, translated captions,
model conclusions, rights grants or keyword volumes are invented. Exact source contracts are
documented [here](https://flashdata.dev/docs/sources/google_shopping).

## Fees and failure handling

This MIT-licensed CLI is free to install. FlashData API requests consume paid Credits;
[current pricing](https://flashdata.dev/pricing) applies.
There is no automatic pagination, retry, polling, scheduled execution or model call.

Each HTTP request has a 120-second network timeout (15-second connect timeout) and a 20-MiB response
limit. A timeout or failure may occur after a paid request has been accepted. Check Jobs in
the [FlashData console](https://flashdata.dev) before resubmitting. HTTP 401 means check the Key;
402 means insufficient Credits; 429 means rate/quota limit. A partial output file is retained
on failure. Do not retry a paid query just because output handling failed.

Input values and your API Key are sent to FlashData to perform the request. Only process data appropriate for
your output destination. [Privacy policy](https://flashdata.dev/legal/privacy).

Update the tap with `brew update`, then `brew upgrade rocosen/flashdata-mcp/flashdata-google-shopping` when a new
version is available. Remove only this command with `brew uninstall rocosen/flashdata-mcp/flashdata-google-shopping`.
Other capability formulae have their own environments and can remain installed.
Homebrew installation and removal do not create, revoke or store your API Key.

Source and MIT license are included in the source distribution.
[Formula source](../../Formula/flashdata-google-shopping.rb) · [All 15 Homebrew commands](../README.md)

[Source documentation](https://flashdata.dev/docs/sources/google_shopping) ·
[Pricing](https://flashdata.dev/pricing) · [Sign up](https://flashdata.dev/signup)
