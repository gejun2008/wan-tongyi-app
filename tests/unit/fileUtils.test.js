const test = require('node:test');
const assert = require('node:assert');
const { formatFileSize } = require('../../server/utils/file');

test('formatFileSize handles bytes under 1KB', () => {
  assert.strictEqual(formatFileSize(512), '512 B');
});

test('formatFileSize converts to KB and MB', () => {
  assert.strictEqual(formatFileSize(2048), '2.0 KB');
  assert.strictEqual(formatFileSize(1048576), '1.0 MB');
});

test('formatFileSize throws on invalid input', () => {
  assert.throws(() => formatFileSize('abc'), /Expected number of bytes/);
});
