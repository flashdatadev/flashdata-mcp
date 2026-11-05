# FlashData MCP 0.3.0

Transcript and captions accept one language code or 1–10 distinct codes. Omit language
to prefer en-orig, then en, returning one track. Lists preserve successful tracks and
per-language errors; existing single-language calls remain compatible.

MCP text defaults to Markdown. Explicit text/JSON presentation preserves structured
fields, source links and timestamps. Other API contracts remain unchanged.

This release includes the combined npm package, 15 task packages and MCPB bundles,
the AI SDK adapter, and updated transcript/captions Activepieces packages. Python
task CLIs, Haystack and LlamaIndex distributions are prepared for separate PyPI upload.

Registry uploads to npm and PyPI are manual. Download the release archives to install
the verified candidates directly; existing registry versions and client pins remain
unchanged until the uploads are verified. Hosted MCP deployment is separate.
