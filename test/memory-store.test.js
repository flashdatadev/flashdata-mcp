const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMemoryResultStore } = require('../src/mcp/memoryResultStore');
const { RESULT_TTL_SECONDS } = require('../src/mcp/resultChunks');

test('chunks never split a Unicode surrogate pair, even at the default boundary', async () => {
  const store = createMemoryResultStore();
  const identity = { accountId: 'a', apiKeyId: 'k', scopes: [] };
  const text = 'x'.repeat(15999) + '😀end';
  const first = await store.save(identity, {}, [], { encoding: 'markdown', text });
  assert.equal(first.next_offset, 15999);
  assert.equal(first.chunk, 'x'.repeat(15999));
  const last = await store.read(identity, first.result_id, first.next_offset);
  assert.equal(last.chunk, '😀end');
  assert.equal(last.next_offset, null);
  assert.equal(await store.read(identity, first.result_id, 16000), null);
  assert.equal(await store.read(identity, first.result_id, 15999, 1), null);
});

test('Unicode chunks reassemble JSON without rerunning a query; invalid offsets are rejected', async () => {
  const store = createMemoryResultStore();
  const identity = { accountId: 'a', apiKeyId: 'k', scopes: ['youtube_transcript'] };
  const body = { text: '字幕😀'.repeat(20000), usage: { credits: 0.01 } };
  let chunk = await store.save(identity, body, ['youtube_transcript']);
  const id = chunk.result_id;
  let json = chunk.chunk;
  while (chunk.next_offset !== null) {
    chunk = await store.read(identity, id, chunk.next_offset, 16000);
    json += chunk.chunk;
  }
  assert.deepEqual(JSON.parse(json), body);
  assert.equal(await store.read(identity, id, -1, 10), null);
  assert.equal(await store.read(identity, id, 0, 16001), null);
  assert.equal(await store.read(identity, id, json.length + 1, 10), null);
  assert.equal(await store.read({ ...identity, apiKeyId: 'other' }, id), null);
  assert.equal(await store.read({ ...identity, scopes: [] }, id), null);
});

test('cache is bounded, entries expire independently, and shutdown clears them', async () => {
  let now = 1800000000000;
  const store = createMemoryResultStore({ clock: () => now });
  const identity = { accountId: 'a', apiKeyId: 'k', scopes: ['google_search'] };
  const records = [];
  for (let i = 0; i < 5; i++) {
    records.push(await store.save(identity, { i }, ['google_search']));
    now += 1000;
  }
  assert.equal(await store.read(identity, records[0].result_id), null);
  assert.ok(await store.read(identity, records[1].result_id));
  now = 1800000001000 + RESULT_TTL_SECONDS * 1000;
  assert.equal(await store.read(identity, records[1].result_id), null);
  assert.ok(await store.read(identity, records[4].result_id));
  await assert.rejects(store.save(identity, { text: 'x'.repeat(4 * 1024 * 1024) }, []), /too large/);
  store.clear();
  assert.equal(await store.read(identity, records[4].result_id), null);
});
