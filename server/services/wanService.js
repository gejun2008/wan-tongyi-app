const { WAN_SPACE_BASE, WAN_API_TOKEN, WAN_DEFAULT_MODEL_ID, WAN_DEFAULT_MODEL_QUALITY } = require('../config');

const UPLOAD_ENDPOINT = new URL('/api/upload/', WAN_SPACE_BASE);
const PREDICT_ENDPOINT = new URL('/api/predict/', WAN_SPACE_BASE);
const FILE_ENDPOINT = new URL('/api/file/', WAN_SPACE_BASE);

function authHeaders() {
  return WAN_API_TOKEN
    ? { Authorization: `Bearer ${WAN_API_TOKEN}` }
    : {};
}

async function uploadAsset({ buffer, filename, mimeType }) {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('files', blob, filename);
  formData.append('file', blob, filename);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: authHeaders(),
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  if (payload?.length) {
    return payload[0];
  }
  if (payload?.path) {
    return payload;
  }
  throw new Error('Unexpected upload response shape');
}

function buildPredictPayload(referenceFile, videoFile, options = {}) {
  const modelId = options.modelId || WAN_DEFAULT_MODEL_ID;
  const quality = options.modelQuality || WAN_DEFAULT_MODEL_QUALITY;
  return {
    data: [
      referenceFile,
      { video: videoFile, subtitles: null },
      modelId,
      quality
    ]
  };
}

async function requestPrediction(referenceFile, videoFile, options = {}) {
  const payload = buildPredictPayload(referenceFile, videoFile, options);
  const response = await fetch(PREDICT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Prediction failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const result = data[0];
  const statusMessage = data[1] || json?.status || 'Completed';

  if (!result || !result.video) {
    throw new Error('Prediction did not return a video result');
  }

  return { result, statusMessage };
}

async function downloadResult(videoResult) {
  const videoInfo = videoResult.video || videoResult;
  if (!videoInfo.path) {
    throw new Error('Video result is missing a path');
  }
  const fileUrl = new URL(FILE_ENDPOINT);
  fileUrl.searchParams.set('path', videoInfo.path);

  const response = await fetch(fileUrl, {
    method: 'GET',
    headers: authHeaders()
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to download generated video: ${response.status} ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateSwap({ referenceBuffer, referenceName, referenceMime, videoBuffer, videoName, videoMime, options }) {
  const referenceUpload = await uploadAsset({
    buffer: referenceBuffer,
    filename: referenceName,
    mimeType: referenceMime
  });
  const videoUpload = await uploadAsset({
    buffer: videoBuffer,
    filename: videoName,
    mimeType: videoMime
  });

  const { result, statusMessage } = await requestPrediction(referenceUpload, videoUpload, options);
  const videoBinary = await downloadResult(result);
  return {
    buffer: videoBinary,
    contentType: result?.video?.mime_type || 'video/mp4',
    statusMessage
  };
}

module.exports = {
  generateSwap,
  buildPredictPayload
};
