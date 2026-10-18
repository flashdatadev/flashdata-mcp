import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PieceMetadata } = require('@activepieces/pieces-framework');
const tasks = JSON.parse(readFileSync(new URL('../tasks.json', import.meta.url)));
const pieces = Object.fromEntries(tasks.map(task => [task.source, Object.values(require(`../dist/${task.slug}/src/index.js`))[0]]));
const { createClient } = require('../dist/test/client.cjs');
const { parseConnection } = require('../dist/test/piece.cjs');
const key = 'offline-fake-api-key';
const storage = { storage_type: 's3', storage_url: 'test-media-bucket', region: 'us-east-1', access_key: 'offline-access', secret_key: 'offline-secret' };
const downloadAuth = JSON.stringify({ api_key: key, storage });
const id = 'job_offline123';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const envelope = source => ({ source, status: 'done', results: [{ sample: 'offline response' }], usage: { credits: 0.02 } });
const job = (status = 'completed', overrides = {}) => ({ job: { id, source: 'youtube_download', status, createdAt: '2026-10-18T00:00:00Z', progress: 100, ...overrides } });
const manifest = () => ({ id, source: 'youtube_download', status: 'completed', results: [{ file_url: 'https://storage.example/media.m4a', file_size: 42, downloaded_bytes: 42 }] });

beforeEach(t => {
  t.mock.method(net.Socket.prototype, 'connect', () => { throw new Error('Network is forbidden in offline tests.'); });
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network request.'); });
});
function transport(t, responses) {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options, body: options.body ? JSON.parse(options.body) : undefined });
    assert.ok(responses.length, 'No unexpected retry or extra request');
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next(url, options) : next;
  });
  return requests;
}
function run(source, propsValue, actionName = source) {
  return pieces[source].getAction(actionName).run({ auth: { secret_text: source === 'youtube_download' ? downloadAuth : key }, propsValue });
}

for (const task of tasks) {
  test(`${task.source}: one separately loadable Piece, fixed source, safe connection check`, async t => {
    const piece = pieces[task.source];
    assert.equal(piece.constructor.name, 'Piece');
    assert.equal(piece.displayName, `${task.title} — FlashData`);
    assert.equal(piece.minimumSupportedRelease, '0.82.0');
    assert.deepEqual(Object.keys(piece.triggers()), []);
    assert.equal(Object.keys(piece.actions()).length, task.source === 'youtube_download' ? 3 : 1);
    assert.equal(piece.auth.type, 'SECRET_TEXT');
    assert.ok(PieceMetadata.safeParse({ ...piece.metadata(), name: `@flashdata-dev/piece-${task.slug}`, version: '0.1.0' }).success);
    const requests = transport(t, [json({ sources: [task.source], result_origin: 'https://results.example' })]);
    const result = await piece.auth.validate({ auth: task.source === 'youtube_download' ? downloadAuth : key });
    assert.deepEqual(result, { valid: true });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://api.flashdata.dev/v2/api-access');
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].body, undefined);
    assert.equal(requests[0].headers['X-API-Key'], key);
  });
  test(`${task.source}: rejects a connection without the required source`, async t => {
    transport(t, [json({ sources: [] })]);
    const result = await pieces[task.source].auth.validate({ auth: task.source === 'youtube_download' ? downloadAuth : key });
    assert.equal(result.valid, false);
    assert.match(result.error, /source/);
    assert.ok(!result.error.includes(key));
  });
  if (task.source !== 'youtube_download') {
    test(`${task.source}: action sends exactly one paid request and preserves the response`, async t => {
      const expected = envelope(task.source);
      const requests = transport(t, [json(expected)]);
      assert.deepEqual(await run(task.source, task.example), expected);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, 'https://data.flashdata.dev/v1/queries/realtime');
      assert.equal(requests[0].method, 'POST');
      assert.equal(requests[0].redirect, 'manual');
      assert.equal(requests[0].body.source, task.source);
      for (const name of ['query', 'video_id', 'handle']) if (task.example[name] !== undefined) {
        assert.equal(requests[0].body[name], task.example[name]);
        assert.equal(requests[0].body.params[name], undefined);
      }
      assert.deepEqual(pieces[task.source].getAction(task.source).errorHandlingOptions.retryOnFailure, { defaultValue: false, hide: true });
    });
    test(`${task.source}: cannot override source or inject unrelated inputs`, async () => {
      await assert.rejects(run(task.source, { ...task.example, source: 'youtube_download' }), error => error.code === 'invalid_input');
      await assert.rejects(run(task.source, { ...task.example, endpoint: 'https://untrusted.example' }), error => error.code === 'invalid_input');
    });
  }
}

