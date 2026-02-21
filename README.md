# Cover Generator

> AI-powered video cover batch generator — from raw video to polished thumbnails, fully automated.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-green?logo=sqlite)](https://sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What it does

Cover Generator takes a video file (or raw script) and automatically produces ready-to-publish thumbnails across multiple visual templates — in parallel, with AI quality review and auto-correction built in.

**The full pipeline:**

```
Video file / Script / Title
        │
        ▼
  [Whisper] Extract transcript
        │
        ▼
  [gemini-flash] Generate viral title
        │
        ├─── Template A ──┐
        ├─── Template B ──┤
        ├─── Template C ──┤  (up to 5 parallel)
        │                 │
        ▼                 ▼
  Phase 1: Element adaptation   (text, image prompts, background)
  Phase 2: Image generation     (gemini-image-pro)
  Phase 3: Quality review       (auto-retry up to 3×)
        │
        ▼
  ✓ Final covers — download or use directly
```

---

## Key Features

| Feature | Details |
|---|---|
| **Batch multi-template** | Generate covers for up to 5 templates simultaneously |
| **Video → script** | Auto audio extraction + Whisper transcription |
| **Viral title generation** | Platform-aware (Bilibili / YouTube) title suggestions |
| **Two-phase generation** | Element adaptation first, then image generation — more consistent style |
| **Style transfer** | Upload a reference image or describe the style in text |
| **Self-healing quality loop** | AI reviewer detects issues and retries with corrective feedback (max 3×) |
| **Asset library** | Manage character / logo assets; auto-injected into covers |
| **Real-time progress** | Live log streaming per template during generation |
| **Project history** | All generation runs saved and browsable |

---

## Quick Start

**Prerequisites:** Node.js 18+, ffmpeg, Whisper (for video input)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API credentials

# 3. Create upload directories
mkdir -p public/uploads/{templates,covers,frames}

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Configuration

```env
# .env.local

AI_BASE_URL=https://your-openai-compatible-api/v1
AI_API_KEY=your-api-key

# Models (defaults shown — swap for any compatible model)
ANALYSIS_MODEL=gemini-3-flash-preview
IMAGE_GEN_MODEL=gemini-3-pro-image-preview
VIDEO_SCRIPT_MODEL=gemini-3-flash-preview
```

Any OpenAI-compatible API endpoint works (Gemini, Qwen, etc.).

---

## Usage

```
① Templates  →  Upload cover template images  →  AI analyzes element structure
② Resources  →  Upload character / logo assets  →  Organize by category
③ Generate:
     Step 1  Paste script or upload video  +  choose output ratio
     Step 2  Select templates (multi-select)
     Step 3  Choose resource categories  +  generation options
     Step 4  Optional: style reference image or text description
     → Start  →  Watch live progress  →  Download covers
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router + TypeScript + React 19 |
| Styling | Tailwind CSS 4 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| AI API | OpenAI-compatible (Gemini / Qwen / etc.) |
| Transcription | Whisper |
| Video processing | ffmpeg |

---

## Project Structure

```
app/
├── page.tsx              Dashboard
├── generate/             Cover generation wizard
├── templates/            Template library
├── resources/            Asset library
├── settings/             Configuration
└── api/                  API routes

lib/
├── ai.ts                 All AI calls (analysis / generation / review)
└── db.ts                 SQLite schema + initialization

public/uploads/           File storage (gitignored)
```

---

## Why self-hosted?

- No per-cover SaaS fees
- Your video content and scripts never leave your infrastructure
- Full control over models — swap to any OpenAI-compatible API
- Extend templates and workflows without vendor lock-in

---

## License

MIT
