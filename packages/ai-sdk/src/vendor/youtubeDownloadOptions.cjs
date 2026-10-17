const DOWNLOAD_TYPES = Object.freeze(['audio_video', 'video', 'audio']);
const VIDEO_RESOLUTIONS = Object.freeze(['144', '360', '480', '720', '1080', '1440', '2160', '4320']);
const VIDEO_QUALITIES = Object.freeze([
  'best',
  'worst',
  ...VIDEO_RESOLUTIONS.flatMap(resolution => [`<=${resolution}`, `==${resolution}`, `>=${resolution}`]),
]);
const VIDEO_OUTPUT_FORMATS = Object.freeze(['mp4', 'webm', 'mkv']);
const AUDIO_OUTPUT_FORMATS = Object.freeze(['m4a', 'mp3', 'opus']);
const AUDIO_QUALITIES = Object.freeze(['best', '320', '256', '192', '128']);
const AUDIO_LANGUAGES = Object.freeze(['default', 'original']);
const STORAGE_TYPES = Object.freeze(['azure', 'bos', 'cos', 'gcs', 'oss', 's3', 's3_compatible', 'tos']);
const FPS_CONSTRAINT_PATTERN = /^(?:>=|<=|==)(?:[1-9]\d?|1\d\d|2[0-3]\d|240)$/;
const OBJECT_PREFIX_MAX_LENGTH = 512;
const OBJECT_PREFIX_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
const S3_BUCKET_PATTERN = /^(?!\d{1,3}(?:\.\d{1,3}){3}$)(?!.*\.\.)(?!.*\.-)(?!.*-\.)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const YT_DLP_FORMAT_MAX_LENGTH = 1_024;

const ADVANCED_FIELDS = new Set([
  'end_at',
  'start_at',
]);
const BASE_FIELDS = new Set([
  'audio_language',
  'audio_quality',
  'download_type',
  'fps',
  'output_format',
  'storage',
  'upload_metadata',
  'video_id',
  'video_quality',
  'yt_dlp_format',
]);
const STORAGE_FIELDS = new Set([
  'access_key',
  'account_name',
  'endpoint_url',
  'object_prefix',
  'region',
  'sas_token',
  'secret_key',
  'service_account',
  'storage_type',
  'storage_url',
]);
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const TIMESTAMP_PATTERN = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;

