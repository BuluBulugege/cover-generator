[中文](./README.zh.md) | **English**

<div align="center">

<img src="public/logo-text.png" width="400" />

# Cover Generator

**YOUR VIDEO DESERVES A BETTER COVER**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()
[![AI](https://img.shields.io/badge/AI-Gemini-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

[Features](#-features) · [How It Works](#-how-it-works) · [Quick Start](#-quick-start) · [中文](./README.zh.md)

</div>

---

**Cover Generator** is an *AI-powered thumbnail generation tool* for video creators. Upload your video — the AI transcribes it, writes a viral title, and generates a polished cover image in minutes. No design skills required.

## ✨ Features

- **Video-to-cover automation** — Upload a video; Whisper transcribes it, AI writes the title, cover is generated end-to-end.
- **Self-correcting AI review loop** — Generated covers are auto-reviewed and regenerated up to 3 times until they pass quality checks.
- **Template learning** — Upload a reference cover once; the AI learns your style and reuses it forever.
- **Smart asset library** — Store logos, characters, and backgrounds; AI picks the best match for each video automatically.
- **Parallel batch generation** — Run up to 5 templates simultaneously and pick your favorite.
- **Multi-ratio support** — Output in 16:9, 4:3, 1:1, 9:16, and more — ready for any platform.

## 🖼 How It Works

Cover Generator works in two phases: **Template Setup** (once) and **Cover Generation** (per video).

### Phase 1 — Template Setup

<div align="center">
<img src="public/illus-pipeline.en.png" width="600" />
</div>

1. **Upload a reference cover** — any existing thumbnail you like
2. **AI element extraction** — the model analyzes the image and breaks it into generalized elements: `background`, `main_title`, `subtitle`, `image`, `logo`, `decoration` — each with position, style constraints, and content rules (no specific content, only structural patterns)
3. **Template saved** — the layout blueprint is stored in the database, ready to be applied to any future video

### Phase 2 — Cover Generation

<div align="center">
<img src="public/illus-batch.en.png" width="600" />
</div>

4. **Upload video** — ffmpeg extracts the audio track; Whisper transcribes it into a script
5. **Viral title generation** — AI writes a platform-optimized title from the transcript
6. **Resource library search** — AI scans your uploaded assets (logos, characters, illustrations) and automatically selects the ones that match each element's needs
7. **Video frame extraction** — for image elements, ffmpeg samples frames and the vision model picks the most visually relevant ones
8. **Element adaptation** — each template element is filled with actual content derived from the title, script, and style reference
9. **Cover generation** — the image model reconstructs the template's layout structure with the new content

<div align="center">
<img src="public/illus-review.en.png" width="600" />
</div>

10. **AI quality review** — a vision model inspects the output for truncated text, layout issues, and weak composition; if it fails, the system regenerates with specific feedback — up to **3 automatic retries**
11. **Done** — up to 5 templates processed in parallel; pick the best result

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local   # fill in AI_BASE_URL and AI_API_KEY
mkdir -p public/uploads/{templates,covers,frames}
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + TypeScript + React 19 |
| Styling | Tailwind CSS 4 |
| Database | SQLite (better-sqlite3, WAL mode) |
| AI Models | Gemini flash + pro-image (OpenAI-compatible API) |
| Transcription | Whisper |
| Video processing | ffmpeg |

## License

MIT
