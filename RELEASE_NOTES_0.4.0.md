# FlashData MCP and integrations: temporary storage credentials

Optional `session_token` credentials are accepted for S3, S3-compatible storage,
OSS, COS, BOS and TOS. Existing storage credentials remain compatible. GCS and
Azure authentication are unchanged.

Release packages:

| Package family | Version |
| --- | --- |
| Combined CLI/MCP (`@flashdata-dev/mcp`) | 0.4.0 |
| Fifteen npm task packages | 0.3.0 |
| AI SDK (`@flashdata-dev/ai-sdk`) | 0.3.0 |
| Fifteen Python task CLI packages | 0.3.0 |
| `flashdata-haystack` | 0.3.0 |
| `llama-index-tools-flashdata` | 0.3.0 |
| Activepieces `@flashdata-dev/piece-youtube-cloud-storage` | 0.2.0 |
| Fifteen direct-install MCPB bundles | 0.3.0 |

The GitHub assets are verified publication candidates. npm and PyPI uploads are
performed manually and may follow the source release. Client integration pins
remain on verified public task versions until the corresponding upload is checked.
Hosted MCP, registry entries and plugin marketplace releases are separate.

Temporary credentials must remain valid until the upload completes. Tokens are
passed through to storage and redacted from errors; these integrations do not
issue STS credentials or automatically refresh an expired session.
