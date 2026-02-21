**中文** | [English](./README.md)

<div align="center">

<img src="public/logo-text.png" width="400" />

# Cover Generator — 封面生成器

**YOUR VIDEO DESERVES A BETTER COVER**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()
[![AI](https://img.shields.io/badge/AI-Gemini-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

[功能特性](#-功能特性) · [工作原理](#-工作原理) · [快速开始](#-快速开始) · [English](./README.md)

</div>

---

**封面生成器**是面向视频创作者的 *AI 驱动封面自动生成工具*。上传视频，AI 自动转录、生成爆款标题、输出精美封面——全程无需设计技能。

## ✨ 功能特性

- **视频一键生成封面** — 上传视频，Whisper 自动转录，AI 生成标题，端到端全自动出图。
- **AI 自动审核重试** — 每张封面经 AI 质量审核，不达标自动带反馈重试，最多 3 次。
- **模板风格学习** — 上传一次参考封面，AI 学习你的风格，后续永久复用。
- **智能素材库** — 存储 Logo、人物、背景素材，AI 自动为每个视频匹配最合适的资源。
- **多模板并行生成** — 最多同时跑 5 套模板，对比挑选最佳结果。
- **多比例输出** — 支持 16:9、4:3、1:1、9:16 等多种比例，适配各大平台。

## 🖼 工作原理

封面生成器分两个阶段：**模板建立**（一次性）和**封面生成**（每次出图）。

### 第一阶段 — 模板建立

<div align="center">
<img src="public/illus-pipeline.zh.png" width="600" />
</div>

1. **上传参考封面** — 任意一张你喜欢的封面图
2. **AI 元素拆解** — 模型分析图片，将其拆解为泛化元素：`背景`、`主标题`、`副标题`、`图片`、`Logo`、`装饰`——每个元素记录位置、风格约束和内容规则（只保留结构规律，不保留具体内容）
3. **模板入库** — 布局蓝图存入数据库，可无限复用于任意新视频

### 第二阶段 — 封面生成

<div align="center">
<img src="public/illus-batch.zh.png" width="600" />
</div>

4. **上传视频** — ffmpeg 提取音轨，Whisper 转录为文案
5. **爆款标题生成** — AI 根据文案生成平台优化标题
6. **资源库智能匹配** — AI 扫描你上传的素材（Logo、人物、插图），自动为每个元素挑选最合适的资源
7. **视频帧提取** — 针对图片类元素，ffmpeg 采样视频帧，视觉模型筛选最相关的画面
8. **元素内容适配** — 根据标题、文案和风格参考，为每个模板元素填充具体内容
9. **封面图生成** — 图像模型按模板布局结构重新制作封面

<div align="center">
<img src="public/illus-review.zh.png" width="600" />
</div>

10. **AI 质量审核** — 视觉模型检查文字截断、布局问题、构图弱点；不通过则附带具体反馈自动重新生成，最多 **3 次自动重试**
11. **完成** — 最多 5 套模板并行处理，挑选最佳结果

## 🚀 快速开始

```bash
npm install
cp .env.example .env.local   # 填写 AI_BASE_URL 和 AI_API_KEY
mkdir -p public/uploads/{templates,covers,frames}
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 🛠 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 16 + TypeScript + React 19 |
| 样式 | Tailwind CSS 4 |
| 数据库 | SQLite（better-sqlite3，WAL 模式） |
| AI 模型 | Gemini flash + pro-image（OpenAI 兼容 API） |
| 语音转录 | Whisper |
| 视频处理 | ffmpeg |

## License

MIT
