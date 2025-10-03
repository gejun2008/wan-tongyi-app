# MomentSwap

MomentSwap 是一个面向概念验证的最小可行产品（MVP），用于演示 [Wan-AI/Wan2.2-Animate](https://huggingface.co/spaces/Wan-AI/Wan2.2-Animate) 模型在短视频人物面部替换方面的能力。应用提供上传、进度反馈、结果预览与下载等核心体验。

## 功能特性

- 📤 上传目标面孔图片与源视频并即时预览。
- 🚀 一键触发 Hugging Face 推理流程，并显示处理状态。
- 🎬 在页面中播放最终生成的视频并支持下载。
- 🔐 通过后端代理隐藏 API 密钥，避免前端泄露。
- 🧪 覆盖单元测试与端到端（E2E）测试，确保基础逻辑可靠。

## 快速开始

> **注意**：默认情况下应用运行在 *Mock 模式*，用于本地开发与自动化测试。
> 若要调用真实的 Wan-AI 模型，请提供有效的 Hugging Face Token。

```bash
# 启动开发服务器（默认端口 3000）
npm run dev

# 运行单元测试
npm test

# 运行端到端测试（自动启用 Mock 模式）
npm run test:e2e

# 运行全部测试套件
npm run test:all
```

访问 <http://localhost:3000> 即可体验。

## 配置

通过环境变量定制运行时行为：

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | HTTP 服务监听端口 | `3000` |
| `WAN_SPACE_BASE` | Hugging Face Space API 基础地址 | `https://huggingface.co/spaces/Wan-AI/Wan2.2-Animate` |
| `WAN_API_TOKEN` | Hugging Face 访问令牌（若 Space 为私有或需更高额度） | 空 |
| `WAN_DEFAULT_MODEL_ID` | 默认模式（Move / Mix） | `wan2.2-animate-move` |
| `WAN_DEFAULT_MODEL_QUALITY` | 默认推理质量（Pro / Standard） | `wan-pro` |
| `WAN_MOCK_MODE` | 开启后跳过真实推理并返回占位视频 | `false` |

当禁用 `WAN_MOCK_MODE` 时，请确保网络可访问 Hugging Face 并提供合规的 Token。后端会将上传文件转换为临时数据并调用 `/api/upload/` 与 `/api/predict/` 接口，随后下载生成视频返回给前端。

## 测试策略

- **单元测试**：基于 Node.js 原生 `node:test` 框架，覆盖数据 URL 解析、文件大小格式化以及推理请求负载构造等关键工具函数。
- **端到端测试**：启动实际的 HTTP 服务器（启用 Mock 模式），使用内联的媒体占位符数据模拟用户流程，验证从首页加载到生成结果的完整链路。

## 目录结构

```
├── public/              # 前端静态资源（HTML、JS、Tailwind CDN）
├── server/              # 轻量 Node.js 后端与工具方法
├── tests/               # 单元与端到端测试（node:test）
├── server.js            # 应用入口
└── package.json
```

## 开发提示

- 前端通过 FileReader 将媒体文件编码为 Data URL，再由后端解码并调用模型 API。
- 后端默认使用内存缓存静态文件，减轻重复文件读取的成本。
- Mock 模式返回占位视频数据，方便在无外网或无 Token 环境下验证流程。

欢迎在真实推理环境中扩展体验，例如增加任务队列、历史记录或更丰富的错误处理。期待你的创意！
