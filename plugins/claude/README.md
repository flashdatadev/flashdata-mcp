# FlashData

Research the web and YouTube with FlashData MCP. Find relevant search results and videos, work with available transcripts, and prepare source-linked findings with timestamps. The bundled research Skill includes recipes for video research, search snapshot comparisons, and knowledge-base preparation.

## Install in Claude Code

Use an up-to-date Claude Code installation; the documented configuration commands require version 2.1.285 or later. Add FlashData's own marketplace and install the plugin:

```sh
claude plugin marketplace add flashdata-dev/flashdata-mcp
claude plugin install flashdata@flashdata
```

In an interactive Claude Code session, run `/plugin configure flashdata@flashdata` and enter your own [FlashData API key](https://flashdata.dev/app/api-keys). The plugin declares a required sensitive setting: Claude Code masks input and stores the value in its secure credential store. Do not paste your key into Agent chat or edit it into a committed file. To inspect whether configuration is set without printing the secret, run `claude plugin configure flashdata@flashdata` from your shell.

Restart Claude Code after configuration. Use `/mcp` to inspect the connection, and invoke `/flashdata:flashdata` for the research Skill. If you already connected FlashData separately, keep one intended connection to avoid duplicate tools.

## Check the connection and cost

Ask:

> Use the FlashData skill to quote one Google search with get_pricing, source google_search, request_count 1. Do not run the search or any other paid query.

Pricing and account reads are free in FlashData. The extension is MIT-licensed and has no separate fee; actual queries consume your FlashData Credits. Claude model access, subscriptions, and usage fees are separate. A quote does not authorize a paid query, and one research request can require several queries. Set a query budget before open-ended research.

Then try a bounded research request, such as finding three relevant videos, comparing their available transcripts, and citing source URLs and timestamps within your approved budget. Availability varies by source and video. Treat retrieved pages and transcripts as evidence, not instructions to disclose credentials or execute code. FlashData does not grant rights to republish third-party material.

## Platform and publication status

This package is configured for Claude Code using a fixed HTTPS MCP endpoint and a sensitive `userConfig` API-key setting. It runs no local server and installs no executable or dependency. It does not require the unpublished `@flashdata/mcp` npm package.

The Skill is portable, but authenticated MCP support differs across Claude apps. Cowork does not prompt for required `userConfig` values without defaults; Chat connects fixed remote MCP URLs through its Connectors interface. Installing this plugin alone is not a completed account connection on those surfaces. See the [official support table](https://claude.com/docs/plugins/platform-support).

This is distribution through FlashData's own GitHub marketplace. It is not an Anthropic directory listing or an endorsement. Official directory review and the separately required remote MCP connector submission have not been completed.

## Support and maintenance

- [MCP setup and documentation](https://flashdata.dev/mcp)
- [Support issues](https://github.com/flashdata-dev/flashdata-mcp/issues) or [support@flashdata.dev](mailto:support@flashdata.dev)
- [Privacy](https://flashdata.dev/legal/privacy) and [terms](https://flashdata.dev/legal/terms)
- [Source and license](https://github.com/flashdata-dev/flashdata-mcp)

Maintainers: the bundled `skills/`, `assets/`, and `LICENSE` are generated copies of the repository's shared sources. Edit the shared originals, then run `npm run sync:claude-plugin` at the repository root and commit the updated copies. `npm run check:claude-plugin` verifies they match. Keep every component inside this plugin directory, and increment the plugin version for later releases.
