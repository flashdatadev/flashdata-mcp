const { test } = require('node:test');
const assert = require('node:assert/strict');
const { npmReadme } = require('../scripts/npm-readme');

test('npm links preserve capability, other query fields and fragments without changing external links', () => {
  const link = 'https://flashdata.dev/signup?utm_source=github&utm_content=youtube_download-task&lang=en#start';
  const external = 'https://example.org/?utm_source=github';
  assert.equal(npmReadme(`[key](${link}) [external](${external})`), `[key](${link.replace('utm_source=github', 'utm_source=npm')}) [external](${external})`);
});
