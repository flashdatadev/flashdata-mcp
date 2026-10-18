import { randomUUID } from 'node:crypto';

export type JsonObject = Record<string, unknown>;
export interface FlashDataOptions {
  /** Decrypted Activepieces connection value; never log it. */
  apiKey: string;
  /** Per HTTP request, including reading the body. Default: 65 seconds. */
  timeoutMs?: number;
  /** Default: 16 MiB. An oversized paid response must not be submitted again. */
  maxResponseBytes?: number;
  /** Inject a transport for tests or server-side instrumentation. */
  fetch?: typeof globalThis.fetch;
}

export class FlashDataError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly outcomeUnknown = false,
    public readonly httpStatus?: number,
    public readonly requestId?: string,
    public readonly jobId?: string,
  ) { super(message); this.name = 'FlashDataError'; }
}

export function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const messages: Record<number, string> = {
  401: 'FlashData rejected the API Key. Check the server-side credential.',
  402: 'Insufficient FlashData Credits. Check account balance and pricing.',
  403: 'The API Key does not grant access to this source or job.',
  404: 'The job or its retained result is unavailable.',
  429: 'FlashData rate or quota limit reached. Check Jobs before retrying a paid submission.',
};

export function createClient(options: FlashDataOptions) {
  const apiKey = options.apiKey;
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) {
    throw new FlashDataError('missing_api_key', 'Set a valid FlashData API Key in the Activepieces connection.');
  }
  const timeoutMs = options.timeoutMs ?? 65_000;
  const limit = options.maxResponseBytes ?? 16 * 1024 * 1024;
  if (![timeoutMs, limit].every(n => Number.isSafeInteger(n) && n > 0) || timeoutMs > 2_147_483_647) {
    throw new FlashDataError('invalid_configuration', 'timeoutMs and maxResponseBytes must be positive integers; timeoutMs must fit a 32-bit timer.');
  }
  const fetcher = options.fetch ?? globalThis.fetch;

  async function request(url: string, { body, signal, authenticated = true, redirect = false }: {
    body?: JsonObject; signal?: AbortSignal; authenticated?: boolean; redirect?: boolean;
  } = {}): Promise<JsonObject | URL> {
    const requestId = `req_${randomUUID()}`;
    if (signal?.aborted) throw new FlashDataError('aborted', 'Request cancelled before dispatch.', false, undefined, requestId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    let response: Response | undefined;
    try {
      response = await fetcher(url, {
        method: body ? 'POST' : 'GET', redirect: 'manual', signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(authenticated ? { 'X-API-Key': apiKey!, 'X-Request-Id': requestId } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (redirect && response.status === 302) {
        await response.body?.cancel();
        return new URL(response.headers.get('location') ?? '');
      }
      if (!response.ok || redirect) {
        await response.body?.cancel();
        throw new FlashDataError('http_error', messages[response.status] ?? 'FlashData request failed. Check Jobs before retrying a paid submission.',
          Boolean(body && (response.status >= 500 || response.status < 400)), response.status, requestId);
      }
      if (Number(response.headers.get('content-length')) > limit) throw new Error('body_limit');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('empty_body');
      const parts: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limit) throw new Error('body_limit');
          parts.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!isObject(data)) throw new Error('invalid_json_object');
      if (data.status === 'failed' || (isObject(data.job) && data.job.status === 'failed')) {
        throw new FlashDataError('job_failed', 'FlashData reported a failed job. Inspect Jobs for the failure and billing status; do not automatically resubmit.', false, response.status, requestId);
      }
      return data;
    } catch (error) {
      if (error instanceof FlashDataError) throw error;
      await response?.body?.cancel().catch(() => {});
      throw new FlashDataError(body ? 'submission_outcome_unknown' : 'read_failed', body
        ? 'The paid request may have been accepted or charged. Check FlashData Jobs before submitting again. This SDK does not retry POST requests.'
        : 'The response could not be read safely. Retry this read; do not resubmit the paid job.', Boolean(body), response?.status, requestId);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }

  async function access(source: string): Promise<JsonObject> {
    const data = await request('https://api.flashdata.dev/v2/api-access') as JsonObject;
    if (!Array.isArray(data.sources) || !data.sources.includes(source)) {
      throw new FlashDataError('source_permission', 'The API Key does not grant access to this Piece’s source.');
    }
    return data;
  }

  async function query(source: string, input: JsonObject, signal?: AbortSignal): Promise<JsonObject> {
    const { query, video_id, handle, ...params } = input;
    const body = { source, ...(query !== undefined ? { query } : {}), ...(video_id !== undefined ? { video_id } : {}), ...(handle !== undefined ? { handle } : {}), params };
    const data = await request(`https://data.flashdata.dev/v1/queries${source === 'youtube_download' ? '' : '/realtime'}`, { body, signal }) as JsonObject;
    if (source === 'youtube_download') {
      if (typeof data.id !== 'string' || !/^job_[A-Za-z0-9_-]{1,116}$/.test(data.id)
        || data.source !== source || !['pending', 'processing', 'completed'].includes(String(data.status))) {
        throw new FlashDataError('submission_outcome_unknown', 'Missing job receipt. Check Jobs before submitting this paid download again.', true);
      }
      // Receipts need only an id and status; never expose submitted storage credentials.
      return { id: data.id, status: data.status, source };
    }
    if (data.source !== source || data.status !== 'done' || !Array.isArray(data.results)) {
      throw new FlashDataError('submission_outcome_unknown', 'Unexpected query response. Check Jobs before submitting this paid query again.', true);
    }
    return data;
  }

  async function status(jobId: string, signal?: AbortSignal): Promise<JsonObject> {
    if (!/^job_[A-Za-z0-9_-]{1,116}$/.test(jobId)) throw new FlashDataError('invalid_job_id', 'Enter the job ID returned by Submit download.');
    const data = await request(`https://api.flashdata.dev/v2/jobs/${encodeURIComponent(jobId)}`, { signal }) as JsonObject;
    if (!isObject(data.job) || data.job.source !== 'youtube_download' || data.job.id !== jobId) {
      throw new FlashDataError('source_mismatch', 'This tool only reads youtube_download jobs.');
    }
    if (typeof data.job.status !== 'string' || !['pending', 'processing', 'completed'].includes(data.job.status)) throw new FlashDataError('invalid_job', 'Unexpected job status. Retry this read, not the submission.');
    // Job responses can contain submitted parameters. Return only public lifecycle fields.
    const rawJob = data.job;
    const job = Object.fromEntries(['id', 'source', 'status', 'createdAt', 'updatedAt', 'durationMs', 'progress', 'credits']
      .filter(key => ['string', 'number'].includes(typeof rawJob[key]))
      .map(key => [key, rawJob[key]]));
    return { job };
  }

  async function result(jobId: string, signal?: AbortSignal): Promise<JsonObject> {
    const data = await status(jobId, signal);
    if ((data.job as JsonObject).status !== 'completed') return data;
    const permissions = await access('youtube_download');
    let origin: URL;
    try {
      origin = new URL(String(permissions.result_origin));
      if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error();
    } catch { throw new FlashDataError('invalid_result_origin', 'FlashData did not provide a trusted HTTPS result origin. Retry the result read.'); }
    const link = await request(`https://api.flashdata.dev/v2/jobs/${encodeURIComponent(jobId)}/results`, { signal, redirect: true }) as URL;
    if (link.protocol !== 'https:' || link.origin !== origin.origin || link.username || link.password || link.hash) {
      throw new FlashDataError('invalid_result_url', 'The result URL does not match the trusted FlashData result origin.');
    }
    const output = await request(link.href, { signal, authenticated: false }) as JsonObject;
    if (output.id !== jobId || output.source !== 'youtube_download' || output.status !== 'completed'
      || !Array.isArray(output.results) || !output.results.every(isObject)) {
      throw new FlashDataError('invalid_result', 'Unexpected download manifest. Retry this read, not the paid submission.');
    }
    const pick = (value: JsonObject, fields: string[]) => Object.fromEntries(fields.filter(key => key in value).map(key => [key, value[key]]));
    const results = output.results.map(value => ({
      ...pick(value as JsonObject, ['file_url', 'file_size', 'downloaded_bytes', 'md5', 'resolution', 'duration', 'output_format', 'fps', 'video_codec', 'audio_codec', 'dynamic_range']),
      ...(isObject((value as JsonObject).metadata) ? { metadata: pick((value as JsonObject).metadata as JsonObject, ['file_url', 'file_size', 'md5']) } : {}),
    }));
    return { ...data, output: { ...pick(output, ['id', 'source', 'status', 'completed_at', 'expires_at']), results } };
  }
  return { access, query, status, result };
}
