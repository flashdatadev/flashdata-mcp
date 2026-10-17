# FlashData Homebrew commands

Install one task command for the Google or YouTube data you need. Each formula has
its own executable, schema and Python environment. The commands return JSON for
shell scripts and agent tool runners; they do not invoke a language model.

This repository is a FlashData-maintained third-party tap. It is separate from
Homebrew's official `homebrew/core` catalog and is not endorsed by Homebrew.
You must add the tap before Homebrew can resolve these formulae.

## Install a command

```sh
brew tap rocosen/flashdata-mcp https://github.com/rocosen/flashdata-mcp.git
brew install rocosen/flashdata-mcp/flashdata-google-search
flashdata-google-search --schema
```

Homebrew versions with tap trust controls may ask you to authorize the formula.
Read [its source](../Formula/flashdata-google-search.rb), then use
`brew trust --formula rocosen/flashdata-mcp/flashdata-google-search` if needed.
Authorize only the command you intend to install.

Python 3.14 is installed by Homebrew if needed. The formula builds its dependencies
from source, including two Rust extensions; first installation may take several minutes
and requires normal Homebrew build tools and internet access. All runtime dependency
versions and source hashes are declared. The install performs no FlashData query.

Help, version and schema commands need no account. To run a query,
[sign up](https://flashdata.dev/signup), get an API Key, fund Credits, and set
`FLASHDATA_API_KEY` through your shell or secret manager. Installation is free;
FlashData API usage consumes paid Credits at [current rates](https://flashdata.dev/pricing).
Cloud-storage charges are separate. Follow the task guide before running its example.

## Choose a task

Each row below is an independent formula. Guides include concrete inputs, output
fields, fees, errors and source-specific limits.

| Task / formula | Guide | FlashData source documentation |
| --- | --- | --- |
| `flashdata-google-search` | [Run this task](guides/flashdata-google-search.md) | [google_search](https://flashdata.dev/docs/sources/google_search) |
| `flashdata-google-news` | [Run this task](guides/flashdata-google-news.md) | [google_news](https://flashdata.dev/docs/sources/google_news) |
| `flashdata-google-images` | [Run this task](guides/flashdata-google-images.md) | [google_images](https://flashdata.dev/docs/sources/google_images) |
| `flashdata-google-shopping` | [Run this task](guides/flashdata-google-shopping.md) | [google_shopping](https://flashdata.dev/docs/sources/google_shopping) |
| `flashdata-google-videos` | [Run this task](guides/flashdata-google-videos.md) | [google_videos](https://flashdata.dev/docs/sources/google_videos) |
| `flashdata-google-places` | [Run this task](guides/flashdata-google-places.md) | [google_places](https://flashdata.dev/docs/sources/google_places) |
| `flashdata-youtube-search` | [Run this task](guides/flashdata-youtube-search.md) | [youtube_search](https://flashdata.dev/docs/sources/youtube_search) |
| `flashdata-youtube-search-extended` | [Run this task](guides/flashdata-youtube-search-extended.md) | [youtube_search_extended](https://flashdata.dev/docs/sources/youtube_search_extended) |
| `flashdata-youtube-metadata` | [Run this task](guides/flashdata-youtube-metadata.md) | [youtube_metadata](https://flashdata.dev/docs/sources/youtube_metadata) |
| `flashdata-youtube-transcript` | [Run this task](guides/flashdata-youtube-transcript.md) | [youtube_transcript](https://flashdata.dev/docs/sources/youtube_transcript) |
| `flashdata-youtube-captions` | [Run this task](guides/flashdata-youtube-captions.md) | [youtube_captions](https://flashdata.dev/docs/sources/youtube_captions) |
| `flashdata-youtube-trainability` | [Run this task](guides/flashdata-youtube-trainability.md) | [youtube_trainability](https://flashdata.dev/docs/sources/youtube_trainability) |
| `flashdata-youtube-channel` | [Run this task](guides/flashdata-youtube-channel.md) | [youtube_channel](https://flashdata.dev/docs/sources/youtube_channel) |
| `flashdata-youtube-suggestions` | [Run this task](guides/flashdata-youtube-suggestions.md) | [youtube_suggestions](https://flashdata.dev/docs/sources/youtube_suggestions) |
| `flashdata-youtube-cloud-storage` | [Run this task](guides/flashdata-youtube-cloud-storage.md) | [youtube_download](https://flashdata.dev/docs/sources/youtube_download) |

Search installed tap definitions with `brew search --desc 'Google'` or
`brew search --desc 'YouTube'`. This search requires this tap to be present; these
formulae are not listed on formulae.brew.sh. GitHub guide pages are supporting
documentation, not official Homebrew directory listings.

## Update and remove

Run `brew update`, then `brew upgrade rocosen/flashdata-mcp/flashdata-google-search`
when a newer release is available. To remove only one capability:

```sh
brew uninstall rocosen/flashdata-mcp/flashdata-google-search
```

Other capability commands have independent environments. No API Key is created,
stored or revoked by installation or removal. Never manually overwrite a command
that belongs to another package manager; Homebrew reports linking conflicts for review.

## Maintaining the formulae

`Formula/` is generated from the reviewed Python CLI build artifacts and its lockfile.
To regenerate after a reviewed CLI release, run from the repository root:

```sh
cd packages/python-cli
uv sync --frozen
uv run --frozen python scripts/build.py
cd ../..
packages/python-cli/.venv/bin/python homebrew/generate.py
```

The generator needs Python 3.11+ (`tomllib`) and `packaging`, which is already part of
the CLI build environment. Before publishing, upload the checked source distributions
and SHA256SUMS to the matching `python-cli-vVERSION` GitHub release. Do not replace
published assets in place. Each formula pins its own sdist and all recursive runtime
resources. Homebrew's normal PEP 517 build isolation may fetch build backends;
this is not an offline build and does not invoke `uvx` at runtime.

Run checks with explicit formula IDs, for example:

```sh
brew style --formula rocosen/flashdata-mcp/flashdata-google-search
brew audit --strict rocosen/flashdata-mcp/flashdata-google-search
brew test rocosen/flashdata-mcp/flashdata-google-search
```

Apply these checks to all 15 formulae. Do not pass the repository root as a style
target: the shared repository also contains non-Homebrew projects.
Tests remove FlashData credentials and exercise local version/schema/input validation.
A successful installation is distinct from real API execution or directory acceptance.

[MIT license](../LICENSE) · [Privacy](https://flashdata.dev/legal/privacy)
