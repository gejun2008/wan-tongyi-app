const form = document.getElementById('generateForm');
const refInput = document.getElementById('refImageInput');
const videoInput = document.getElementById('sourceVideoInput');
const refPreview = document.getElementById('refPreview');
const videoPreview = document.getElementById('videoPreview');
const statusMessage = document.getElementById('statusMessage');
const progressIndicator = document.getElementById('progressIndicator');
const resultVideo = document.getElementById('resultVideo');
const downloadButton = document.getElementById('downloadButton');
const modelMode = document.getElementById('modelMode');
const modelQuality = document.getElementById('modelQuality');

let activeObjectUrl = null;

function setStatus(message) {
  statusMessage.textContent = message;
}

function toggleProgress(visible) {
  progressIndicator.classList.toggle('hidden', !visible);
}

function showPreview(element, file) {
  if (!file) {
    element.classList.add('hidden');
    element.removeAttribute('src');
    return;
  }
  const url = URL.createObjectURL(file);
  element.src = url;
  element.classList.remove('hidden');
  element.dataset.previewUrl = url;
}

refInput.addEventListener('change', () => {
  const [file] = refInput.files;
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      refPreview.src = reader.result;
      refPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    refPreview.classList.add('hidden');
  }
});

videoInput.addEventListener('change', () => {
  const [file] = videoInput.files;
  if (file) {
    showPreview(videoPreview, file);
  } else {
    videoPreview.classList.add('hidden');
    videoPreview.removeAttribute('src');
  }
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function revokeActiveObjectUrl() {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

function base64ToBlob(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

async function submitForm(event) {
  event.preventDefault();
  const [refFile] = refInput.files;
  const [videoFile] = videoInput.files;
  if (!refFile || !videoFile) {
    setStatus('请先选择面孔图片和源视频。');
    return;
  }

  revokeActiveObjectUrl();
  toggleProgress(true);
  setStatus('正在上传素材并启动模型...');
  downloadButton.classList.add('hidden');
  resultVideo.classList.add('hidden');

  try {
    const [refDataUrl, videoDataUrl] = await Promise.all([
      readFileAsDataUrl(refFile),
      readFileAsDataUrl(videoFile)
    ]);

    const payload = {
      refImage: {
        name: refFile.name,
        type: refFile.type,
        size: refFile.size,
        dataUrl: refDataUrl
      },
      sourceVideo: {
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size,
        dataUrl: videoDataUrl
      },
      options: {
        modelId: modelMode.value,
        modelQuality: modelQuality.value
      }
    };

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`服务器返回错误：${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    const videoBlob = base64ToBlob(result.video.data, result.video.contentType);
    const objectUrl = URL.createObjectURL(videoBlob);
    activeObjectUrl = objectUrl;
    resultVideo.src = objectUrl;
    resultVideo.classList.remove('hidden');
    downloadButton.href = objectUrl;
    downloadButton.classList.remove('hidden');
    setStatus(result.message || '生成完成！');
  } catch (error) {
    console.error(error);
    setStatus(error.message || '生成失败，请稍后重试。');
  } finally {
    toggleProgress(false);
  }
}

form.addEventListener('submit', submitForm);

window.addEventListener('beforeunload', () => {
  revokeActiveObjectUrl();
  if (refPreview.dataset.previewUrl) {
    URL.revokeObjectURL(refPreview.dataset.previewUrl);
  }
  if (videoPreview.dataset.previewUrl) {
    URL.revokeObjectURL(videoPreview.dataset.previewUrl);
  }
});
