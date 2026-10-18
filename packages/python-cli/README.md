# FlashData Python task CLIs

Fifteen independent Python distributions expose one FlashData source each as a JSON command.
Use them in shell scripts, pipelines or agent tool runners without a model SDK or LangChain.
Installation is free; FlashData API requests use paid Credits.

## Availability

Version 0.1.0 is available as checked wheel/sdist assets in the
[GitHub release](https://github.com/rocosen/flashdata-mcp/releases/tag/python-cli-v0.1.0).
All fifteen distributions are published on PyPI as version 0.1.0. Each project below
has its own command, source-specific README and package page. Homebrew users can follow
the [independent formula guides](../../homebrew/README.md).
The existing `langchain-flashdata` package is a separate integration and is unchanged.

| Source | Distribution and command |
| --- | --- |
| `google_search` | [flashdata-google-search](https://pypi.org/project/flashdata-google-search/) |
| `google_news` | [flashdata-google-news](https://pypi.org/project/flashdata-google-news/) |
| `google_images` | [flashdata-google-images](https://pypi.org/project/flashdata-google-images/) |
| `google_shopping` | [flashdata-google-shopping](https://pypi.org/project/flashdata-google-shopping/) |
| `google_videos` | [flashdata-google-videos](https://pypi.org/project/flashdata-google-videos/) |
| `google_places` | [flashdata-google-places](https://pypi.org/project/flashdata-google-places/) |
| `youtube_search` | [flashdata-youtube-search](https://pypi.org/project/flashdata-youtube-search/) |
| `youtube_search_extended` | [flashdata-youtube-search-extended](https://pypi.org/project/flashdata-youtube-search-extended/) |
| `youtube_metadata` | [flashdata-youtube-metadata](https://pypi.org/project/flashdata-youtube-metadata/) |
| `youtube_transcript` | [flashdata-youtube-transcript](https://pypi.org/project/flashdata-youtube-transcript/) |
| `youtube_captions` | [flashdata-youtube-captions](https://pypi.org/project/flashdata-youtube-captions/) |
| `youtube_trainability` | [flashdata-youtube-trainability](https://pypi.org/project/flashdata-youtube-trainability/) |
| `youtube_channel` | [flashdata-youtube-channel](https://pypi.org/project/flashdata-youtube-channel/) |
| `youtube_suggestions` | [flashdata-youtube-suggestions](https://pypi.org/project/flashdata-youtube-suggestions/) |
| `youtube_download` | [flashdata-youtube-cloud-storage](https://pypi.org/project/flashdata-youtube-cloud-storage/) |

## Build and verify

Requires Python 3.10 or later and [uv](https://docs.astral.sh/uv/getting-started/installation/).
Run from this directory:

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check src scripts tests
uv run --frozen ruff format --check src scripts tests
uv run --frozen python scripts/build.py
uv run --frozen python scripts/verify_install.py
```

The generator copies one maintained runtime into fifteen distinct module names. Generated
`packages/` contains each project's complete README, schema, license and package metadata.
`dist/` contains fifteen wheels and fifteen source distributions. `evidence/` records their
hashes and isolated/shared-environment installation checks. Generated outputs are ignored by Git.
Do not edit generated packages directly; change `src/`, `capabilities.json` or `scripts/generate.py`.

The tests disable sockets. Installation checks use package indexes only to resolve dependencies;
they remove FlashData environment variables and call only `--schema` and `--version`.
No production API, model, or storage write is needed for these checks.

For a local build, use the wheel path explicitly:

```sh
uvx --from ./dist/flashdata_google_search-0.1.0-py3-none-any.whl flashdata-google-search --schema
```

The PyPI equivalent is `uvx flashdata-google-search@0.1.0 --schema`.
For a paid query, set `FLASHDATA_API_KEY` through your shell or secret manager, then use
`--query 'your research topic' --options-json '{"num":5}' --output result.json`.
The output path must be new. Full JSON is written to stdout if the path is omitted.
See generated per-project READMEs for parameters, errors and examples.

YouTube cloud storage defaults to reading a saved job. Submission additionally requires
`--operation submit --allow-submit`, an authorized video and `FLASHDATA_DOWNLOAD_STORAGE`.
No automatic paid retries, polling or resubmission is performed. API keys and storage credentials
are never accepted as command arguments. Download receipts omit credentials from job params.

## PyPI publication

Publication is manual and separate from CI. All fifteen projects above have an active
Trusted Publisher, approved by the owner and verified by their 0.1.0 releases:

| Field | Value |
| --- | --- |
| GitHub owner | `rocosen` |
| Repository | `flashdata-mcp` |
| Workflow | `python-cli-publish.yml` |
| Environment | `pypi-python-cli` |

Reuse these existing project publishers for subsequent versions; do not recreate pending
publishers or upload an existing version again. The GitHub environment accepts only the
`main` branch. No account-wide token is required. Only the publish job receives OIDC
permission; build and PR jobs have read-only permissions. `packages.json` is an inventory
of project names and URLs, not a live registry status check.

For a new release, create a matching `python-cli-vVERSION` tag on the reviewed source
commit, then manually dispatch **Publish Python task CLIs** from `main` with that
`release_tag`. The existing `python-cli-v0.1.0` release is already published.
The workflow checks out that tag and verifies its version and commit before building;
publishing infrastructure can be repaired without moving the source tag or changing the packages.
Select one exact project to validate each new release;
read back its PyPI files, hashes, provenance, description and clean uvx installation before
publishing the remaining projects. Tags and package versions must match. There is no automatic
publish on push, PR or tag creation, and no skip-existing behavior that could hide a collision.

Publication status and platform discovery remain tracked in
[FlashData GTM #32](https://github.com/rocosen/flashdata-gtm/issues/32).

[Source documentation](https://flashdata.dev/docs/sources/google_search) ·
[Pricing](https://flashdata.dev/pricing) · [Sign up](https://flashdata.dev/signup) ·
[Privacy](https://flashdata.dev/legal/privacy)
