import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { asSchema, generateText, isStepCount } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import * as sdk from '../dist/index.js';

const responses = JSON.parse(readFileSync(new URL('./fixtures/historical-responses.json', import.meta.url)));
const context = { toolCallId: 'offline-test', messages: [], context: {} };
const key = 'test-key-never-send-to-storage';
const storage = { storage_type: 's3', storage_url: 'example-bucket', access_key: 'storage-access', secret_key: 'storage-secret' };
const inputs = {
  google_search: { query: 'agent search', num: 5 }, google_news: { query: 'space missions', gl: 'us' },
  google_images: { query: 'solar panels', autocorrect: false }, google_shopping: { query: 'usb microphone', page: 2 },
  google_videos: { query: 'database tutorial', hl: 'en' }, google_places: { query: 'coworking singapore', location: 'Singapore' },
  youtube_search: { query: 'RAG evaluation', max_results: 20, filters: { subtitles: true, sort_by: 'relevance' } },
  youtube_search_extended: { query: 'RAG evaluation', max_results: 700 },
  youtube_metadata: { video_id: 'dQw4w9WgXcQ', include_formats: false },
  youtube_transcript: { video_id: 'dQw4w9WgXcQ' }, youtube_captions: { video_id: 'dQw4w9WgXcQ' },
  youtube_trainability: { video_id: 'dQw4w9WgXcQ' }, youtube_channel: { handle: '@GoogleDevelopers', video_limit: 5 },
  youtube_suggestions: { query: 'vector database', language: 'en', region: 'US' },
};
function mock(sequence) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, ...options });
    const response = sequence[calls.length - 1];
    assert.ok(response, `Unexpected HTTP call ${url}`);
    if (response instanceof Error) throw response;
    return response instanceof Response ? response : Response.json(response);
  };
  return { apiKey: key, fetch, calls };
}
for (const [source, input] of Object.entries(inputs)) {
  test(`${source}: source-fixed payload and historical JSON survive SDK tool execution`, async () => {
    const options = mock([responses[source]]);
    const tool = sdk.flashdataTools(options)[source];
    assert.deepEqual(await tool.execute(input, context), responses[source]);
    const request = options.calls[0];
    assert.equal(request.url, 'https://data.flashdata.dev/v1/queries/realtime');
    assert.equal(request.headers['X-API-Key'], key);
    assert.equal(request.redirect, 'manual');
    const body = JSON.parse(request.body);
    assert.equal(body.source, source);
    assert.equal(body.query ?? body.video_id ?? body.handle, input.query ?? input.video_id ?? input.handle);
    assert.equal('query' in body.params || 'video_id' in body.params || 'handle' in body.params, false);
    if (source === 'youtube_transcript') assert.equal(body.params.auto, true);
    if (source === 'youtube_captions') assert.equal(body.params.auto, false);
    const schema = await asSchema(tool.inputSchema).jsonSchema;
    assert.equal(schema.additionalProperties, false);
    assert.ok(!JSON.stringify(schema).includes(key));
  });
}
test('Google omission stays omitted; no fixed result count or locale', async () => {
  const options = mock([responses.google_search]);
  await sdk.googleSearch(options).execute({ query: 'agent research' }, context);
  assert.deepEqual(JSON.parse(options.calls[0].body).params, {});
});
for (const [name, factory, input] of [
  ['search count', sdk.youtubeSearch, { query: 'x', max_results: 21 }],
  ['extended count', sdk.youtubeExtendedSearch, { query: 'x', max_results: 701 }],
  ['source injection', sdk.googleSearch, { query: 'x', source: 'youtube_download' }],
  ['unknown filter', sdk.youtubeSearch, { query: 'x', filters: { views: 12 } }],
  ['invalid video', sdk.youtubeTranscript, { video_id: 'https://youtube.com/watch?v=x' }],
  ['invalid job', sdk.youtubeDownloadResult, { job_id: '../secrets' }],
]) test(`reject ${name} before network`, async () => {
  const options = mock([]);
  await assert.rejects(factory(options).execute(input, context));
  assert.equal(options.calls.length, 0);
});
for (const status of [401, 402, 403, 429, 500, 302]) test(`HTTP ${status}: no retry and no upstream secret leakage`, async () => {
  const options = mock([new Response(`secret: ${key} ${storage.secret_key}`, { status })]);
  await assert.rejects(sdk.googleSearch(options).execute({ query: 'x' }, context), e => {
    assert.ok(e instanceof sdk.FlashDataError);
    assert.equal(e.httpStatus, status);
    assert.ok(!JSON.stringify(e).includes(key) && !e.message.includes('storage-secret'));
    return true;
  });
  assert.equal(options.calls.length, 1);
});
for (const [name, reply] of [
  ['network failure', new Error(`network ${key}`)], ['invalid JSON', new Response('not json')],
  ['wrong source', { ...responses.google_search, source: 'google_news' }],
  ['unexpected status', { ...responses.google_search, status: 'pending' }],
]) test(`${name}: paid outcome unknown and single POST`, async () => {
  const options = mock([reply]);
  await assert.rejects(sdk.googleSearch(options).execute({ query: 'x' }, context), e => e.outcomeUnknown && !e.message.includes(key));
  assert.equal(options.calls.length, 1);
});
test('HTTP 200 business failure is an error', async () => {
  const options = mock([{ status: 'failed', error: key }]);
  await assert.rejects(sdk.googleSearch(options).execute({ query: 'x' }, context), { code: 'job_failed' });
});
test('response byte limit is enforced without Content-Length', async () => {
  const options = mock([new Response(JSON.stringify(responses.google_search))]);
  await assert.rejects(sdk.googleSearch({ ...options, maxResponseBytes: 10 }).execute({ query: 'x' }, context), { outcomeUnknown: true });
});
test('pre-abort dispatches no paid request; timeout aborts a dispatched request', async () => {
  const options = mock([]);
  await assert.rejects(sdk.googleSearch(options).execute({ query: 'x' }, { ...context, abortSignal: AbortSignal.abort() }), { code: 'aborted', outcomeUnknown: false });
  assert.equal(options.calls.length, 0);
  let count = 0;
  const fetch = (_, { signal }) => new Promise((_, reject) => { count++; signal.addEventListener('abort', () => reject(new Error('abort'))); });
  await assert.rejects(sdk.googleSearch({ apiKey: key, timeoutMs: 5, fetch }).execute({ query: 'x' }, context), { outcomeUnknown: true });
  assert.equal(count, 1);
});
test('download submit keeps storage outside model schema and returns only receipt', async () => {
  const options = mock([{ id: 'job_example', status: 'pending', params: { storage } }]);
  const tool = sdk.youtubeDownloadSubmit({ ...options, storage });
  assert.equal(tool.needsApproval, true);
  assert.ok(!JSON.stringify(await asSchema(tool.inputSchema).jsonSchema).includes('storage'));
  const result = await tool.execute({ video_id: 'dQw4w9WgXcQ', download_type: 'audio' }, context);
  assert.deepEqual(result, { id: 'job_example', status: 'pending', source: 'youtube_download' });
  const payload = JSON.parse(options.calls[0].body);
  assert.equal(options.calls[0].url, 'https://data.flashdata.dev/v1/queries');
  assert.equal(payload.params.output_format, 'm4a');
  assert.equal('video_quality' in payload.params, false);
  assert.deepEqual(payload.params.storage, storage);
});
for (const bad of [
  { download_type: 'audio', video_quality: '<=720' }, { download_type: 'audio', output_format: 'mp4' },
  { start_at: '00:00:10', end_at: '00:00:05' }, { end_at: '13:00:00' },
  { download_type: 'video', audio_quality: '128' }, { storage },
]) test(`invalid download combination: ${JSON.stringify(bad)}`, async () => {
  const options = mock([]);
  await assert.rejects(sdk.youtubeDownloadSubmit({ ...options, storage }).execute({ video_id: 'dQw4w9WgXcQ', ...bad }, context));
  assert.equal(options.calls.length, 0);
});
test('invalid storage errors are redacted', () => {
  assert.throws(() => sdk.youtubeDownloadSubmit({ apiKey: key, storage: { ...storage, endpoint_url: `https://user:${storage.secret_key}@example.com` } }), e => e.code === 'invalid_storage' && !e.message.includes(storage.secret_key));
});
test('pending result reads status only, with no resubmission or storage credentials', async () => {
  const options = mock([{ job: { id: 'job_x', source: 'youtube_download', status: 'processing', params: { storage } } }]);
  assert.deepEqual(await sdk.youtubeDownloadResult(options).execute({ job_id: 'job_x' }, context), { job: { id: 'job_x', source: 'youtube_download', status: 'processing' } });
  assert.equal(options.calls.length, 1);
  assert.equal(options.calls[0].method, 'GET');
});
test('wrong-source download job is rejected before result lookup', async () => {
  const options = mock([{ job: { source: 'google_search', status: 'completed' } }]);
  await assert.rejects(sdk.youtubeDownloadResult(options).execute({ job_id: 'job_x' }, context), { code: 'source_mismatch' });
  assert.equal(options.calls.length, 1);
});
const complete = { job: { id: 'job_x', source: 'youtube_download', status: 'completed' } };
test('completed result uses API-trusted origin and never forwards API Key to storage', async () => {
  const manifest = { files: [{ url: 's3://example-bucket/clip.mp4' }] };
  const options = mock([complete, { result_origin: 'https://results.example.test' }, new Response(null, { status: 302, headers: { location: 'https://results.example.test/job_x.json?signature=test' } }), manifest]);
  assert.deepEqual(await sdk.youtubeDownloadResult(options).execute({ job_id: 'job_x' }, context), { ...complete, output: manifest });
  assert.equal(options.calls.length, 4);
  assert.equal(options.calls[3].headers['X-API-Key'], undefined);
  assert.equal(options.calls[3].headers['X-Request-Id'], undefined);
  assert.equal(options.calls[3].redirect, 'manual');
  assert.ok(options.calls.every(c => c.method === 'GET'));
});
for (const location of ['https://evil.example/a', 'http://results.example.test/a', 'https://user:password@results.example.test/a', 'https://results.example.test/a#fragment']) test(`reject untrusted result URL: ${location}`, async () => {
  const options = mock([complete, { result_origin: 'https://results.example.test' }, new Response(null, { status: 302, headers: { location } })]);
  await assert.rejects(sdk.youtubeDownloadResult(options).execute({ job_id: 'job_x' }, context), { code: 'invalid_result_url' });
  assert.equal(options.calls.length, 3);
});
test('object storage redirect is not followed', async () => {
  const options = mock([complete, { result_origin: 'https://results.example.test' }, new Response(null, { status: 302, headers: { location: 'https://results.example.test/a' } }), new Response(null, { status: 302, headers: { location: 'https://evil.example/a' } })]);
  await assert.rejects(sdk.youtubeDownloadResult(options).execute({ job_id: 'job_x' }, context));
  assert.equal(options.calls.length, 4);
});