test('Google omission and explicit false are different', async t => {
  const requests = transport(t, [json(envelope('google_search')), json(envelope('google_search'))]);
  await run('google_search', { query: 'test' });
  await run('google_search', { query: 'test', autocorrect: false });
  assert.deepEqual(requests[0].body.params, {});
  assert.deepEqual(requests[1].body.params, { autocorrect: false });
  assert.equal(pieces.google_search.getAction('google_search').props.autocorrect.type, 'STATIC_DROPDOWN');
});
for (const [source, input] of [
  ['google_search', { query: 'x', num: 0 }], ['google_news', { query: 'x', page: 101 }],
  ['youtube_search', { query: 'x', max_results: 21 }], ['youtube_search_extended', { query: 'x', max_results: 701 }],
  ['youtube_channel', { handle: '@jawed', video_limit: 101 }], ['youtube_search', { query: 'x', max_results: 2.5 }],
  ['youtube_search', { query: 'x', filters: { invented: true } }], ['youtube_search', { query: 'x', filters: { type: 'invented' } }],
  ['youtube_transcript', { video_id: 'jNQXAC9IVRw', auto: 'false' }], ['youtube_metadata', { video_id: 'invalid' }],
  ['google_search', { query: '   ' }], ['google_search', { query: 'x', num: '3' }],
]) test(`rejects invalid input before billing: ${source} ${JSON.stringify(input)}`, async () => {
  await assert.rejects(run(source, input), error => error.code === 'invalid_input');
});
test('standard and extended search use different ceilings, while preserving filters', async t => {
  const requests = transport(t, [json(envelope('youtube_search')), json(envelope('youtube_search_extended'))]);
  await run('youtube_search', { query: 'x', max_results: 20, filters: { hd: false, subtitles: true } });
  await run('youtube_search_extended', { query: 'x', max_results: 700 });
  assert.deepEqual(requests[0].body.params, { max_results: 20, filters: { hd: false, subtitles: true } });
  assert.equal(requests[1].body.params.max_results, 700);
});
test('transcript/captions defaults differ and explicit false is retained', async t => {
  const requests = transport(t, [json(envelope('youtube_transcript')), json(envelope('youtube_captions')), json(envelope('youtube_transcript'))]);
  await run('youtube_transcript', { video_id: 'jNQXAC9IVRw' });
  await run('youtube_captions', { video_id: 'jNQXAC9IVRw' });
  await run('youtube_transcript', { video_id: 'jNQXAC9IVRw', auto: false });
  assert.deepEqual(requests.map(req => req.body.params), [{ language: 'en', auto: true }, { language: 'en', auto: false }, { language: 'en', auto: false }]);
});
test('metadata false and autocomplete defaults reach the API', async t => {
  const requests = transport(t, [json(envelope('youtube_metadata')), json(envelope('youtube_suggestions'))]);
  await run('youtube_metadata', { video_id: 'jNQXAC9IVRw', include_formats: false, include_chapters: false });
  await run('youtube_suggestions', { query: 'battery' });
  assert.deepEqual(requests[0].body.params, { include_formats: false, include_chapters: false });
  assert.deepEqual(requests[1].body.params, { language: 'en', region: 'US' });
});

