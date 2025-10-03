const http = require('node:http');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');
const { PORT, PUBLIC_DIR, MOCK_MODE } = require('./config');
const { decodeDataUrl } = require('./utils/dataUrl');
const { formatFileSize } = require('./utils/file');
const { generateSwap } = require('./services/wanService');

const STATIC_FILES = new Map();

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

async function serveStaticFile(filePath, res) {
  try {
    let content = STATIC_FILES.get(filePath);
    if (!content) {
      content = await fsp.readFile(filePath);
      STATIC_FILES.set(filePath, content);
    }
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyString = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(bodyString || '{}');
}

const MOCK_VIDEO_BASE64 = Buffer.from('MomentSwap mock video placeholder').toString('base64');

async function handleGenerate(req, res) {
  try {
    const body = await readJsonBody(req);
    const { refImage, sourceVideo, options = {} } = body;
    if (!refImage?.dataUrl || !sourceVideo?.dataUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing media payloads' }));
      return;
    }

    const reference = decodeDataUrl(refImage.dataUrl);
    const video = decodeDataUrl(sourceVideo.dataUrl);

    if (MOCK_MODE) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'Mock generation completed',
        video: {
          contentType: 'video/mp4',
          data: MOCK_VIDEO_BASE64
        }
      }));
      return;
    }

    const swapResult = await generateSwap({
      referenceBuffer: reference.buffer,
      referenceName: refImage.name || 'reference.png',
      referenceMime: refImage.type || reference.mimeType,
      videoBuffer: video.buffer,
      videoName: sourceVideo.name || 'source.mp4',
      videoMime: sourceVideo.type || video.mimeType,
      options
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: swapResult.statusMessage,
      video: {
        contentType: swapResult.contentType,
        data: swapResult.buffer.toString('base64')
      }
    }));
  } catch (error) {
    console.error('Generation failed', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Generation failed' }));
  }
}

function createServer() {
  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html')) {
      const filePath = path.join(PUBLIC_DIR, 'index.html');
      await serveStaticFile(filePath, res);
      return;
    }

    if (req.method === 'GET') {
      const filePath = path.join(PUBLIC_DIR, requestUrl.pathname);
      if (filePath.startsWith(PUBLIC_DIR)) {
        await serveStaticFile(filePath, res);
        return;
      }
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/generate') {
      await handleGenerate(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}

function startServer(port = PORT) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`MomentSwap server listening on http://localhost:${port}`);
  });
  return server;
}

module.exports = {
  createServer,
  startServer,
  formatFileSize
};
