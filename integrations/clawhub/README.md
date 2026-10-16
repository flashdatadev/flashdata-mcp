# FlashData task skills for ClawHub / OpenClaw

**Release preparation — not published.** These 15 independent skill bundles are local candidates for ClawHub. MIT-0 approval and local ClawHub CLI authorization are pending. The rocosen web account is signed in. Candidate names and install commands are not evidence of live listings. Actual platform IDs, URLs and scan receipts must be recorded after publication.

Each skill has one data source, a concrete agent task, pinned npm CLI, input/output examples, protected API-key requirements, source-specific docs and cost/limit disclosures. The skill instructions are prepared for ClawHub’s mandatory MIT-0 license; this does not relicense the FlashData CLI or make the paid FlashData API free.

## Preview the skills

| Source | Skill | Task |
| --- | --- | --- |
| `google_search` | [Google Search — FlashData](skills/google-search-flashdata/SKILL.md) | Find sources for an agent answer |
| `google_news` | [Google News — FlashData](skills/google-news-flashdata/SKILL.md) | Prepare a sourced news briefing |
| `google_images` | [Google Images — FlashData](skills/google-image-search-flashdata/SKILL.md) | Build an image reference inventory |
| `google_shopping` | [Google Shopping — FlashData](skills/google-shopping-flashdata/SKILL.md) | Compare listed product offers |
| `google_videos` | [Google Video Search — FlashData](skills/google-video-search-flashdata/SKILL.md) | Find demonstrations across video websites |
| `google_places` | [Google Places — FlashData](skills/google-places-flashdata/SKILL.md) | Shortlist local places from returned evidence |
| `youtube_search` | [YouTube Search — FlashData](skills/youtube-search-flashdata/SKILL.md) | Find videos for a learning shortlist |
| `youtube_search_extended` | [YouTube Extended Search — FlashData](skills/youtube-extended-search-flashdata/SKILL.md) | Map channels covering a research topic |
| `youtube_metadata` | [YouTube Metadata — FlashData](skills/youtube-metadata-flashdata/SKILL.md) | Turn a video into a chapter navigation card |
| `youtube_transcript` | [YouTube Transcript — FlashData](skills/youtube-transcript-flashdata/SKILL.md) | Create notes with timestamped citations |
| `youtube_captions` | [YouTube Captions — FlashData](skills/youtube-captions-flashdata/SKILL.md) | Export an existing uploader subtitle track |
| `youtube_trainability` | [YouTube Creative Commons License Metadata — FlashData](skills/youtube-license-check-flashdata/SKILL.md) | Record a license-label observation for rights review |
| `youtube_channel` | [YouTube Channel Data — FlashData](skills/youtube-channel-flashdata/SKILL.md) | Make a dated recent-upload inventory |
| `youtube_suggestions` | [YouTube Autocomplete — FlashData](skills/youtube-autocomplete-flashdata/SKILL.md) | Build a topic idea sheet from autocomplete |
| `youtube_download` | [YouTube Download to Cloud Storage — FlashData](skills/youtube-download-flashdata/SKILL.md) | Deliver an approved media clip to customer storage |

## Maintain and validate

Run from the repository root with Node.js 22.18+:

```sh
node scripts/sync-clawhub-skills.js
node scripts/sync-clawhub-skills.js --check
```

The generator adapts the maintained `skills/*/SKILL.md` content, task catalog, prompts and source schemas. Publication is deliberately separate. `catalog.json` is a build manifest, not a live-platform status file.

Use the official ClawHub CLI to preview a release without uploading:

```sh
npx --yes clawhub@0.23.3 skill publish integrations/clawhub/skills/google-search-flashdata --owner rocosen --slug google-search-flashdata --name 'Google Search — FlashData' --version 1.0.0 --categories research,integrations --topics google-search,web-research,serp --dry-run --json
```

Use each entry’s own categories, topics, slug and name from `catalog.json`. The CLI dry run checks local files and version resolution; server-side metadata policy and security scans run only after submission. Do not treat dry-run success as approval or public availability.

## After publication

Install the individual skill in your OpenClaw workspace using the owner-qualified reference printed on its ClawHub page. Each `SKILL.md` includes the corresponding command. Configure Node/npm and `FLASHDATA_API_KEY` inside the agent’s actual execution environment. Download additionally requires `FLASHDATA_STORAGE_FILE`; its contents are sent to FlashData to upload to your chosen storage.

The local CLI returns JSON. The agent may format that data as cited answers, tables or subtitle files according to the user’s request. API calls spend FlashData Credits; model-provider costs are separate. No model runs, paid FlashData requests or real storage writes were performed as part of preparing these bundles.

## Validation recorded on 2026-10-16

- All 15 pinned npm packages resolve and install from the public npm registry.
- Existing installed-CLI contract suite passed: 15 source cases plus the parent test (16 tests). Local fixtures cover source isolation, query routing, job reads, pending states, revoked keys, complete Unicode results and credential-free result downloads.
- Frontmatter and 57 JSON examples validated; generated schemas match the installed published packages.
- ClawHub CLI 0.23.3 dry-run: 15/15 `would-publish`, latest version null. No upload or submission.
- OpenClaw agent execution, ClawHub security approval, public installation, search discovery, outbound navigation and conversion remain unverified.