class YouTubeDownloadOptionsError extends Error {
  constructor(field, message, code = 'invalid') {
    super(message);
    this.name = 'YouTubeDownloadOptionsError';
    this.code = code;
    this.field = field;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionField(prefix, field) {
  if (!prefix || field === 'video_id') return field;
  return `${prefix}.${field}`;
}

function fail(prefix, field, message, code) {
  throw new YouTubeDownloadOptionsError(optionField(prefix, field), message, code);
}

function enumOption(raw, field, values, fallback, prefix) {
  const value = raw[field] == null ? fallback : raw[field];
  if (typeof value !== 'string' || !values.includes(value)) {
    fail(prefix, field, `${field} must be one of: ${values.join(', ')}.`);
  }
  return value;
}

function normalizeObjectPrefix(value, prefix, storageField = 'storage') {
  if (typeof value !== 'string') {
    fail(prefix, `${storageField}.object_prefix`, 'object_prefix must be a string.');
  }
  const trimmed = value.trim();
  const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  const segments = normalized.split('/');
  if (
    !normalized
    || trimmed.length > OBJECT_PREFIX_MAX_LENGTH + 1
    || normalized.length > OBJECT_PREFIX_MAX_LENGTH
    || normalized.startsWith('/')
    || segments.some(segment => (
      !OBJECT_PREFIX_SEGMENT_PATTERN.test(segment)
      || segment === '.'
      || segment === '..'
    ))
  ) {
    fail(
      prefix,
      `${storageField}.object_prefix`,
      `object_prefix must contain 1 to ${OBJECT_PREFIX_MAX_LENGTH} characters in safe path segments.`,
    );
  }
  return normalized;
}

function normalizeStorage(raw, prefix, storageField = 'storage') {
  if (!isRecord(raw)) {
    fail(prefix, storageField, `${storageField} must be an object.`, 'invalid_object');
  }
  for (const key of Object.keys(raw)) {
    if (!STORAGE_FIELDS.has(key)) {
      fail(prefix, `${storageField}.${key}`, `Unsupported storage field: ${key}.`, 'unsupported');
    }
  }
  const storageType = raw.storage_type;
  if (typeof storageType !== 'string' || !STORAGE_TYPES.includes(storageType)) {
    fail(prefix, `${storageField}.storage_type`, `storage_type must be one of: ${STORAGE_TYPES.join(', ')}.`);
  }
  const providerFields = storageType === 'gcs' ? ['service_account']
    : storageType === 'azure' ? ['account_name', 'sas_token']
        : storageType === 'cos' ? ['access_key', 'secret_key', 'region']
          : ['access_key', 'secret_key', 'region', 'endpoint_url'];
  for (const key of Object.keys(raw)) {
    if (!['storage_type', 'storage_url', 'object_prefix', ...providerFields].includes(key)) {
      fail(prefix, `${storageField}.${key}`, `Unsupported ${storageType} storage field: ${key}.`, 'unsupported');
    }
  }
  const storageUrl = raw.storage_url;
  if (typeof storageUrl !== 'string' || !storageUrl.trim() || storageUrl.length > 1_024) {
    fail(prefix, `${storageField}.storage_url`, 'storage_url must be a non-empty string.');
  }
  const normalizedStorageUrl = storageUrl.trim();
  if (storageType === 's3' && !S3_BUCKET_PATTERN.test(normalizedStorageUrl)) {
    fail(
      prefix,
      `${storageField}.storage_url`,
      'storage_url must be an AWS S3 bucket name only; put object folders in object_prefix.',
    );
  }
  if (storageType !== 's3' && storageType !== 'azure'
    && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(normalizedStorageUrl)) {
    fail(prefix, `${storageField}.storage_url`, 'storage_url must be a bucket name; put folders in object_prefix.');
  }
  const storage = {
    storage_type: storageType,
    storage_url: normalizedStorageUrl,
  };
  if (raw.object_prefix != null) {
    storage.object_prefix = normalizeObjectPrefix(raw.object_prefix, prefix, storageField);
  }
  for (const field of ['access_key', 'secret_key', 'endpoint_url', 'region']) {
    if (raw[field] == null) continue;
    if (typeof raw[field] !== 'string' || raw[field].length > 4_096) {
      fail(prefix, `${storageField}.${field}`, `${field} must be a string.`);
    }
    storage[field] = raw[field];
  }
  if (storageType === 'gcs') {
    const account = raw.service_account;
    if (!isRecord(account) || ['project_id', 'client_email', 'private_key'].some(field =>
      typeof account[field] !== 'string' || !account[field].trim())
      || !/^[^@\s]+@[^@\s]+\.gserviceaccount\.com$/.test(account.client_email)
      || account.project_id.length > 256 || account.private_key.length > 16_384
      || !account.private_key.includes('BEGIN PRIVATE KEY')) {
      fail(prefix, `${storageField}.service_account`,
        'service_account requires project_id, client_email, and a PEM private_key.');
    }
    storage.service_account = {
      project_id: account.project_id,
      client_email: account.client_email,
      private_key: account.private_key,
    };
  }
  if (storageType === 'azure') {
    if (!/^[a-z0-9]{3,24}$/.test(raw.account_name || '')
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedStorageUrl)) {
      fail(prefix, `${storageField}.account_name`,
        'Azure storage requires a valid account_name and container storage_url.');
    }
    const sas = typeof raw.sas_token === 'string' ? raw.sas_token.replace(/^\?/, '') : '';
    const params = new URLSearchParams(sas);
    if (sas.length > 4096 || /[\r\n]/.test(sas) || !params.get('sig') || !params.get('se')
      || !params.get('sv') || !params.get('sp')?.includes('w') || params.get('sr') !== 'c') {
      fail(prefix, `${storageField}.sas_token`,
        'sas_token must be a container SAS with write permission, expiry, and signature.');
    }
    storage.account_name = raw.account_name;
    storage.sas_token = sas;
  }
  if (['cos', 'bos', 'tos'].includes(storageType)) {
    const region = raw.region;
    const validRegion = storageType === 'bos' ? ['bj', 'su', 'hkg'].includes(region)
      : storageType === 'cos' ? /^ap-[a-z0-9-]+$/.test(region || '')
        : /^(?:cn|ap|eu|us)-[a-z0-9-]+$/.test(region || '');
    if (!validRegion || normalizedStorageUrl.includes('.')
      || (storageType === 'cos' && !/-\d{5,}$/.test(normalizedStorageUrl))) {
      fail(prefix, `${storageField}.region`,
        'storage requires a valid region and provider bucket name (COS buckets include the APPID).');
    }
    if (!raw.access_key?.trim() || !raw.secret_key?.trim()) {
      fail(prefix, `${storageField}.access_key`, 'Storage requires access_key and secret_key.');
    }
  }
  return storage;
}

function timestampSeconds(value, field, prefix) {
  if (value == null) return null;
  if (typeof value !== 'string') {
    fail(prefix, field, `${field} must use HH:MM:SS format.`);
  }
  const match = TIMESTAMP_PATTERN.exec(value);
  if (!match) fail(prefix, field, `${field} must use HH:MM:SS format.`);
  const seconds = Number(match[1]) * 3_600 + Number(match[2]) * 60 + Number(match[3]);
  if (seconds > 43_200) fail(prefix, field, `${field} must not exceed 12:00:00.`);
  return seconds;
}

function hasYtDlpFormatControlCharacters(value) {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint <= 31 || codePoint === 127;
  });
}