const usage = { inputTokens: { total: 1, noCache: 1 }, outputTokens: { total: 1, text: 1 } };
for (const [source, input] of Object.entries(inputs)) test(`${source}: current AI SDK agent loop receives tool result`, async () => {
  const options = mock([responses[source]]);
  const model = new MockLanguageModelV3({ doGenerate: [
    { content: [{ type: 'tool-call', toolCallId: 'call-1', toolName: source, input: JSON.stringify(input) }], finishReason: { unified: 'tool-calls', raw: 'tool_calls' }, usage, warnings: [] },
    { content: [{ type: 'text', text: 'Evidence received.' }], finishReason: { unified: 'stop', raw: 'stop' }, usage, warnings: [] },
  ] });
  const result = await generateText({ model, prompt: 'Use the data tool.', tools: { [source]: sdk.flashdataTools(options)[source] }, stopWhen: isStepCount(2), maxRetries: 0 });
  assert.equal(result.text, 'Evidence received.');
  assert.equal(result.steps.length, 2);
  assert.equal(options.calls.length, 1);
  assert.ok(JSON.stringify(model.doGenerateCalls[1].prompt).includes('tool-result'));
});

test('download SDK approval pauses before any HTTP write', async () => {
  const options = mock([]);
  const model = new MockLanguageModelV3({ doGenerate: {
    content: [{ type: 'tool-call', toolCallId: 'approval-1', toolName: 'download', input: JSON.stringify({ video_id: 'dQw4w9WgXcQ' }) }],
    finishReason: { unified: 'tool-calls', raw: 'tool_calls' }, usage, warnings: [],
  } });
  const result = await generateText({ model, prompt: 'Prepare the download.', tools: { download: sdk.youtubeDownloadSubmit({ ...options, storage }) }, stopWhen: isStepCount(2), maxRetries: 0 });
  assert.equal(options.calls.length, 0);
  assert.ok(JSON.stringify(result.response.messages).includes('tool-approval-request'));
});
test('download result runs inside the current SDK agent loop', async () => {
  const options = mock([complete, { result_origin: 'https://results.example.test' }, new Response(null, { status: 302, headers: { location: 'https://results.example.test/a' } }), { files: [] }]);
  const model = new MockLanguageModelV3({ doGenerate: [
    { content: [{ type: 'tool-call', toolCallId: 'result-1', toolName: 'download_result', input: '{"job_id":"job_x"}' }], finishReason: { unified: 'tool-calls', raw: 'tool_calls' }, usage, warnings: [] },
    { content: [{ type: 'text', text: 'Delivery manifest received.' }], finishReason: { unified: 'stop', raw: 'stop' }, usage, warnings: [] },
  ] });
  const result = await generateText({ model, prompt: 'Read the saved job.', tools: { download_result: sdk.youtubeDownloadResult(options) }, stopWhen: isStepCount(2), maxRetries: 0 });
  assert.equal(result.text, 'Delivery manifest received.');
  assert.equal(options.calls.length, 4);
  assert.ok(options.calls.every(c => c.method === 'GET'));
});
test('missing job status fails as a read, without resubmission', async () => {
  const options = mock([{ job: { source: 'youtube_download' } }]);
  await assert.rejects(sdk.youtubeDownloadStatus(options).execute({ job_id: 'job_x' }, context), { code: 'invalid_job', outcomeUnknown: false });
  assert.equal(options.calls.length, 1);
});
