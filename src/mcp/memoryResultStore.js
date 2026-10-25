const { randomUUID } = require('node:crypto');
const { MAX_RESPONSE_BYTES } = require('./dataApiClient');
const { MAX_RESULTS, RESULT_TTL_SECONDS, resultChunk } = require('./resultChunks');

// One bounded store per local server. Nothing is persisted to disk or shared across processes.
function createMemoryResultStore({ clock = Date.now } = {}) {
  const records = new Map();
  function prune() {
    for (const [id, record] of records) {
      if (record.expiresAt <= clock()) records.delete(id);
    }
  }
  return {
    async save(identity, body, scopes, { encoding = 'json', text = JSON.stringify(body) } = {}) {
      if (!['json', 'markdown', 'text'].includes(encoding) || typeof text !== 'string') throw new TypeError('Invalid presentation');
      const json = text;
      if (Buffer.byteLength(json) > MAX_RESPONSE_BYTES) throw new Error('Result too large');
      prune();
      while (records.size >= MAX_RESULTS) records.delete(records.keys().next().value);
      const now = clock();
      const record = { id: `result_${now}_${randomUUID()}`, json, encoding, scopes: [...scopes],
        accountId: identity.accountId, apiKeyId: identity.apiKeyId,
        expiresAt: now + RESULT_TTL_SECONDS * 1000 };
      records.set(record.id, record);
      return resultChunk(record);
    },
    async read(identity, id, offset, limit) {
      prune();
      const record = records.get(id);
      if (!record || record.accountId !== identity.accountId || record.apiKeyId !== identity.apiKeyId
        || !record.scopes.every(scope => identity.scopes.includes(scope))) return null;
      return resultChunk(record, offset, limit);
    },
    clear() { records.clear(); },
  };
}

module.exports = { createMemoryResultStore };
