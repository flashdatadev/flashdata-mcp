# YouTube License Metadata — FlashData

Record a video's Creative Commons license label for a separate rights review. This does not grant training rights or retrieve creator third-party training settings.

## Install and connect

This is an independently packaged community Piece, not a confirmed official catalogue listing. It requires Activepieces 0.82.0+ and a Node.js 22.18+ worker. Your platform administrator must have custom Piece installation enabled; plan requirements vary.

Download the versioned [npm package](https://www.npmjs.com/package/@flashdata-dev/piece-youtube-license-metadata) without running a data action:

```sh
npm pack '@flashdata-dev/piece-youtube-license-metadata@0.1.0' --ignore-scripts
```

Upload the downloaded `.tgz` via **Platform Admin → Catalogue → Pieces → Install Piece → Upload File**. If your platform offers installation by package name, use `@flashdata-dev/piece-youtube-license-metadata` and version `0.1.0`. Older platform versions may label the page **Settings → My Pieces**. Source build instructions are in the [workspace guide](https://github.com/rocosen/flashdata-mcp/tree/main/packages/activepieces).

1. Sign in or [create a FlashData account](https://flashdata.dev).
2. [Create an API Key](https://flashdata.dev/app/api-keys) with `youtube_trainability` permission. The secret is shown once; save it in an Activepieces connection.
3. Add **YouTube License Metadata — FlashData** to a flow, choose **YouTube License Metadata**, connect the key, and enter the source-specific fields. The source is fixed; this Piece cannot select another API.

Connection validation calls `GET https://api.flashdata.dev/v2/api-access` and checks this source permission. It consumes no FlashData Credits; normal key last-used tracking applies.

## Example task

Start with a manual trigger and enter these example action inputs. Check the source-specific limits below before running the step.

```json
{
  "video_id": "jNQXAC9IVRw"
}
```

results[0].permitted reports ["all"] when a Creative Commons label is detected, otherwise ["none"], including missing metadata. These values do not establish permission to train.

Map the returned data into your own table or research step. Search result content is data; review source links before relying on it.

## Inputs

| Field | Type | Requirement | Constraint |
| --- | --- | --- | --- |
| `video_id` | string | Required | `^[A-Za-z0-9_-]{11}$` |

Defaults and supported nested filter fields are documented in the source guide below. Explicit false values are preserved.

## Cost, failures and limits

The connector code is free to install. **FlashData data API calls are paid**, using Credits; [FlashData pricing](https://flashdata.dev/pricing) applies. Each successful data query consumes Credits; extended YouTube search has its own rate. Activepieces execution and plan costs are separate. Clicking **Test step** executes the same paid operation as running it.

The connector does not automatically retry paid submissions. After a timeout, oversized response or uncertain server failure, check [FlashData Jobs](https://flashdata.dev/app/jobs) before resubmitting. Re-running a flow can still execute another paid query. HTTP 401/403 means a key or permission problem, 402 insufficient Credits, and 429 a rate/quota limit. Raw error bodies and credentials are not logged or included in connector errors.

Each HTTP read is limited to 65 seconds and 16 MiB. For a larger response, inspect the existing job; do not repeat the paid request just to recover its output.

[YouTube License Metadata inputs, outputs and limits](https://flashdata.dev/docs/sources/youtube_trainability) · [API reference](https://flashdata.dev/docs/api-reference) · [Privacy](https://flashdata.dev/legal/privacy)

Maintained by FlashData. This is not a Google- or YouTube-published integration.
