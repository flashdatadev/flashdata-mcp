const RESULT_TTL_SECONDS = 600;
const CHUNK_CHARACTERS = 16000;
const MAX_RESULTS = 4;
const ACCOUNT_READ_TOOLS = Object.freeze(['get_balance', 'get_pricing', 'get_limits']);

function resultChunk(record, offset = 0, limit = CHUNK_CHARACTERS) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > record.json.length
    || !Number.isSafeInteger(limit) || limit < 1 || limit > CHUNK_CHARACTERS) return null;
  const splitsPair = position => position > 0 && position < record.json.length
    && /[\uD800-\uDBFF]/.test(record.json[position - 1]) && /[\uDC00-\uDFFF]/.test(record.json[position]);
  if (splitsPair(offset)) return null;
  let end = Math.min(record.json.length, offset + limit);
  if (splitsPair(end)) end -= 1;
  if (end === offset && offset < record.json.length) return null;
  return {
    result_id: record.id,
    encoding: record.encoding || 'json',
    chunk: record.json.slice(offset, end),
    offset,
    next_offset: end < record.json.length ? end : null,
    total_characters: record.json.length,
    expires_at: new Date(record.expiresAt).toISOString(),
  };
}

module.exports = { ACCOUNT_READ_TOOLS, CHUNK_CHARACTERS, MAX_RESULTS, RESULT_TTL_SECONDS, resultChunk };
