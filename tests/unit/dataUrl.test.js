const test = require('node:test');
const assert = require('node:assert');
const { decodeDataUrl, bufferToDataUrl } = require('../../server/utils/dataUrl');

const SAMPLE_DATA_URL = 'data:text/plain;base64,SGVsbG8=';

test('decodeDataUrl returns buffer and mime type', () => {
  const { buffer, mimeType } = decodeDataUrl(SAMPLE_DATA_URL);
  assert.strictEqual(mimeType, 'text/plain');
  assert.strictEqual(buffer.toString('utf-8'), 'Hello');
});

test('bufferToDataUrl encodes buffer to data url', () => {
  const buffer = Buffer.from('World', 'utf-8');
  const dataUrl = bufferToDataUrl(buffer, 'text/plain');
  assert.strictEqual(dataUrl, 'data:text/plain;base64,V29ybGQ=');
});

test('decodeDataUrl throws on invalid input', () => {
  assert.throws(() => decodeDataUrl('invalid'), /Invalid data URL/);
});