function normalizeYtDlpFormat(value, prefix) {
  if (value == null) return null;
  if (typeof value !== 'string') {
    fail(prefix, 'yt_dlp_format', 'yt_dlp_format must be a string.');
  }
  const normalized = value.trim();
  if (
    !normalized
    || normalized.length > YT_DLP_FORMAT_MAX_LENGTH
    || hasYtDlpFormatControlCharacters(normalized)
  ) {
    fail(
      prefix,
      'yt_dlp_format',
      `yt_dlp_format must contain 1 to ${YT_DLP_FORMAT_MAX_LENGTH} characters without control characters.`,
    );
  }
  return normalized;
}

function normalizeYouTubeDownloadOptions(raw, {
  allowAdvanced = true,
  allowBrowserDelivery = false,
  allowMetadataUpload = true,
  allowVideoOnly = true,
  fieldPrefix = 'params',
  requireStorage = false,
} = {}) {
  if (!isRecord(raw)) {
    throw new YouTubeDownloadOptionsError(fieldPrefix, 'Download parameters must be an object.', 'invalid_object');
  }

  const supportedFields = new Set(BASE_FIELDS);
  if (allowAdvanced) {
    for (const field of ADVANCED_FIELDS) supportedFields.add(field);
  }
  if (allowBrowserDelivery) supportedFields.add('browser_delivery');
  for (const [field, value] of Object.entries(raw)) {
    if (value !== undefined && !supportedFields.has(field)) {
      fail(fieldPrefix, field, `Unsupported YouTube download field: ${field}.`, 'unsupported');
    }
  }

  if (raw.video_id != null) {
    if (typeof raw.video_id !== 'string' || !VIDEO_ID_PATTERN.test(raw.video_id)) {
      fail(fieldPrefix, 'video_id', 'video_id must be an 11-character YouTube video ID.');
    }
  }

  const downloadType = enumOption(raw, 'download_type', DOWNLOAD_TYPES, 'audio_video', fieldPrefix);
  if (downloadType === 'video' && !allowVideoOnly) {
    fail(fieldPrefix, 'download_type', 'Video-only downloads are not available for browser delivery.');
  }
  const ytDlpFormat = normalizeYtDlpFormat(raw.yt_dlp_format, fieldPrefix);
  const videoQuality = ytDlpFormat
    ? null
    : enumOption(raw, 'video_quality', VIDEO_QUALITIES, '<=720', fieldPrefix);
  const fps = ytDlpFormat ? null : raw.fps;
  if (!ytDlpFormat) {
    if (downloadType === 'audio' && raw.video_quality != null) {
      fail(fieldPrefix, 'video_quality', 'video_quality does not apply to audio downloads.');
    }
    if (fps != null && (typeof fps !== 'string' || !FPS_CONSTRAINT_PATTERN.test(fps))) {
      fail(fieldPrefix, 'fps', 'fps must use >=, <=, or == followed by a value from 1 to 240.');
    }
    if (downloadType === 'audio' && fps != null) {
      fail(fieldPrefix, 'fps', 'fps does not apply to audio downloads.');
    }
  }

  const outputFormats = downloadType === 'audio' ? AUDIO_OUTPUT_FORMATS : VIDEO_OUTPUT_FORMATS;
  const outputFormat = enumOption(
    raw,
    'output_format',
    outputFormats,
    downloadType === 'audio' ? 'm4a' : 'mp4',
    fieldPrefix,
  );
  const audioLanguage = ytDlpFormat
    ? null
    : enumOption(raw, 'audio_language', AUDIO_LANGUAGES, 'default', fieldPrefix);
  const audioQuality = enumOption(raw, 'audio_quality', AUDIO_QUALITIES, 'best', fieldPrefix);
  if (!ytDlpFormat && downloadType === 'video' && raw.audio_language != null) {
    fail(fieldPrefix, 'audio_language', 'audio_language does not apply to video-only downloads.');
  }
  if (downloadType !== 'audio' && raw.audio_quality != null) {
    fail(fieldPrefix, 'audio_quality', 'audio_quality only applies to audio downloads.');
  }
  if (raw.upload_metadata != null && typeof raw.upload_metadata !== 'boolean') {
    fail(fieldPrefix, 'upload_metadata', 'upload_metadata must be a boolean.');
  }
  if (raw.upload_metadata === true && (!allowMetadataUpload || raw.browser_delivery != null)) {
    fail(
      fieldPrefix,
      'upload_metadata',
      'upload_metadata is only available for downloads uploaded to customer storage.',
    );
  }

  const normalized = {
    download_type: downloadType,
    output_format: outputFormat,
  };
  if (raw.video_id != null) normalized.video_id = raw.video_id;
  if (ytDlpFormat) {
    normalized.yt_dlp_format = ytDlpFormat;
  } else if (downloadType !== 'audio') {
    normalized.video_quality = videoQuality;
    if (fps != null) normalized.fps = fps;
  }
  if (!ytDlpFormat && downloadType !== 'video') normalized.audio_language = audioLanguage;
  if (downloadType === 'audio') normalized.audio_quality = audioQuality;
  if (raw.upload_metadata === true) normalized.upload_metadata = true;

  if (allowAdvanced) {
    const startSeconds = timestampSeconds(raw.start_at, 'start_at', fieldPrefix);
    const endSeconds = timestampSeconds(raw.end_at, 'end_at', fieldPrefix);
    if (startSeconds != null || endSeconds != null) {
      const start = startSeconds ?? 0;
      if (endSeconds != null && endSeconds <= start) {
        fail(fieldPrefix, 'end_at', 'end_at must be later than start_at.');
      }
      normalized.start_at = raw.start_at ?? '00:00:00';
      if (raw.end_at != null) normalized.end_at = raw.end_at;
    }
  }

  if (raw.storage != null) normalized.storage = normalizeStorage(raw.storage, fieldPrefix);
  if (requireStorage && raw.storage == null && raw.browser_delivery == null) {
    fail(fieldPrefix, 'storage', 'storage is required for API downloads.', 'required');
  }
  if (allowBrowserDelivery && raw.browser_delivery != null) {
    if (!isRecord(raw.browser_delivery)) {
      fail(fieldPrefix, 'browser_delivery', 'browser_delivery must be an object.', 'invalid_object');
    }
    normalized.browser_delivery = raw.browser_delivery;
  }
  return normalized;
}

module.exports = {
  AUDIO_LANGUAGES,
  AUDIO_OUTPUT_FORMATS,
  AUDIO_QUALITIES,
  DOWNLOAD_TYPES,
  FPS_CONSTRAINT_PATTERN,
  STORAGE_TYPES,
  VIDEO_OUTPUT_FORMATS,
  VIDEO_QUALITIES,
  VIDEO_RESOLUTIONS,
  YT_DLP_FORMAT_MAX_LENGTH,
  YouTubeDownloadOptionsError,
  hasYtDlpFormatControlCharacters,
  normalizeYtDlpFormat,
  normalizeStorage,
  normalizeYouTubeDownloadOptions,
};
