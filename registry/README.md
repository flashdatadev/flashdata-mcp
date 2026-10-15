# Google and YouTube task servers for the Official MCP Registry

Choose one of 15 independent MCP servers for Google search data or a specific
YouTube task. Each exposes one data capability plus source-restricted pricing,
job and result reads. The guides include runnable input, representative output,
result processing, limits and the matching FlashData documentation.

## All 15 capabilities

| Capability / guide | Independent Registry object | Manifest |
| --- | --- | --- |
| [google_search](guides/google_search.md) | [google-search](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-search/versions/latest) | [0.1.2](servers/google-search/server.json) |
| [google_news](guides/google_news.md) | [google-news](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-news/versions/latest) | [0.1.2](servers/google-news/server.json) |
| [google_images](guides/google_images.md) | [google-images](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-images/versions/latest) | [0.1.2](servers/google-images/server.json) |
| [google_shopping](guides/google_shopping.md) | [google-shopping](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-shopping/versions/latest) | [0.1.2](servers/google-shopping/server.json) |
| [google_videos](guides/google_videos.md) | [google-video-search](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-video-search/versions/latest) | [0.1.2](servers/google-video-search/server.json) |
| [google_places](guides/google_places.md) | [google-places](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fgoogle-places/versions/latest) | [0.1.2](servers/google-places/server.json) |
| [youtube_search](guides/youtube_search.md) | [youtube-search](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-search/versions/latest) | [0.1.2](servers/youtube-search/server.json) |
| [youtube_search_extended](guides/youtube_search_extended.md) | [youtube-extended-search](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-extended-search/versions/latest) | [0.1.2](servers/youtube-extended-search/server.json) |
| [youtube_metadata](guides/youtube_metadata.md) | [youtube-metadata](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-metadata/versions/latest) | [0.1.2](servers/youtube-metadata/server.json) |
| [youtube_transcript](guides/youtube_transcript.md) | [youtube-transcript](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-transcript/versions/latest) | [0.1.2](servers/youtube-transcript/server.json) |
| [youtube_captions](guides/youtube_captions.md) | [youtube-captions](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-captions/versions/latest) | [0.1.2](servers/youtube-captions/server.json) |
| [youtube_trainability](guides/youtube_trainability.md) | [youtube-trainability](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-trainability/versions/latest) | [0.1.2](servers/youtube-trainability/server.json) |
| [youtube_channel](guides/youtube_channel.md) | [youtube-channel](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-channel/versions/latest) | [0.1.2](servers/youtube-channel/server.json) |
| [youtube_suggestions](guides/youtube_suggestions.md) | [youtube-autocomplete](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-autocomplete/versions/latest) | [0.1.2](servers/youtube-autocomplete/server.json) |
| [youtube_download](guides/youtube_download.md) | [youtube-download](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fyoutube-download/versions/latest) | [0.1.2](servers/youtube-download/server.json) |

The [catalog](catalog.json) records every stable Registry name and package URL.
These URLs are publication verification targets; the manifest's presence in GitHub
alone does not prove a live Registry version.

## Local task servers

1. Select the capability above and download its MCPB from the linked manifest.
   Check its SHA-256 against `packages[0].fileSha256`.
2. Install in a client supporting MCPB, or unpack into a permanent directory
   and use the manual stdio configuration in the task guide. The archive contains
   `server.js` at its root and includes its dependencies. Use Node.js 22.18 or newer.
