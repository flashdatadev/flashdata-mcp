import { randomUUID } from 'node:crypto';

export type JsonObject = Record<string, unknown>;
export interface FlashDataOptions {
  /** Server-side only. Defaults to FLASHDATA_API_KEY. */
  apiKey?: string;
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

export function createClient(options: FlashDataOptions = {}) {
  const apiKey = options.apiKey ?? process.env.FLASHDATA_API_KEY;
  if (!apiKey?.trim() || /[\r\n]/.test(apiKey)) {
    throw new FlashDataError('missing_api_key', 'Set FLASHDATA_API_KEY on the server or pass apiKey.');
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

  async function query(source: string, input: JsonObject, signal?: AbortSignal): Promise<JsonObject> {
    const { query, video_id, handle, ...params } = input;
    const body = { source, ...(query !== undefined ? { query } : {}), ...(video_id !== undefined ? { video_id } : {}), ...(handle !== undefined ? { handle } : {}), params };
    const data = await request(`https://data.flashdata.dev/v1/queries${source === 'youtube_download' ? '' : '/realtime'}`, { body, signal }) as JsonObject;
    if (source === 'youtube_download') {
      if (typeof data.id !== 'string' || !/^job_[A-Za-z0-9_-]{1,116}$/.test(data.id)) {
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
    const data = await request(`https://api.flashdata.dev/v2/jobs/${encodeURIComponent(jobId)}`, { signal }) as JsonObject;
    if (!isObject(data.job) || data.job.source !== 'youtube_download') {
      throw new FlashDataError('source_mismatch', 'This tool only reads youtube_download jobs.');
    }
    if (typeof data.job.status !== 'string' || !data.job.status) throw new FlashDataError('invalid_job', 'Job status is missing. Retry this read, not the submission.');
    // Job responses can contain submitted parameters. Return only public lifecycle fields.
    const rawJob = data.job;
    const job = Object.fromEntries(['id', 'source', 'status', 'created_at', 'updated_at', 'completed_at', 'credits']
      .filter(key => ['string', 'number'].includes(typeof rawJob[key]))
      .map(key => [key, rawJob[key]]));
    return { job };
  }

  async function result(jobId: string, signal?: AbortSignal): Promise<JsonObject> {
    const data = await status(jobId, signal);
    if ((data.job as JsonObject).status !== 'completed') return data;
    const access = await request('https://api.flashdata.dev/v2/api-access', { signal }) as JsonObject;
    let origin: URL;
    try {
      origin = new URL(String(access.result_origin));
      if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error();
    } catch { throw new FlashDataError('invalid_result_origin', 'FlashData did not provide a trusted HTTPS result origin. Retry the result read.'); }
    const link = await request(`https://api.flashdata.dev/v2/jobs/${encodeURIComponent(jobId)}/results`, { signal, redirect: true }) as URL;
    if (link.protocol !== 'https:' || link.origin !== origin.origin || link.username || link.password || link.hash) {
      throw new FlashDataError('invalid_result_url', 'The result URL does not match the trusted FlashData result origin.');
    }
    return { ...data, output: await request(link.href, { signal, authenticated: false }) };
  }
  return { query, status, result };
}
