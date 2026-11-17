# FlashData MCP

**Google Search, YouTube data, transcripts, and video or audio downloads over the Model Context Protocol.**

Connect FlashData to Claude Desktop, Claude Code, Cursor, Codex, VS Code, Windsurf, Gemini CLI, Cline, OpenCode, Zed, Warp, and other MCP clients.

[Quick Start](#quick-start) · [Pricing](#pricing-and-free-tier) · [Use Cases](#use-cases) · [Tools](#tools-reference-22-tools) · [Agent Skills](#agent-skills) · [Docs](#documentation) · [Support](#support)

**Free MCP connection and account checks.** Google and YouTube data calls use FlashData Credits.

---

## Overview

FlashData gives your assistant access to Google Search, YouTube data, and media delivery. It exposes **22 tools**, including **15 data capabilities**:

- **Google Search** — web, images, news, shopping, videos, and places as structured data.
- **YouTube Data** — video search, extended search, metadata, available transcripts and uploader captions, channels, autocomplete, and license labels.
- **YouTube Download** — video, audio, or selected clips delivered to your cloud storage.
- **Batches and results** — submit multiple queries, check background jobs, and retrieve their output.
- **Account information** — check your Credit balance, pricing, limits, and usage for free.

Two connection options: the hosted server with no installation, or the open-source local MCP server using `npx`.

---

## Quick Start

**Hosted server — no installation.** Add this URL to your MCP client:

```text
https://data.flashdata.dev/mcp
```

Get your API key from [FlashData API Keys](https://flashdata.dev/app/api-keys?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined). New to FlashData? [Create an account](https://flashdata.dev/signup?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined).

Connection settings:

| Setting | Value |
| --- | --- |
| Transport | Streamable HTTP |
| Endpoint | `https://data.flashdata.dev/mcp` |
| Authentication header | `X-API-Key: YOUR_API_KEY` |

Choose your client below. Replace `YOUR_API_KEY` with your own key and enable the data sources you want in the FlashData console.

<details>
<summary><b>Claude Desktop</b></summary>

In Claude Desktop, open **Settings → Developer → Edit Config**. Add this entry to `claude_desktop_config.json`, then fully quit and reopen Claude Desktop. This uses the same hosted server through a local bridge; Node.js is required.

```json
{
  "mcpServers": {
    "flashdata": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@0.14.3",
        "https://data.flashdata.dev/mcp",
        "--transport",
        "http-only",
        "--header",
        "X-API-Key:${FLASHDATA_API_KEY}"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Claude Code</b></summary>

Run this in your terminal, then use `/mcp` in Claude Code to check the connection.

```bash
claude mcp add --transport http --scope user flashdata 'https://data.flashdata.dev/mcp' \
  --header 'X-API-Key: YOUR_API_KEY'
```

</details>

<details>
<summary><b>Cursor</b></summary>

Add to `~/.cursor/mcp.json`, merge with your existing servers, and reopen Cursor.

```json
{
  "mcpServers": {
    "flashdata": {
      "url": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Codex</b></summary>

Add to `~/.codex/config.toml`, then start a new session.

```toml
[mcp_servers.flashdata]
url = "https://data.flashdata.dev/mcp"
http_headers = { "X-API-Key" = "YOUR_API_KEY" }
```

</details>

<details>
<summary><b>VS Code</b></summary>

Run **MCP: Open User Configuration** in the Command Palette, or add this to `.vscode/mcp.json`. Start the server and enable its tools in Copilot agent mode.

```json
{
  "servers": {
    "flashdata": {
      "type": "http",
      "url": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

Add to `~/.codeium/windsurf/mcp_config.json`, then refresh the MCP server list in Cascade.

```json
{
  "mcpServers": {
    "flashdata": {
      "serverUrl": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

Add to `~/.gemini/settings.json`, restart Gemini CLI, and run `/mcp`.

```json
{
  "mcpServers": {
    "flashdata": {
      "httpUrl": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cline</b></summary>

Open **MCP Servers → Configure → Configure MCP Servers** in Cline, add this entry, and enable the server.

```json
{
  "mcpServers": {
    "flashdata": {
      "type": "streamableHttp",
      "url": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      },
      "disabled": false
    }
  }
}
```

</details>

<details>
<summary><b>OpenCode</b></summary>

Add to your project’s `opencode.json`, then run `opencode mcp list`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "flashdata": {
      "type": "remote",
      "url": "https://data.flashdata.dev/mcp",
      "enabled": true,
      "oauth": false,
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Zed</b></summary>

Open **Zed: Open Settings File** and add this local stdio server under `context_servers`. Requires Node.js 22.18 or newer. Check the server in **Settings → AI → MCP Servers**.

```json
{
  "context_servers": {
    "flashdata": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=@flashdata-dev/mcp@0.3.1",
        "flashdata-mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Warp</b></summary>

Open **Settings → Agents → MCP servers → Add**, then paste this configuration.

```json
{
  "mcpServers": {
    "flashdata": {
      "url": "https://data.flashdata.dev/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Other clients (local npx)</b></summary>

For any client that supports local stdio MCP servers, use this configuration. Requires Node.js 22.18 or newer. On Windows, use `npx.cmd` if your client requires it.

```json
{
  "mcpServers": {
    "flashdata": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=@flashdata-dev/mcp@0.3.1",
        "flashdata-mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

</details>

After connecting, try this free check:

> Use FlashData to check my Credit balance and account limits. Do not run any searches or other paid queries.

[More connection guides →](https://flashdata.dev/mcp?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined)

---

## Pricing and Free Tier

**MCP access, software installation, and account checks are free.** Data queries use one shared FlashData Credits balance across Google Search, YouTube Data, and downloads.

What's free:

- Connecting an MCP client and installing the open-source software.
- Checking balance, pricing, account limits, and usage.
- Reading job status and retrieving existing results.
- Trying the [public playground](https://flashdata.dev/?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined#playground) without an account.

**Pay as you go — no monthly subscription fee.** Add Credits when you need API access:

| | Google Search | Standard YouTube Data | YouTube Download |
| --- | --- | --- | --- |
| **Pay as you go** | $1.00 / 1,000 requests | $0.50 / 1,000 requests | $0.10 / GB delivered ($100 / TB) |

- Subscription plans include Credits, lower usage rates, and higher capacity. Extended Search has a separate rate.
- Each query is billed individually, including queries in a batch. One prompt may run several queries.
- Downloads reserve Credits while processing and settle by actual uploaded bytes.
- Failed requests are not charged. A lost response or timeout does not confirm failure; check the existing job before retrying.

Use `get_pricing` to check your account's rate before a query. For example:

```json
{
  "name": "get_pricing",
  "arguments": { "source": "google_search", "request_count": 1 }
}
```

[Full pricing, subscription plans, and volume pricing →](https://flashdata.dev/pricing?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined)

---

## Use Cases

### Real-time research

Find current sources with Google Search and keep each title, URL, snippet, and result position in your research notes.

| Task | Tools |
| --- | --- |
| Find sources for a topic | `google_search` |
| Track news coverage | `google_news` |
| Find relevant talks and tutorials | `youtube_search`, `youtube_transcript` |

**Example prompt:** “Find five official sources about home battery recycling in the US. Return their titles, URLs, and snippets.”

### E-commerce intelligence

Collect product listings and compare the price, merchant, and other available details returned by Google Shopping.

| Task | Tools |
| --- | --- |
| Find product offers | `google_shopping` |
| Find product images and demonstrations | `google_images`, `google_videos` |

**Example prompt:** “Search Google Shopping for portable power stations and organize the returned offers by product and merchant.”

### Market and competitor analysis

Compare search visibility, news coverage, local businesses, and YouTube activity using structured source records.

| Task | Tools |
| --- | --- |
| Research a company or competitor | `google_search`, `google_news` |
| Discover local businesses | `google_places` |
| Compare creator and channel information | `youtube_channel`, `youtube_metadata` |

**Example prompt:** “Find EV charger installers in Austin and make a table of the returned businesses and available details.”

### AI agents with reliable web access

Give your assistant Google search results for its next answer. Choose the country and language, then use the returned URLs to read the original pages with your browsing tools.

**Example prompt:** “Search Google for recent heat-pump research in the UK. Keep the source URLs and explain which pages I should read first.”

### Coding agents

Use FlashData from Claude Code, Codex, Cursor, and other coding clients to find documentation, technical articles, and tutorial transcripts.

**Example prompt:** “Find the official PostgreSQL logical replication documentation and relevant conference talks. Keep source links and timestamped transcript excerpts.”

### GEO and brand visibility

Compare Google results for branded queries, product categories, and alternative-provider searches. Keep the query, region, language, and result positions when comparing snapshots.

**Example prompt:** “Search Google for these three product-category queries and show which returned results mention our brand.”

### Social media monitoring

Follow YouTube topics, channels, and videos. Retrieve video metadata, available captions, and autocomplete suggestions for content and audience research.

**Example prompt:** “Find YouTube videos about heat pumps, compare their channels and available video statistics, and collect available English transcripts for the three most relevant videos.”

### Content creation and academic research

Turn available video transcripts into source material for notes, timestamped citations, and drafts. Deliver video, audio, or clips to your own cloud storage for downstream processing.

| Task | Tools |
| --- | --- |
| Read timestamped captions | `youtube_transcript`, `youtube_captions` |
| Inspect a video's details and license label | `youtube_metadata`, `youtube_trainability` |
| Save media or a clip to your storage | `youtube_download` |

**Example prompt:** “Get the available English transcript of this talk, summarize the key points with timestamp links, and save a 30-second clip to my configured storage.”

---

## Tool Selection: Groups

Tools are organized around three products. Enable the sources you need when creating your API key; the server exposes the tools that key can access.

| Group | Capabilities | Data tools |
| --- | --- | --- |
| Google Search | Web, images, news, shopping, videos, places | 6 |
| YouTube Data | Search, extended search, metadata, transcripts, captions, channels, autocomplete, license labels | 8 |
| YouTube Download | Video, audio, and clip delivery | 1 |

### Configuration examples

| Workflow | Sources to enable on your key |
| --- | --- |
| Web and news research | `google_search`, `google_news` |
| Video research with timestamped citations | `youtube_search`, `youtube_metadata`, `youtube_transcript` |
| Media delivery | `youtube_download` |

Create or update the key in [FlashData API Keys](https://flashdata.dev/app/api-keys?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined), then reconnect your client after changing permissions. All workflows use the same hosted endpoint and `X-API-Key` header.

---

## Tools Reference (22 Tools)

### Which tool to use

- **Need web results:** `google_search`. For news, images, products, videos, or places, use the corresponding Google tool.
- **Need to find videos:** `youtube_search` or `youtube_search_extended` for a larger dataset.
- **Have a video ID:** `youtube_metadata` for details; `youtube_transcript` or `youtube_captions` for available caption text.
- **Need channel information or keyword ideas:** `youtube_channel` or `youtube_suggestions`.
- **Need a media file in your storage:** `youtube_download`, then `get_job` to check delivery.
- **Need to check costs or usage:** `get_pricing`, `get_balance`, `get_limits`, and `get_usage` are free.


<details>
<summary><b>Google Search — 6 tools</b></summary>

| Tool | What it returns |
| --- | --- |
| `google_search` | Web results with titles, URLs, snippets, and positions |
| `google_images` | Image search results |
| `google_news` | News search results |
| `google_shopping` | Product listings and available merchant details |
| `google_videos` | Video search results |
| `google_places` | Local business and place results |

**Example:** Search for five English results in the US:

```json
{
  "name": "google_search",
  "arguments": { "query": "battery recycling research", "gl": "us", "hl": "en", "num": 5 }
}
```

Read `results[0].organic` for source records. Selected output fields, shown with illustrative values:

```json
{
  "source": "google_search",
  "status": "done",
  "results": [{ "organic": [{
    "title": "Example research article",
    "link": "https://example.com/research",
    "snippet": "Example search-result snippet.",
    "position": 1
  }] }],
  "http_status": 200
}
```

Search results contain snippets; use a browser to read full articles. [Parameters and responses →](https://flashdata.dev/docs/sources/google_search?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined)

</details>

<details>
<summary><b>YouTube Data — 8 tools</b></summary>

| Tool | What it returns |
| --- | --- |
| `youtube_search` | Video search results |
| `youtube_search_extended` | Larger video search datasets |
| `youtube_metadata` | Video metadata, statistics, and available formats |
| `youtube_transcript` | Existing automatic captions with timestamps |
| `youtube_captions` | Available uploader captions |
| `youtube_channel` | Channel details and video listings |
| `youtube_suggestions` | Autocomplete phrases by query, language, and region |
| `youtube_trainability` | Creative Commons license-label information |

**Example:** Retrieve an existing English automatic caption track:

```json
{
  "name": "youtube_transcript",
  "arguments": { "video_id": "dQw4w9WgXcQ", "language": "en", "auto": true }
}
```

Read `results[0].segments` and preserve `start`, `end`, and `text`. Selected output fields, shown with illustrative values:

```json
{
  "source": "youtube_transcript",
  "status": "done",
  "results": [{
    "videoId": "dQw4w9WgXcQ",
    "languageCode": "en",
    "isAutoGenerated": true,
    "segments": [{ "start": 0, "end": 3, "text": "Example transcript." }]
  }],
  "http_status": 200
}
```

Transcripts require an existing caption track. Autocomplete returns phrases, not search volume. License-label checks report metadata; they do not grant reuse or model-training rights. [Transcript reference →](https://flashdata.dev/docs/sources/youtube_transcript?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined)

</details>

<details>
<summary><b>YouTube Download — 1 tool</b></summary>

| Tool | Input | Result |
| --- | --- | --- |
| `youtube_download` | Video ID, video/audio type, quality, format, optional clip times, and storage | An asynchronous job; completed output includes the uploaded file location and size |

**Example:** Deliver a 10-second MP4 clip to an S3 bucket:

```json
{
  "name": "youtube_download",
  "arguments": {
    "video_id": "jNQXAC9IVRw",
    "mode": "async",
    "download_type": "audio_video",
    "video_quality": "<=720",
    "output_format": "mp4",
    "start_at": "00:00:00",
    "end_at": "00:00:10",
    "storage": {
      "storage_type": "s3",
      "storage_url": "your-media-bucket",
      "access_key": "YOUR_ACCESS_KEY",
      "secret_key": "YOUR_SECRET_KEY",
      "region": "us-east-1",
      "object_prefix": "flashdata-clips"
    }
  }
}
```

Supply your own storage credentials through your client's protected configuration. Save the returned job ID and call `get_job` with `{"job_id":"RETURNED_JOB_ID"}`. When completed, read `output.results[0]` for `file_url`, `file_size`, and `downloaded_bytes`.

Downloads run asynchronously and are billed by delivered bytes. File access and retention follow your storage settings. [Storage setup and download reference →](https://flashdata.dev/docs/sources/youtube_download?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined)

</details>

<details>
<summary><b>Batches, Results, and Account Information — 7 tools</b></summary>

| Tool | What it does | Cost |
| --- | --- | --- |
| `submit_batch` | Submits multiple queries as background jobs | Each data query is billed |
| `get_job` | Checks job status and reads completed output | Free |
| `get_result` | Retrieves another chunk of an existing result | Free |
| `get_balance` | Checks available Credits | Free |
| `get_pricing` | Reads current account pricing | Free |
| `get_limits` | Reads account limits | Free |
| `get_usage` | Reviews account usage | Free |

For async work, poll the existing job rather than resubmitting the data query. For chunked output, use the returned `result_id` and `next_offset` with `get_result`, then concatenate the chunks in order.

</details>

---

## Agent Skills

The official [FlashData Skills](https://github.com/flashdatadev/flashdata-skills) provide task instructions, examples, and result-handling guidance for your MCP connection. Install the Skills you need:

```bash
npx skills add flashdatadev/flashdata-skills --skill google-search --skill youtube-transcript
```

Or install the shared research Skill:

```bash
npx skills add flashdatadev/flashdata-skills --skill flashdata-mcp
```

Connect the MCP server using Quick Start above. Skills provide instructions; data calls use your own FlashData API key and Credits.

---

## Configuration

### Basic setup (local)

Use Node.js 22.18 or newer with the published local stdio server:

```json
{
  "mcpServers": {
    "flashdata": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=@flashdata-dev/mcp@0.3.1",
        "flashdata-mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Advanced configuration

The local server also accepts a request timeout through `FLASHDATA_REQUEST_TIMEOUT_MS`. For example:

```json
{
  "mcpServers": {
    "flashdata": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=@flashdata-dev/mcp@0.3.1",
        "flashdata-mcp"
      ],
      "env": {
        "FLASHDATA_API_KEY": "YOUR_API_KEY",
        "FLASHDATA_REQUEST_TIMEOUT_MS": "90000"
      }
    }
  }
}
```

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `FLASHDATA_API_KEY` | Your FlashData key; required for the local server | — |
| `FLASHDATA_REQUEST_TIMEOUT_MS` | Request timeout in milliseconds, from 1,000 to 120,000 | `65000` |
| `FLASHDATA_DATA_API_URL` | FlashData Data API origin | `https://data.flashdata.dev` |
| `FLASHDATA_MANAGEMENT_API_URL` | FlashData Management API origin | `https://api.flashdata.dev` |

The hosted connection uses `X-API-Key` in your client's headers. Configure only the sources you need on the key, then reconnect after changing its permissions.

---

## Documentation

| Resource | Link |
| --- | --- |
| MCP connection guides | [flashdata.dev/mcp](https://flashdata.dev/mcp?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| API documentation | [flashdata.dev/docs](https://flashdata.dev/docs?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| Google Search parameters and responses | [Google Search reference](https://flashdata.dev/docs/sources/google_search?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| YouTube transcript parameters and responses | [Transcript reference](https://flashdata.dev/docs/sources/youtube_transcript?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| Download formats and cloud storage | [Download reference](https://flashdata.dev/docs/sources/youtube_download?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| Pricing and plans | [Current pricing](https://flashdata.dev/pricing?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| Local MCP source | [GitHub repository](https://github.com/flashdatadev/flashdata-mcp) |
| Request and response examples for all 15 capabilities | [MCP guide index](registry/README.md#all-15-capabilities) |
| Security and credential handling | [Security policy](SECURITY.md) |
| Development and release process | [Contributing](CONTRIBUTING.md) · [Release guide](RELEASING.md) |

---

## Troubleshooting

<details>
<summary><b>Common issues and solutions</b></summary>

### Authentication issues

Check that your key is active, replace `YOUR_API_KEY` with that key, and send it in the `X-API-Key` header. For the local server, set `FLASHDATA_API_KEY` in its environment.

### Missing tools

Enable the corresponding Google or YouTube source on your key and reconnect the client.

### "spawn npx ENOENT" error

Install Node.js 22.18 or newer. If your desktop client cannot find `npx`, use its absolute path; Windows clients may need `npx.cmd`.

### Timeouts or pending jobs

Check Request History or use `get_job` with the existing ID before submitting again. Pending or processing means the job is still running. Completed jobs include the result in `output`.

### Transcript unavailable

The video may have no caption track in the requested language. Try another available language or use `youtube_captions` for uploader captions.

### Download not complete

Downloads require a configured storage destination and run asynchronously. Check the job status; completed output includes the uploaded file location and size.

### Large responses

When the response provides `result_id` and `next_offset`, use `get_result` to read the remaining chunks. This retrieves the existing result without another paid data query.

</details>

---

## Contributing

For issues or contributions to the local MCP server, use the [source repository](https://github.com/flashdatadev/flashdata-mcp). Include your client, package version, and a minimal example with placeholders.

---

## Support

| Resource | Link |
| --- | --- |
| Account, API, and billing support | [support@flashdata.dev](mailto:support@flashdata.dev) |
| Connection help | [MCP setup](https://flashdata.dev/mcp?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| API reference | [Documentation](https://flashdata.dev/docs?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined) |
| Local server issues | [GitHub issues](https://github.com/flashdatadev/flashdata-mcp/issues) |

---

## License

The local MCP server is MIT-licensed under this repository's [LICENSE](LICENSE). FlashData's hosted service and data use are covered by the [FlashData terms](https://flashdata.dev/legal/terms?utm_source=github&utm_medium=integration&utm_campaign=intent_gtm_2026q4&utm_content=combined).