test('download uses async submission, a secret connection and a minimal receipt', async t => {
  const requests = transport(t, [json({ id, status: 'pending', source: 'youtube_download', params: { storage } })]);
  const result = await run('youtube_download', { video_id: 'jNQXAC9IVRw', download_type: 'audio', upload_metadata: false }, 'submit_download');
  assert.equal(requests[0].url, 'https://data.flashdata.dev/v1/queries');
  assert.deepEqual(result, { id, status: 'pending', source: 'youtube_download' });
  assert.deepEqual(requests[0].body.params, { download_type: 'audio', output_format: 'm4a', audio_language: 'default', audio_quality: 'best', upload_metadata: false, storage });
  assert.equal(pieces.youtube_download.getAction('submit_download').props.storage, undefined);
  assert.ok(!JSON.stringify(result).includes(storage.secret_key));
});
for (const options of [
  { download_type: 'audio', output_format: 'mp4' }, { download_type: 'audio', video_quality: '<=720' },
  { download_type: 'video', audio_language: 'original' }, { audio_quality: '128' },
  { start_at: '00:01:00', end_at: '00:00:59' }, { end_at: '13:00:00' },
  { yt_dlp_format: 'format\nprivate' }, { storage },
]) test(`invalid download rejected without a network call: ${Object.keys(options).join(',')}`, async () => {
  await assert.rejects(run('youtube_download', { video_id: 'jNQXAC9IVRw', ...options }, 'submit_download'), error => ['invalid_download', 'invalid_input'].includes(error.code));
});
test('advanced selector and clip normalization follow the download contract', async t => {
  const requests = transport(t, [json({ id, source: 'youtube_download', status: 'pending' })]);
  await run('youtube_download', { video_id: 'jNQXAC9IVRw', yt_dlp_format: 'bestvideo+bestaudio', video_quality: 'worst', fps: '==30', end_at: '00:00:05' }, 'submit_download');
  assert.equal(requests[0].body.params.video_quality, undefined);
  assert.equal(requests[0].body.params.fps, undefined);
  assert.equal(requests[0].body.params.start_at, '00:00:00');
});
for (const invalid of [
  'not-json', JSON.stringify({ api_key: key, storage: { ...storage, secret_key: '' } }),
  JSON.stringify({ api_key: key, storage: { ...storage, region: '' } }),
  JSON.stringify({ api_key: key, storage: { ...storage, storage_type: 's3_compatible' } }),
  JSON.stringify({ api_key: key, storage: { ...storage, storage_type: 'oss' } }),
  JSON.stringify({ api_key: key, storage: { ...storage, endpoint_url: 'http://storage.example' } }),
  JSON.stringify({ api_key: key, storage: { ...storage, object_prefix: '../private' } }),
]) test(`invalid secret connection is rejected and redacted #${invalid.length}`, () => {
  assert.throws(() => parseConnection('youtube_download', invalid), error => error.code === 'invalid_connection' && !error.message.includes(key) && !error.message.includes(storage.secret_key));
});
test('a read-only download connection may omit storage but cannot submit', async () => {
  assert.deepEqual(parseConnection('youtube_download', JSON.stringify({ api_key: key })), { apiKey: key });
  await assert.rejects(pieces.youtube_download.getAction('submit_download').run({ auth: { secret_text: JSON.stringify({ api_key: key }) }, propsValue: { video_id: 'jNQXAC9IVRw' } }), error => error.code === 'missing_storage');
});
test('pending result returns status without contacting result storage', async t => {
  const requests = transport(t, [json(job('pending', { params: { storage } }))]);
  const result = await run('youtube_download', { job_id: id }, 'download_result');
  assert.equal(requests.length, 1);
  assert.equal(result.job.status, 'pending');
  assert.equal(result.output, undefined);
  assert.equal(result.job.params, undefined);
});
test('completed result is origin checked and downloaded without API credentials', async t => {
  const output = manifest();
  output.results[0].storage = storage;
  const requests = transport(t, [json(job()), json({ sources: ['youtube_download'], result_origin: 'https://results.example' }),
    new Response(null, { status: 302, headers: { location: 'https://results.example/job.json?signature=fake' } }), json(output)]);
  const result = await run('youtube_download', { job_id: id }, 'download_result');
  assert.equal(requests.length, 4);
  assert.ok(requests.every(request => request.method === 'GET'));
  assert.equal(requests[3].headers['X-API-Key'], undefined);
  assert.equal(requests[3].headers['X-Request-Id'], undefined);
  assert.equal(result.output.results[0].file_size, 42);
  assert.equal(result.output.results[0].storage, undefined);
  assert.equal(result.job.createdAt, '2026-10-18T00:00:00Z');
});
for (const override of [{ source: 'google_search' }, { id: 'job_other' }]) test(`rejects a mismatched download job ${JSON.stringify(override)}`, async t => {
  const requests = transport(t, [json(job('completed', override))]);
  await assert.rejects(run('youtube_download', { job_id: id }, 'download_result'), error => error.code === 'source_mismatch');
  assert.equal(requests.length, 1);
});
test('invalid job ID is rejected before any request', async () => {
  await assert.rejects(run('youtube_download', { job_id: '../jobs' }, 'download_status'), error => error.code === 'invalid_job_id');
});
for (const link of ['https://untrusted.example/result', 'http://results.example/result', 'https://user:pass@results.example/result', 'https://results.example/result#secret']) {
  test(`rejects unsafe result link: ${link}`, async t => {
    const requests = transport(t, [json(job()), json({ sources: ['youtube_download'], result_origin: 'https://results.example' }), new Response(null, { status: 302, headers: { location: link } })]);
    await assert.rejects(run('youtube_download', { job_id: id }, 'download_result'), error => error.code === 'invalid_result_url');
    assert.equal(requests.length, 3);
  });
}
test('invalid trusted origin stops result retrieval', async t => {
  const requests = transport(t, [json(job()), json({ sources: ['youtube_download'], result_origin: 'https://results.example/path' })]);
  await assert.rejects(run('youtube_download', { job_id: id }, 'download_result'), error => error.code === 'invalid_result_origin');
  assert.equal(requests.length, 2);
});
for (const status of [401, 402, 403, 404, 429, 500, 502]) test(`HTTP ${status} is redacted and never retried`, async t => {
  const requests = transport(t, [new Response(`${key} ${storage.secret_key}`, { status })]);
  await assert.rejects(run('google_search', { query: 'test' }), error => error.code === 'http_error'
    && !error.message.includes(key) && !error.message.includes(storage.secret_key) && error.httpStatus === status);
  assert.equal(requests.length, 1);
});
test('network failure has an unknown paid outcome and no retry', async t => {
  const requests = transport(t, [new Error(`upstream leaked ${key}`)]);
  await assert.rejects(run('google_search', { query: 'test' }), error => error.outcomeUnknown === true && !error.message.includes(key));
  assert.equal(requests.length, 1);
});
test('unexpected source and pending realtime response are not successful', async t => {
  transport(t, [json(envelope('google_news')), json({ source: 'google_search', status: 'pending', results: [] })]);
  for (let i = 0; i < 2; i++) await assert.rejects(run('google_search', { query: 'test' }), error => error.outcomeUnknown === true);
});
test('failed job is an error, never a completed result', async t => {
  const requests = transport(t, [json(job('failed', { error: storage.secret_key }))]);
  await assert.rejects(run('youtube_download', { job_id: id }, 'download_result'), error => error.code === 'job_failed' && !error.message.includes(storage.secret_key));
  assert.equal(requests.length, 1);
});
test('an oversized paid response is not retried', async () => {
  let calls = 0;
  const client = createClient({ apiKey: key, maxResponseBytes: 16, fetch: async () => { calls++; return json(envelope('google_search')); } });
  await assert.rejects(client.query('google_search', { query: 'test' }), error => error.outcomeUnknown === true);
  assert.equal(calls, 1);
});
test('a timed-out paid request keeps its unknown outcome', async () => {
  let calls = 0;
  const client = createClient({ apiKey: key, timeoutMs: 5, fetch: async (_url, { signal }) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  } });
  await assert.rejects(client.query('google_search', { query: 'test' }), error => error.outcomeUnknown === true);
  assert.equal(calls, 1);
});
test('pre-cancelled request never dispatches', async () => {
  const client = createClient({ apiKey: key, fetch: () => { assert.fail('must not dispatch'); } });
  await assert.rejects(client.query('google_search', { query: 'test' }, AbortSignal.abort()), error => error.code === 'aborted' && error.outcomeUnknown === false);
});
