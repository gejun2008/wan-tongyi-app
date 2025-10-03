const assert = require('node:assert');

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') {
    throw new TypeError('Expected data URL string');
  }
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  assert(match, 'Invalid data URL format');
  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, 'base64');
  return { mimeType, buffer };
}

function bufferToDataUrl(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Expected buffer');
  }
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

module.exports = {
  decodeDataUrl,
  bufferToDataUrl
};
