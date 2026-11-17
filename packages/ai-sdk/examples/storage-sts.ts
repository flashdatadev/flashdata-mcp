import { youtubeDownloadSubmit, type FlashDataStorage } from '../src/index.js';

// Supply one complete temporary credential set from your secret manager.
const storage: FlashDataStorage = {
  storage_type: 's3',
  storage_url: 'your-media-bucket',
  region: 'us-east-1',
  access_key: 'YOUR_TEMPORARY_ACCESS_KEY',
  secret_key: 'YOUR_TEMPORARY_SECRET_KEY',
  session_token: 'YOUR_SESSION_TOKEN',
};

// Constructing the tool does not submit or bill a download.
export const download = youtubeDownloadSubmit({ apiKey: 'your-api-key', storage });
