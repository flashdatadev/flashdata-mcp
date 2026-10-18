# FlashData Pieces for Activepieces

Fifteen independent, source-specific Pieces for Google search and YouTube data. The first fourteen each expose one data action; YouTube Cloud Storage exposes submit, status and result actions. Each Piece has its own package identity, entry point, connection and task guide. There is no generic source picker or arbitrary API-call action.

These are custom community packages. Source publication, npm publication, custom installation and official public catalogue acceptance are separate steps. No official catalogue approval is implied by this workspace.

## Build and check

Use Node.js 22.18+ and run from this directory:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
node scripts/verify-install.mjs
```

The tests forbid network connections and use synthetic credentials and responses. They validate request contracts and error paths; they are not evidence of paid API execution or an installed Activepieces cloud flow.

Build output is `dist/<piece-name>/src/index.js`. Packages are self-contained CommonJS bundles; the exported class name `Piece` is preserved for the Activepieces loader. The build rejects non-builtin external imports, bundler warnings and bundles over the official 5 MiB ceiling. Third-party license notices are included. The SDK is pinned to the currently published `@activepieces/pieces-framework@0.32.0`, rather than the unreleased main-branch version.

`node scripts/verify-install.mjs` packs all fifteen bundles, installs each in a fresh local directory and installs all fifteen together. It loads the actual tarball entry points and checks independent identities and action counts. Tarballs and the installation report are under `dist/tarballs/` and `dist/install-report.json`.

## Install a Piece

Your platform administrator needs custom Piece installation access. Requires Activepieces 0.82.0+ and a Node.js 22.18+ worker; plan and administrator requirements vary. Download the chosen versioned package from npm, for example:

```sh
npm pack '@flashdata-dev/piece-google-search@0.1.0' --ignore-scripts
```

Upload the downloaded `.tgz` via **Platform Admin → Catalogue → Pieces → Install Piece → Upload File**. If your platform offers installation by package name, use the corresponding name below and version `0.1.0`. Older platform versions may label the page **Settings → My Pieces**. Downloading or installing a package does not execute a FlashData data action.

| Capability | Independent package | Setup and example |
| --- | --- | --- |
| Google Search | `@flashdata-dev/piece-google-search` | [AI research evidence](pieces/google-search/README.md) |
| Google News | `@flashdata-dev/piece-google-news` | [Linked daily briefing](pieces/google-news/README.md) |
| Google Images | `@flashdata-dev/piece-google-images` | [Image references](pieces/google-images/README.md) |
| Google Shopping | `@flashdata-dev/piece-google-shopping` | [Buying comparison](pieces/google-shopping/README.md) |
| Google Video Search | `@flashdata-dev/piece-google-video-search` | [Video research shortlist](pieces/google-video-search/README.md) |
| Google Places | `@flashdata-dev/piece-google-places` | [Local-business shortlist](pieces/google-places/README.md) |
| YouTube Search | `@flashdata-dev/piece-youtube-search` | [Small discovery set](pieces/youtube-search/README.md) |
| YouTube Extended Search | `@flashdata-dev/piece-youtube-extended-search` | [Larger research set](pieces/youtube-extended-search/README.md) |
| YouTube Metadata | `@flashdata-dev/piece-youtube-metadata` | [Video enrichment](pieces/youtube-metadata/README.md) |
| YouTube Transcript | `@flashdata-dev/piece-youtube-transcript` | [Timestamped notes](pieces/youtube-transcript/README.md) |
| YouTube Captions | `@flashdata-dev/piece-youtube-captions` | [Editorial review](pieces/youtube-captions/README.md) |
| YouTube License Metadata | `@flashdata-dev/piece-youtube-license-metadata` | [License-label record](pieces/youtube-license-metadata/README.md) |
| YouTube Channel | `@flashdata-dev/piece-youtube-channel` | [Channel monitoring](pieces/youtube-channel/README.md) |
| YouTube Autocomplete | `@flashdata-dev/piece-youtube-autocomplete` | [Topic planning](pieces/youtube-autocomplete/README.md) |
| YouTube Cloud Storage | `@flashdata-dev/piece-youtube-cloud-storage` | [Async media delivery](pieces/youtube-cloud-storage/README.md) |

Create an API Key at <https://flashdata.dev/app/api-keys> with permission for the chosen source. Connection validation performs only the free `/v2/api-access` check. Data actions, including **Test step**, consume FlashData Credits. Connector installation is free; [FlashData API usage](https://flashdata.dev/pricing), Activepieces execution/plan costs and storage costs are separate.

Download credentials live in a secret-text JSON connection, not ordinary action inputs. The result path verifies job identity/source, requires a completed job, trusts only the origin from the authenticated access contract, and does not forward the API Key to result storage. Output contains the delivery manifest, not media bytes or submitted storage secrets.

## Maintenance

Edit scenario wording in `tasks.json` and shared behavior in `src/`. Input schemas are generated from the repository's `src/catalog/sourceCatalog.js`; download validation reuses `src/download/youtubeDownloadOptions.js`. Run `node scripts/generate.mjs` after a contract or scenario change. `--check` detects generated-file drift during builds.

Paid POST requests are never automatically retried. Platform users must also avoid retrying a complete flow after an uncertain submission without checking FlashData Jobs. Omitted Google options remain omitted; explicit `false` survives. Standard/extended YouTube searches enforce 20/700 ceilings. Transcript defaults to automatic captions and Captions to uploader captions; neither performs ASR, translation or fallback. License metadata is not a training-rights grant.

The official [contribution policy](https://github.com/activepieces/activepieces/blob/main/CONTRIBUTING.md) currently pauses unsolicited external PRs and permits independent packages. [Piece syncing](https://www.activepieces.com/docs/install/architecture/piece-syncing) distinguishes custom packages from official auto-synced catalogue entries. Track official acceptance independently; do not count local installation or these source guides as fifteen public Activepieces listings.
