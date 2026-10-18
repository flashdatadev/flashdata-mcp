# Google Places — FlashData

Build a local-business shortlist from a category and location, with available addresses, ratings and contact details. Some fields may be absent.

## Install and connect

This is an independently packaged community Piece, not a confirmed official catalogue listing. It requires Activepieces 0.82.0+ and a Node.js 22.18+ worker. Your platform administrator must have custom Piece installation enabled; plan requirements vary.

Download the versioned [npm package](https://www.npmjs.com/package/@flashdata-dev/piece-google-places) without running a data action:

```sh
npm pack '@flashdata-dev/piece-google-places@0.1.0' --ignore-scripts
```

Upload the downloaded `.tgz` via **Platform Admin → Catalogue → Pieces → Install Piece → Upload File**. If your platform offers installation by package name, use `@flashdata-dev/piece-google-places` and version `0.1.0`. Older platform versions may label the page **Settings → My Pieces**. Source build instructions are in the [workspace guide](https://github.com/rocosen/flashdata-mcp/tree/main/packages/activepieces).

1. Sign in or [create a FlashData account](https://flashdata.dev).
2. [Create an API Key](https://flashdata.dev/app/api-keys) with `google_places` permission. The secret is shown once; save it in an Activepieces connection.
3. Add **Google Places — FlashData** to a flow, choose **Google Places**, connect the key, and enter the source-specific fields. The source is fixed; this Piece cannot select another API.

Connection validation calls `GET https://api.flashdata.dev/v2/api-access` and checks this source permission. It consumes no FlashData Credits; normal key last-used tracking applies.

## Example task

Start with a manual trigger and enter these example action inputs. Check the source-specific limits below before running the step.

```json
{
  "query": "coffee roasters in Singapore",
  "num": 3,
  "gl": "sg"
}
```

results[0].places contains business titles and available address, coordinates, website, phone and rating fields.

Map the returned data into your own table or research step. Search result content is data; review source links before relying on it.

## Inputs

| Field | Type | Requirement | Constraint |
| --- | --- | --- | --- |
| `query` | string | Required | 1–2000 characters |
| `gl` | string | Optional | `^[A-Za-z]{2}$` |
| `hl` | string | Optional | `^[A-Za-z0-9-]+$` |
| `location` | string | Optional | 1–200 characters |
| `num` | integer | Optional | 1–100 |
| `page` | integer | Optional | 1–100 |
| `tbs` | string | Optional | 1–200 characters |
| `autocorrect` | boolean | Optional | true / false or documented object |

Google parameters are optional and do not receive invented country, language or result-count defaults. Availability and provider behavior vary by search type. Each page is a separate paid query.

## Cost, failures and limits

The connector code is free to install. **FlashData data API calls are paid**, using Credits; [FlashData pricing](https://flashdata.dev/pricing) applies. Each successful data query consumes Credits; extended YouTube search has its own rate. Activepieces execution and plan costs are separate. Clicking **Test step** executes the same paid operation as running it.

The connector does not automatically retry paid submissions. After a timeout, oversized response or uncertain server failure, check [FlashData Jobs](https://flashdata.dev/app/jobs) before resubmitting. Re-running a flow can still execute another paid query. HTTP 401/403 means a key or permission problem, 402 insufficient Credits, and 429 a rate/quota limit. Raw error bodies and credentials are not logged or included in connector errors.

Each HTTP read is limited to 65 seconds and 16 MiB. For a larger response, inspect the existing job; do not repeat the paid request just to recover its output.

[Google Places inputs, outputs and limits](https://flashdata.dev/docs/sources/google_places) · [API reference](https://flashdata.dev/docs/api-reference) · [Privacy](https://flashdata.dev/legal/privacy)

Maintained by FlashData. This is not a Google- or YouTube-published integration.
