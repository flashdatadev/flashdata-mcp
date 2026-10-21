# FlashData Skills for ModelScope

These 15 skill folders adapt the existing task skills for ModelScope Skills Center. Each has a Chinese task summary, Python examples using the pinned official MCP SDK, an MIT license, and a source-specific FlashData documentation link with `utm_source=modelscope`. They require the user's FlashData API key; installation is free and data queries use paid Credits.

This directory is publishing source, not evidence that a ModelScope listing is public. ModelScope Skills Center and its MCP Plaza are separate publication surfaces.

Public website links use `/zh` so visitors start in Chinese. The website remembers this language for authentication and console pages. Keep tracking parameters and API URLs unchanged, and sync the existing platform objects after a source update.

Update the localized metadata in `catalog.json`, then run:

```sh
python3 scripts/sync-modelscope-skills.py
python3 scripts/sync-modelscope-skills.py --check
```

Import only the folders under `integrations/modelscope/skills/`, select the corresponding `SKILL.md` and `LICENSE`, and include `references/storage.md` for YouTube download. Preserve the MIT license in the platform metadata. Read back the actual owner, public page, file payload, and search results after publication. An imported source or a successful CLI help command does not prove approval, search indexing, or paid data execution.

The earlier CLI-help checks describe the prior Node-based edition. Validate the current Python examples against local fixtures before importing them; do not execute paid requests as a publication check. Search visibility, installation payload, and website links must be checked on each actual listing.
