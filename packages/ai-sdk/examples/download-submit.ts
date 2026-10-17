import { open, readFile } from 'node:fs/promises';
import { youtubeDownloadSubmit, type FlashDataStorage } from '@flashdata-dev/ai-sdk';

// Run this explicit application action separately from the agent loop.
// Reserve the receipt file BEFORE the paid POST, so a repeated invocation cannot submit again.
if (process.env.CONFIRM_PAID_DOWNLOAD !== 'yes') throw new Error('Set CONFIRM_PAID_DOWNLOAD=yes only after reviewing API and storage costs.');
const videoId = process.env.YOUTUBE_VIDEO_ID;
const storageFile = process.env.FLASHDATA_STORAGE_FILE;
const receiptFile = process.env.FLASHDATA_RECEIPT_FILE;
if (!videoId || !storageFile || !receiptFile) throw new Error('Set YOUTUBE_VIDEO_ID, FLASHDATA_STORAGE_FILE and FLASHDATA_RECEIPT_FILE.');
const storage = JSON.parse(await readFile(storageFile, 'utf8')) as FlashDataStorage;
const submit = youtubeDownloadSubmit({ storage });
const receipt = await open(receiptFile, 'wx', 0o600);
try {
  await receipt.writeFile(JSON.stringify({ state: 'submitting', video_id: videoId }) + '\n');
  await receipt.sync();
  // Direct execution follows the application approval above; tool.needsApproval applies to SDK agent loops.
  const result = await submit.execute!({ video_id: videoId, download_type: 'audio', output_format: 'm4a' }, { toolCallId: 'approved-download', messages: [], context: {} });
  await receipt.truncate(0);
  await receipt.write(JSON.stringify(result) + '\n', 0, 'utf8');
  await receipt.sync();
  console.log(result);
} finally { await receipt.close(); }
// After a timeout/crash, preserve the file and inspect FlashData Jobs. A local file is not server idempotency.
