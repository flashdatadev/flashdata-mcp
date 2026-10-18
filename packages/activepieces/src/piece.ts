import { createAction, createPiece, PieceAuth, Property, type Action, type InputPropertyMap } from '@activepieces/pieces-framework';
import { Ajv } from 'ajv';
import { createClient, FlashDataError, isObject, type JsonObject } from './client.js';
import { normalizeStorage, normalizeYouTubeDownloadOptions } from '../../../src/download/youtubeDownloadOptions.js';

interface Field {
  type: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  description?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  properties?: Record<string, Field>;
  additionalProperties?: boolean;
}
export interface Task {
  source: string;
  title: string;
  description: string;
  schema: { type: string; properties: Record<string, Field>; required: string[]; additionalProperties: boolean };
}

const labels: Record<string, string> = {
  query: 'Search query', video_id: 'YouTube video ID', handle: 'Channel handle',
  gl: 'Country code', hl: 'Interface language', num: 'Requested result count', page: 'Page',
  tbs: 'Time / search filter', autocorrect: 'Spelling correction', max_results: 'Maximum results',
  video_limit: 'Recent video limit', auto: 'Use automatic captions',
  include_formats: 'Include formats', include_chapters: 'Include chapters',
  yt_dlp_format: 'Advanced format selector', fps: 'Frame-rate constraint',
};
const help: Record<string, string> = {
  video_id: '11-character ID, not the full video URL.',
  handle: 'For example @jawed. The @ prefix is optional.',
  filters: 'Optional JSON object, for example {"upload_date":"this_week","type":"video","subtitles":true}. Only documented filters are accepted.',
  language: 'Caption or autocomplete language code, for example en. Captions must already exist in the selected language.',
  auto: 'True selects automatic captions; false selects uploader captions. No generation, translation or fallback.',
  yt_dlp_format: 'Advanced selector, 1–1024 characters. Overrides video quality, FPS and audio-language selection.',
  start_at: 'H:MM:SS or HH:MM:SS, at most 12:00:00.',
  end_at: 'Later than start, at most 12:00:00. Start defaults to 00:00:00 when only an end is supplied.',
  output_format: 'Video: mp4/webm/mkv. Audio: m4a/mp3/opus. Leave empty for a mode-dependent default.',
  download_type: 'audio_video merges video and audio (default); video is video only; audio is audio only.',
  video_quality: 'Leave empty for audio-only downloads. Video defaults to <=720.',
  audio_quality: 'For audio-only downloads. Omit for video or merged video/audio.',
  audio_language: 'Omit for video-only downloads. Defaults to default for audio or merged video/audio.',
  fps: 'For video: >=, <= or == followed by a number from 1 to 240. Omit for audio-only.',
};

function properties(task: Task): InputPropertyMap {
  const props: InputPropertyMap = {};
  for (const [name, field] of Object.entries(task.schema.properties)) {
    const required = task.schema.required.includes(name);
    const defaultValue = task.source === 'youtube_download' ? undefined : field.default;
    const base = {
      displayName: labels[name] ?? name.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()),
      description: [field.description, help[name], field.maximum === undefined ? '' : `Integer from ${field.minimum} to ${field.maximum}. Actual returned count may be lower.`].filter(Boolean).join(' '),
      required,
    };
    if (field.enum) props[name] = Property.StaticDropdown({ ...base, defaultValue, options: { options: field.enum.map(value => ({ label: value, value })) } });
    else if (field.type === 'integer') props[name] = Property.Number({ ...base, defaultValue: typeof defaultValue === 'number' ? defaultValue : undefined });
    else if (field.type === 'boolean' && field.default === undefined) {
      // An unset checkbox can become false in the editor. Keep omission distinct.
      props[name] = Property.StaticDropdown({ ...base, options: { options: [{ label: 'True', value: true }, { label: 'False', value: false }] } });
    } else if (field.type === 'boolean') props[name] = Property.Checkbox({ ...base, defaultValue: typeof defaultValue === 'boolean' ? defaultValue : undefined });
    else if (field.type === 'object') props[name] = Property.Json(base);
    else {
      const text = { ...base, defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined };
      props[name] = name === 'query' ? Property.LongText(text) : Property.ShortText(text);
    }
  }
  return props;
}

export function parseConnection(source: string, raw: unknown): { apiKey: string; storage?: JsonObject } {
  if (typeof raw !== 'string' || !raw.trim()) throw new FlashDataError('invalid_connection', 'Add a FlashData connection for this Piece.');
  if (source !== 'youtube_download') return { apiKey: raw.trim() };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || typeof value.api_key !== 'string' || !value.api_key.trim() || /[\r\n]/.test(value.api_key)
      || Object.keys(value).some(key => !['api_key', 'storage'].includes(key))) throw new Error();
    if (value.storage === undefined) return { apiKey: value.api_key.trim() };
    const storage = normalizeStorage(value.storage, '') as JsonObject;
    if (!['gcs', 'azure'].includes(String(storage.storage_type))
      && (typeof storage.access_key !== 'string' || !storage.access_key.trim()
        || typeof storage.secret_key !== 'string' || !storage.secret_key.trim())) throw new Error();
    if (storage.endpoint_url !== undefined) {
      const url = new URL(String(storage.endpoint_url));
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    }
    if (['s3_compatible', 'oss'].includes(String(storage.storage_type)) && !storage.endpoint_url) throw new Error();
    if (storage.storage_type === 'oss' && !new URL(String(storage.endpoint_url)).hostname.endsWith('.aliyuncs.com')) throw new Error();
    if (['s3', 's3_compatible', 'cos', 'bos', 'tos'].includes(String(storage.storage_type))
      && (typeof storage.region !== 'string' || !storage.region.trim())) throw new Error();
    return { apiKey: value.api_key.trim(), storage };
  } catch {
    throw new FlashDataError('invalid_connection', 'Use the documented connection JSON with api_key and valid storage settings. Never paste storage secrets into action inputs.');
  }
}

