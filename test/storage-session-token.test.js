const { test } = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv');
const { normalizeStorage } = require('../src/download/youtubeDownloadOptions');
const { customerStorageSchema } = require('../src/mcp/downloadSchema');
const { listTools } = require('../src/mcp/toolCatalog');

const destinations = {
  s3: { region: 'us-east-1' },
  s3_compatible: { endpoint_url: 'https://storage.example.com' },
  oss: { endpoint_url: 'https://oss-cn-hangzhou.aliyuncs.com' },
  cos: { region: 'ap-guangzhou', storage_url: 'test-bucket-1250000000' },
  bos: { region: 'bj' },
  tos: { region: 'cn-beijing' },
};
const storage = (storage_type) => ({ storage_type, storage_url: 'test-bucket',
  access_key: 'fixture-temporary-access', secret_key: 'fixture-temporary-secret',
  session_token: 'fixture-session-token', ...destinations[storage_type] });

for (const provider of Object.keys(destinations)) test(`${provider}: discovery and normalization preserve STS credentials`, () => {
  const input = storage(provider);
  assert.deepEqual(normalizeStorage(input, 'params'), input);
  assert.equal(new Ajv({ strict: true }).compile(customerStorageSchema)(input), true);
  const schema = listTools(['youtube_download']).find(tool => tool.name === 'youtube_download').inputSchema;
  const validate = new Ajv({ strict: true }).compile(schema);
  assert.equal(validate({ video_id: 'dQw4w9WgXcQ', storage: input }), true);
  const longTerm = { ...input };
  delete longTerm.session_token;
  assert.deepEqual(normalizeStorage(longTerm, 'params'), longTerm);
});

test('invalid tokens and mismatched providers fail without exposing credential values', () => {
  for (const token of ['', null, 1, {}, 'secret value', 'secret\nvalue', 'secret\0value', 'secret\x7fvalue', 'x'.repeat(16385)]) {
    assert.throws(() => normalizeStorage({ ...storage('s3'), session_token: token }, 'params'), error => {
      assert.ok(!String(error).includes('fixture-temporary'));
      if (typeof token === 'string' && token.length > 6) assert.ok(!String(error).includes(token));
      return true;
    });
  }
  for (const provider of ['azure', 'gcs']) {
    assert.throws(() => normalizeStorage({ storage_type: provider, storage_url: 'test-bucket', session_token: 'private-token' }, 'params'), /Unsupported/);
  }
  for (const key of ['access_key', 'secret_key']) {
    const value = storage('s3');
    delete value[key];
    assert.throws(() => normalizeStorage(value, 'params'), /matching temporary/);
  }
});
