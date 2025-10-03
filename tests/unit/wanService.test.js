const test = require('node:test');
const assert = require('node:assert');
const { buildPredictPayload } = require('../../server/services/wanService');

test('buildPredictPayload arranges inputs correctly', () => {
  const ref = { path: '/tmp/ref.png' };
  const video = { path: '/tmp/video.mp4', mime_type: 'video/mp4' };
  const payload = buildPredictPayload(ref, video, { modelId: 'wan2.2-animate-mix', modelQuality: 'wan-std' });
  assert.deepStrictEqual(payload, {
    data: [
      ref,
      { video, subtitles: null },
      'wan2.2-animate-mix',
      'wan-std'
    ]
  });
});