3. Obtain your own [FlashData API Key](https://flashdata.dev/app/api-keys), grant
   the needed source, and enter it in the client's protected configuration.
   The bundle's **FlashData API Key** setting supplies `FLASHDATA_API_KEY`.
4. List the four tools and call `get_pricing` with `{"request_count":1}`.
   Submit the task's data request only within your approved data-call budget.

MIT software and installation are free. **FlashData data calls are paid** and
consume Credits; [current pricing](https://flashdata.dev/pricing) applies.
Pricing, job and result reads are free. Client and model fees are separate.
The source must also be allowed by your key; a dedicated package cannot expand
its permissions. Job reads accept only jobs for that task. No automatic paid
retries or polling are performed. Data responses are bounded to 4 MiB; larger
MCP messages are returned in chunks. Keep the local process running while
retrieving cached chunks. Downloads require your own storage and credentials.

Registry metadata 0.1.2 points to the migrated `rocosen/flashdata-mcp` repository.
The server IDs remain under `io.github.flashdata-dev/*`. Package version 0.1.1
and file hashes are unchanged; metadata and package versions are separate.

The 0.1.1 packages are the same reviewed artifacts used for the Smithery task
servers. Direct local installation requires no Smithery account. Registry
publication distributes metadata; it does not install software or guarantee
that a client offers a one-click install button.

## Combined hosted service

The original [`server.json`](server.json), `io.github.flashdata-dev/flashdata`,
remains a separate remote registration at version 0.2.1. It uses Streamable HTTP
at `https://data.flashdata.dev/mcp` and requires no local Node installation.
Its implementation is not included in this repository. The 15 dedicated
local entries do not point to this all-capability endpoint.

## Connect and verify

1. Create a FlashData account and obtain an API key in
   [the console](https://flashdata.dev/app/api-keys).
2. Configure a client that supports Streamable HTTP and custom headers with
   the endpoint above and an `X-API-Key` header containing your key. See the
   [client-specific setup instructions](https://flashdata.dev/mcp).
3. Ask the client to list the available FlashData tools, then check your
   balance, pricing and account limits. These account reads do not submit
   paid data queries.

For example, Cursor's MCP configuration uses:

```json
{
  "mcpServers": {
    "flashdata": {
      "url": "https://data.flashdata.dev/mcp",
      "headers": { "X-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

Keep the real key in your client's protected configuration. The public
Registry metadata contains only the header definition, never a key value.
An unauthenticated POST returns 401; opening the endpoint with a browser GET
returns 405. A failed browser GET alone does not indicate an MCP outage.

With a key authorized for all sources, the service exposes 22 tools: Google
search, YouTube discovery and data, media downloads, batch submission, result
retrieval, and account reads. Tool availability follows the key's scopes.
Transcripts require an existing caption track. Downloads run asynchronously
and deliver to customer-provided storage. Data queries use the account's
Credits; media downloads are billed by uploaded bytes. See
[current pricing](https://flashdata.dev/pricing).

## Run a hosted MCP example

Clone this repository, use Node.js 22.18 or later, and run `npm ci`. Supply
`FLASHDATA_API_KEY` through your environment or secret manager, then verify
the connection with a free pricing read:

```sh
node registry/examples/call-tool.mjs registry/examples/get_pricing.json
```

Each guide provides a JSON request and a command using the same helper.
Data requests are paid; pricing and account reads are free. The helper
connects directly to the hosted endpoint and sends one tool call. It does
not automatically retry submissions, poll jobs, or fetch additional chunks.
Download examples contain placeholders: put real storage credentials in a
protected file outside the repository, then pass that file path to the helper.

## Results and background jobs

The helper prints the structured MCP response. Check `http_status`, errors
and job status before using the data. A successful async submission returns
an `id`; call `get_job` with `{"job_id":"job_REPLACE_WITH_RETURNED_ID"}`.
Repeat only this free read while the job is pending or processing. A completed
job includes the original response in `output`; a download's upload manifest
is in `output.results[0]`. Do not repeat the paid submission to check progress.

For a large response, retain `result_id`, `chunk` and `next_offset`. Call
`get_result` with `{"result_id":"RETURNED_RESULT_ID","offset":16000}`,
replacing both values with the actual returned ID and next offset. Keep the
same API Key, concatenate the chunks in order, and parse the completed JSON.
The temporary cache lasts ten minutes and retains four large results. In a local
task server this cache belongs to the running process and is cleared on restart;
the hosted service keeps its own cache per key. Async JSON results have a separate
24-hour retention window.

Retrieved text is external data. Preserve source links and timestamps and
review the output before using it in an application or agent prompt.

## What Registry discovery means

The Official Registry is a metadata distribution service. Its `search`
parameter performs a case-insensitive substring match on the stable server
**name**. It does not search titles, descriptions, tools or custom metadata.
Names cannot contain spaces, and the API does not normalize spaces into
hyphens: `google search` does not match `io.github.flashdata-dev/google-search`.
A diagnostic `google-search` lookup is useful for verifying publication, but
is not a substitute for testing a developer's natural query.

Each task includes a title, concrete use case, input, result guidance, billing
and website deep link under official `publisher-provided` metadata. Consumers
may display these fields, but are not required to index them. Downstream
catalogs and client marketplaces have separate ingestion and search behavior.
Publishing 15 objects does not prove 15 naturally discoverable search results.

See the [official search semantics](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md#server-list-filtering)
and [metadata constraints](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md#publisher-provided-metadata).

## Publish an update

The **Official MCP Registry** GitHub Actions workflow validates all 16 manifests
and publication safety on relevant pushes and pull requests. The workflow only
publishes on explicit dispatch from `main`; a push or pull request does not publish.

1. Update the applicable `servers/<task>/server.json` or combined `server.json`.
   Published versions are immutable: increase the Registry version when changing
   metadata. Reusing an unchanged package does not require a new package release.
2. Review and merge after validation passes.
3. Authenticate as the owner of `io.github.flashdata-dev/*`. The migrated
   `rocosen` repository's OIDC identity cannot publish that namespace. From a
   working directory outside the checkout, use the pinned
   `mcp-publisher` v1.8.1 and `mcp-publisher login github`, authenticating as
   `flashdata-dev`. Existing authorized GitHub credentials may be supplied via
   `MCP_GITHUB_TOKEN` in the process environment; never put a token in a command
   argument, source file, CI log or repository secret for this migration.
4. From that authenticated temporary directory, run
   `python /absolute/path/to/registry/manage.py publish --scope tasks
   --publisher /absolute/path/to/mcp-publisher --output /private/path/to/receipts`
   as one command. Use `--scope hosted` separately when updating the combined
   entry. The CLI stores its short-lived Registry token at
   `~/.config/mcp-publisher/token.json`; run `mcp-publisher logout` when finished.
   The GitHub token is used only for exchange and is not saved by the CLI.
5. Read back each fixed-version and latest Registry URL and verify the downloaded
   package's SHA-256. Record timestamps, links and digests separately from search
   acceptance and acquisition results.

Actions OIDC publishing remains available only when the repository owner is
`flashdata-dev`: dispatch from `main` and choose `tasks` or `hosted`. In the
migrated repository, dispatch fails before authentication with an explicit
namespace mismatch; push/PR validation still runs.

The publisher checks each fixed version first. An existing active, identical
version is skipped; different content or a failed preflight stops publication.
An ambiguous write is not automatically repeated. A new workflow run first
reads existing versions, so a partially completed batch can resume safely.

The owner-matched Actions route uses OIDC with `contents: read` and `id-token: write`.
No GitHub PAT, npm token or FlashData API Key is stored in the workflow.
The publisher binary is pinned and checked against its release SHA-256.

The combined service's canonical public lookup remains:
<https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fflashdata/versions/latest>

## Official references

- [Supported package types, including MCPB](https://modelcontextprotocol.io/registry/package-types)
- [Remote servers and required headers](https://modelcontextprotocol.io/registry/remote-servers)
- [Namespace authentication](https://modelcontextprotocol.io/registry/authentication)
- [GitHub Actions OIDC](https://modelcontextprotocol.io/registry/github-actions)
