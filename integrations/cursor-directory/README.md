# Cursor Directory task plugins

Build 15 independent repositories from the existing source-isolated Cursor plugins:

```sh
node scripts/build-cursor-directory.js /absolute/path/to/new-output
```

The output contains `<task-slug>-cursor/` directories and a `catalog.json` manifest. Existing output directories are never overwritten. Each repository contains exactly one task MCP server and one self-contained Skill, with its own documentation link, pinned npm package, inputs, outputs, price disclosure and limitations. The 15 existing official Marketplace candidates remain separate from this community-directory distribution.

Cursor Directory currently imports all sub-plugins in one repository into one directory record and deduplicates submissions by GitHub repository ID. Submitting the combined FlashData repository would not create 15 independent listings. Publish the generated repositories individually, then submit each through the official [submission form](https://cursor.directory/plugins/new). Source publication, submission, scanning and public listing are different milestones. Record real platform IDs and URLs only after the platform returns them.

Before publishing an imported form, replace the MCP component's Content with the complete exported `mcp.json`, including its named `mcpServers` wrapper. The directory's auto-import strips that wrapper, while its install-link builder otherwise falls back to the generic name `server`. Verify the resulting `Add to Cursor` URL carries the task's unique `name`; decoding `config` must reproduce that task's server object. This preserves names when users install several capabilities.

Directory installation copies individual components, without the original plugin's protected variable settings or Skill reference files. These exports use Cursor's documented `${env:FLASHDATA_API_KEY}` interpolation and include the full task guide in each Skill. Set the key in the environment inherited by Cursor; restart Cursor after changing it. No real key is distributed. The server and Skill are installed separately, as documented in each export.

The source license remains MIT. FlashData data calls consume paid Credits; Cursor/model and applicable storage costs are separate. Exporting and installing do not perform a paid request. Public directory discovery and real user conversion must be verified independently after publication.
