const path = require('node:path');

const DEFAULT_SPACE_BASE = 'https://huggingface.co/spaces/Wan-AI/Wan2.2-Animate';

function resolveBoolean(value) {
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  WAN_SPACE_BASE: process.env.WAN_SPACE_BASE || DEFAULT_SPACE_BASE,
  WAN_API_TOKEN: process.env.WAN_API_TOKEN || '',
  WAN_DEFAULT_MODEL_ID: process.env.WAN_DEFAULT_MODEL_ID || 'wan2.2-animate-move',
  WAN_DEFAULT_MODEL_QUALITY: process.env.WAN_DEFAULT_MODEL_QUALITY || 'wan-pro',
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  MOCK_MODE: resolveBoolean(process.env.WAN_MOCK_MODE)
};
