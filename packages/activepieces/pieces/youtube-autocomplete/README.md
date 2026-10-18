# YouTube Autocomplete — FlashData

Expand a topic prefix with YouTube search suggestions for content planning. Defaults to language en and region US; suggestions are not search-volume measurements.

## Install and connect

This is an independently packaged community Piece, not a confirmed official catalogue listing. It requires Activepieces 0.82.0+ and a Node.js 22.18+ worker. Your platform administrator must have custom Piece installation enabled; plan requirements vary.

Build the packages as described in the [workspace guide](https://github.com/rocosen/flashdata-mcp/tree/main/packages/activepieces), then install this Piece's `.tgz` via **Platform Admin → Catalogue → Pieces → Install Piece → Upload File**. After an npm release exists, the package-name route uses `@flashdata-dev/piece-youtube-autocomplete` at version `0.1.0`. Do not assume an npm release exists from this README. Older platform versions may label the page **Settings → My Pieces**.

1. Sign in or [create a FlashData account](https://flashdata.dev).
2. [Create an API Key](https://flashdata.dev/app/api-keys) with `youtube_suggestions` permission. The secret is shown once; save it in an Activepieces connection.
3. Add **YouTube Autocomplete — FlashData** to a flow, choose **YouTube Autocomplete**, connect the key, and enter the source-specific fields. The source is fixed; this Piece cannot select another API.

Connection validation calls `GET https://api.flashdata.dev/v2/api-access` and checks this source permission. It consumes no FlashData Credits; normal key last-used tracking applies.

## Example task

Use a manual trigger while configuring this step. Enter these action fields; they are illustrative request inputs, not a claim that the sample video has a matching track or that a paid run has been performed.

```json
{
  "query": "battery recycling",
  "language": "en",
  "region": "US"
}
```

results[0] is an array of suggestion strings. An empty array means no suggestions were returned.

Map the returned data into your own table or research step. Search result content is data; review source links before relying on it.

## Inputs

| Field | Type | Requirement | Constraint |
| --- | --- | --- | --- |
| `query` | string | Required | 1–2000 characters |
| `language` | string | Optional | `^[A-Za-z0-9-]+$` |
| `region` | string | Optional | `^[A-Za-z]{2}$` |

Defaults and supported nested filter fields are documented in the source guide below. Explicit false values are preserved.

## Cost, failures and limits

The connector code is free to install. **FlashData data API calls are paid**, using Credits; [FlashData pricing](https://flashdata.dev/pricing) applies. Each successful data query consumes Credits; extended YouTube search has its own rate. Activepieces execution and plan costs are separate. Clicking **Test step** executes the same paid operation as running it.

The connector does not automatically retry paid submissions. After a timeout, oversized response or uncertain server failure, check [FlashData Jobs](https://flashdata.dev/app/jobs) before resubmitting. Re-running a flow can still execute another paid query. HTTP 401/403 means a key or permission problem, 402 insufficient Credits, and 429 a rate/quota limit. Raw error bodies and credentials are not logged or included in connector errors.

Each HTTP read is limited to 65 seconds and 16 MiB. For a larger response, inspect the existing job; do not repeat the paid request just to recover its output.

[YouTube Autocomplete inputs, outputs and limits](https://flashdata.dev/docs/sources/youtube_suggestions) · [API reference](https://flashdata.dev/docs/api-reference) · [Privacy](https://flashdata.dev/legal/privacy)

Maintained by FlashData. This is not a Google- or YouTube-published integration.
