const test = require('node:test');
const assert = require('node:assert');
const { bufferToDataUrl } = require('../../server/utils/dataUrl');
const { createServer } = require('../../server/index.js');

async function startServer() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

test('end-to-end generation flow (mock mode)', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const indexResponse = await fetch(baseUrl);
  assert.strictEqual(indexResponse.status, 200);
  const html = await indexResponse.text();
  assert.match(html, /MomentSwap/);

  const imageBuffer = Buffer.from('fake image data for testing');
  const videoBuffer = Buffer.from('fake video data for testing');

  const payload = {
    refImage: {
      name: 'test-face.png',
      type: 'image/png',
      dataUrl: bufferToDataUrl(imageBuffer, 'image/png')
    },
    sourceVideo: {
      name: 'test-video.mp4',
      type: 'video/mp4',
      dataUrl: bufferToDataUrl(videoBuffer, 'video/mp4')
    },
    options: {
      modelId: 'wan2.2-animate-move',
      modelQuality: 'wan-pro'
    }
  };

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(response.status, 200);
  const result = await response.json();
  assert.strictEqual(result.status, 'success');
  assert.ok(result.video?.data);
  assert.ok(result.video?.contentType.includes('video'));
});
