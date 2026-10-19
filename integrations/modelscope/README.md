# FlashData Skills for ModelScope

These 15 skill folders adapt the existing task skills for ModelScope Skills Center. Each has a Chinese task summary, a pinned source-specific npm CLI, an MIT license, and a source-specific FlashData documentation link with `utm_source=modelscope`. They require the user's FlashData API key; installation is free and data queries use paid Credits.

This directory is publishing source, not evidence that a ModelScope listing is public. ModelScope Skills Center and its MCP Plaza are separate publication surfaces.

Update the localized metadata in `catalog.json`, then run:

```sh
python3 scripts/sync-modelscope-skills.py
python3 scripts/sync-modelscope-skills.py --check
```

Import only the folders under `integrations/modelscope/skills/`, select the corresponding `SKILL.md` and `LICENSE`, and include `references/storage.md` for YouTube download. Preserve the MIT license in the platform metadata. Read back the actual owner, public page, file payload, and search results after publication. An imported source or a successful CLI help command does not prove approval, search indexing, or paid data execution.

CLI help was checked for all 15 pinned packages without API credentials or data requests. Search visibility, installation payload, and website links must be checked on each actual listing.
