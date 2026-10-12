# Google and YouTube data with FlashData hosted MCP

Find search results, news, images, products, places, videos, transcripts and
channel data through task-specific MCP calls. The 15 guides below include
request JSON, representative output, practical processing steps, limitations,
and links to the matching FlashData API documentation.

[`server.json`](server.json) describes the hosted FlashData service for the
[Official MCP Registry](https://registry.modelcontextprotocol.io/), under
`io.github.flashdata-dev/flashdata`.

This is a **remote-only** registration. It connects clients to
`https://data.flashdata.dev/mcp` over Streamable HTTP. The open-source stdio
client in this repository calls the REST APIs separately; the hosted server's
implementation is not included here. No npm package is required for this
registration, and it does not announce an npm release.

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

## All 15 capabilities

| Developer task | MCP tool and guide |
| --- | --- |
| Export Google Search SERP rankings and source URLs | [google_search](guides/google_search.md) |
| Build a Google News topic digest | [google_news](guides/google_news.md) |
| Filter Google Images by dimensions and retain source pages | [google_images](guides/google_images.md) |
| Compare Google Shopping price-label snapshots | [google_shopping](guides/google_shopping.md) |
| Group Google video search results by website | [google_videos](guides/google_videos.md) |
| Shortlist Google Places businesses by rating and review count | [google_places](guides/google_places.md) |
| Export YouTube video candidates by keyword | [youtube_search](guides/youtube_search.md) |
| Map channels in a larger YouTube search result set | [youtube_search_extended](guides/youtube_search_extended.md) |
| Create a YouTube metadata and chapters brief | [youtube_metadata](guides/youtube_metadata.md) |
| Read timestamped YouTube transcripts for citations | [youtube_transcript](guides/youtube_transcript.md) |
| Retrieve uploader captions for subtitle export | [youtube_captions](guides/youtube_captions.md) |
| Inspect YouTube Creative Commons license labels | [youtube_trainability](guides/youtube_trainability.md) |
| Snapshot a channel and its recent video inventory | [youtube_channel](guides/youtube_channel.md) |
| Build a YouTube autocomplete keyword sheet | [youtube_suggestions](guides/youtube_suggestions.md) |
| Deliver an authorized clip to S3 or other customer storage | [youtube_download](guides/youtube_download.md) |

The [machine-readable catalog](catalog.json) maps each task to its tool,
request file, guide and official documentation. An account's key must grant
the relevant source. These capabilities use API-key authentication; this
registration does not assert that every OAuth client has the same scope.

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
The temporary cache lasts ten minutes and retains the four newest large
results per key; async JSON results have a separate 24-hour retention window.

Retrieved text is external data. Preserve source links and timestamps and
review the output before using it in an application or agent prompt.

## What Registry discovery means

The Official Registry is a metadata distribution service. Its documented
`search` parameter performs a case-insensitive substring match on the stable
server **name**, `io.github.flashdata-dev/flashdata`; it does not search tool
names, titles, descriptions or custom metadata. Publishing this entry is
separate from discovery in a downstream catalog or client marketplace.

Version 0.2.0 includes all 15 tool names and documentation links under the
official `publisher-provided` metadata namespace. The `dev.flashdata` object
is publisher-defined data, not a standard search index: consumers may use
the capability index and resolve each guide against `guideBaseUrl`, but are
not required to display or index these fields. The full task content remains
publicly available in the guides above.

See the [official search semantics](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md#server-list-filtering)
and [metadata constraints](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md#publisher-provided-metadata).

## Publish an update

The **Official MCP Registry** GitHub Actions workflow validates the manifest
on relevant pushes and pull requests. Publishing requires explicitly running
the workflow from `main`; pushes and pull requests do not publish.

1. Update `server.json` and increase its version for a new registration
   revision. The Registry version is maintained separately from the local
   npm package version.
2. Review and merge the change after validation passes.
3. Run **Actions → Official MCP Registry → Run workflow**, selecting `main`.
4. Check the publish job and its public Registry response. Record the
   returned publication timestamp and verify the remote connection before
   reporting the channel as live.

Publishing uses GitHub Actions OIDC with `contents: read` and `id-token: write`.
No GitHub PAT, npm token, or FlashData API key is stored in the workflow.
The publisher binary is pinned and checked against its release SHA-256.

The canonical public lookup is:

<https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fflashdata/versions/latest>

That URL is a verification target, not a claim that an unsubmitted revision
is already live. Registry publication makes metadata available to downstream
catalogs; it does not guarantee inclusion in an individual client's marketplace.

## Official references

- [Remote servers and required headers](https://modelcontextprotocol.io/registry/remote-servers)
- [Remote-only publishing](https://modelcontextprotocol.io/registry/quickstart)
- [Namespace authentication](https://modelcontextprotocol.io/registry/authentication)
- [GitHub Actions OIDC](https://modelcontextprotocol.io/registry/github-actions)