const noRetry = {
  retryOnFailure: { defaultValue: false, hide: true },
  continueOnFailure: { defaultValue: false, hide: true },
};

export function createTaskPiece(task: Task) {
  const download = task.source === 'youtube_download';
  const schema = structuredClone(task.schema);
  // The API normalizer selects audio/video defaults together; independent defaults conflict.
  if (download) for (const field of Object.values(schema.properties)) delete field.default;
  const validate = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: false }).compile(schema);
  const auth = PieceAuth.SecretText({
    displayName: download ? 'FlashData API key and storage (secret JSON)' : 'FlashData API key',
    required: true,
    description: `Create a source-scoped key at [FlashData API Keys](https://flashdata.dev/app/api-keys). Enable ${task.source}. ${download ? 'Enter secret JSON containing api_key and storage; see the source guide below. Storage is required for submission, optional for status/result reads. ' : ''}Connection validation uses the free access check. Actions consume FlashData Credits; Activepieces costs are separate. [Source guide](https://flashdata.dev/docs/sources/${task.source}) · [Pricing](https://flashdata.dev/pricing).`,
    validate: async ({ auth: raw }) => {
      try {
        await createClient(parseConnection(task.source, raw)).access(task.source);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: error instanceof FlashDataError ? error.message : 'FlashData connection validation failed. Check the connection and source permission.' };
      }
    },
  });

  function input(raw: unknown): JsonObject {
    if (!isObject(raw)) throw new FlashDataError('invalid_input', 'Action inputs must be an object.');
    const value = Object.fromEntries(Object.entries(raw).filter(([key, v]) => !(v === undefined || (!schema.required.includes(key) && (v === null || v === '')))));
    for (const [key, v] of Object.entries(value)) if (typeof v === 'string') value[key] = v.trim();
    if (typeof value.filters === 'string') {
      try { value.filters = JSON.parse(value.filters); }
      catch { throw new FlashDataError('invalid_input', 'Filters must be a JSON object with documented fields.'); }
    }
    if (!validate(value)) throw new FlashDataError('invalid_input', `Invalid inputs. Check required fields and limits in https://flashdata.dev/docs/sources/${task.source}.`);
    return value;
  }

  const submit = createAction({
    name: download ? 'submit_download' : task.source,
    displayName: download ? 'Submit download to storage' : task.title,
    description: `${task.description} ${download ? 'Returns a job receipt; save its id and check status without resubmitting.' : 'Returns the complete successful API JSON, including results and available usage metadata.'} Testing or running this step makes one paid API request. Check FlashData Jobs after an uncertain outcome before retrying.`,
    auth, props: properties(task), errorHandlingOptions: noRetry,
    run: async ({ auth: connection, propsValue }) => {
      const config = parseConnection(task.source, connection.secret_text);
      let params = input(propsValue);
      if (download) {
        if (!config.storage) throw new FlashDataError('missing_storage', 'Add the destination storage settings to this secret connection before submitting.');
        try {
          const metadata = params.upload_metadata;
          params = normalizeYouTubeDownloadOptions({ ...params, storage: config.storage }, { requireStorage: true });
          if (metadata === false) params.upload_metadata = false;
        }
        catch { throw new FlashDataError('invalid_download', 'Invalid download options. Check audio/video format compatibility, quality fields and clipping times.'); }
      }
      return createClient(config).query(task.source, params);
    },
  });
  const actions: Action[] = [submit];
  if (download) {
    for (const operation of ['status', 'result'] as const) {
      actions.push(createAction({
        name: `download_${operation}`, displayName: operation === 'status' ? 'Read download status' : 'Read download result',
        description: operation === 'status'
          ? 'Read the saved download job without resubmitting it. Pending and processing mean it is not finished.'
          : 'Read the delivery manifest after completion. Otherwise return the current status. Does not download the media bytes. Result JSON is retained for 24 hours; media retention depends on your storage.',
        auth, errorHandlingOptions: noRetry,
        props: { job_id: Property.ShortText({ displayName: 'Download job ID', required: true, description: 'Use the id from Submit download, for example job_…. Never submit a second download to poll.' }) },
        run: async ({ auth: connection, propsValue }) => {
          if (typeof propsValue.job_id !== 'string' || !/^job_[A-Za-z0-9_-]{1,116}$/.test(propsValue.job_id)) {
            throw new FlashDataError('invalid_job_id', 'Enter the job ID returned by Submit download.');
          }
          return createClient(parseConnection(task.source, connection.secret_text))[operation](propsValue.job_id);
        },
      }));
    }
  }
  return createPiece({
    displayName: `${task.title} — FlashData`,
    description: task.description,
    logoUrl: 'https://raw.githubusercontent.com/rocosen/flashdata-mcp/main/assets/logo.svg',
    authors: ['rocosen'], auth, actions, triggers: [], minimumSupportedRelease: '0.82.0',
  });
}
