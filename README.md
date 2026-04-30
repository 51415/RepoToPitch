<div align="center">

<img src="public/icons/main logo.png" width="200" alt="RepoToPitch" />

# RepoToPitch — Standalone Desktop Edition

### Code to Clarity. Instantly.

**The ultimate local-first deconstruction engine. Turn a codebase — even one spread across multiple repositories — into a professional Product Requirements Document and investor pitch deck. Runs natively on your machine with Tauri 2.0 and Ollama. Zero cloud. Zero tracking. No API keys. No one reads your code but you.**

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open_Source-❤️-red)](CONTRIBUTING.md)
[![Version](https://img.shields.io/badge/Version-1.0.1-blue)](CHANGELOG.md)
[![Ollama](https://img.shields.io/badge/Runs_on-Ollama-indigo)](https://ollama.ai)
[![Tauri](https://img.shields.io/badge/Built_with-Tauri_2.0-blue)](https://tauri.app)

</div>

---

## The problem this solves

Most technical founders build first and document never.

You have a working product — maybe across 5, 7, 10 repos — but no clean problem statement, no user personas, no roadmap that an investor or a new hire could read. Writing that from scratch is a week of work you keep postponing.

RepoToPitch reads your code structure, guides you through strategic context, and generates:
- A **per-repo Technical Summary** for each service or frontend
- A **master PRD** that describes the whole product as one coherent story
- A **10-artifact Synthesis Suite** including GTM, Architecture, and Risk reports
- A **Pitch Deck** with speaker notes, ready for founder review or board presentations.

It uses whatever local LLM you have running in Ollama — `llama3.2`, `qwen2.5`, `mistral`, your choice. Your code never leaves your machine.

---

## Who this is for

- **Technical founders** who built a hobby project and want to commercialise it
- **CTOs and solo engineers** preparing for a funding conversation
- **Startup advisors** who need to understand a client's product fast
- **Anyone who has ever been asked "so what does your product actually do?" and struggled to answer**

---
# Pricing Section

## Editions & Pricing

RepoToPitch is open source. The source code is free and always will be.

The paid editions exist for one reason: most consultants and CTOs do not want to spend an afternoon installing Rust, configuring a build environment, and debugging compiler errors before they can run a tool. The Desktop and Pro editions are pre-built, tested installers that work immediately.

| | Community | Desktop | Pro |
|---|---|---|---|
| Full feature set | ✓ | ✓ | ✓ |
| Pre-built Windows installer | — | ✓ | ✓ |
| Custom prompts per document | — | — | ✓ |
| White-label branded outputs | — | — | ✓ |
| 30-min onboarding call | — | — | ✓ |
| 90-day direct support | — | — | ✓ |
| **Price** | Free | £196.99 | £496.99 * |

*\* Founding Member pricing — first 20 licences only. Moves to £696.99 after that.*

→ [View full pricing and buy](PRICING.md)

---

## Quick Start (User)

1. **Download the latest release**: Grab the `.exe` (Windows) from the [Releases](https://github.com/anuraagjain/repo-to-pitch/releases) page.
2. **Install & Run**: Launch the application.
3. **Connect Ollama**: Ensure Ollama is running locally (`ollama serve`).
4. **Analyze**: Start adding your repositories.

## Quick Start (Developer)

```bash
# 1. Clone
git clone https://github.com/anuraagjain/repo-to-pitch.git
cd repo-to-pitch

# 2. Install deps
npm install

# 3. Start Ollama (in a separate terminal)
ollama serve

# 4. Pull a model
ollama pull llama3.2        # recommended — fast, good quality

# 5. Run in Dev Mode (requires Rust)
npm run tauri dev
```

---

## Getting your repo tree

In the **Desktop Edition**, you can simply use the native folder picker to select your repository. The app will automatically scan and generate the tree for you, respecting `.gitignore` rules.

For the **Web Edition** or manual analysis, you can still paste tree output:

```bash
# Mac / Linux (best)
tree -L 3 --gitignore

# Windows
tree /F
```

---

## Recommended models

| Model | Size | Best for |
|-------|------|----------|
| `gemma4:e4b` | 4 GB | Balanced performance, fast iteration |
| `gemma4:26b` | 16 GB | High-performance reasoning and synthesis |
| `gemma4:31b` | 19 GB | Most capable dense model for complex PRDs |
| `qwen2.5-coder:7b` | 4 GB | Dedicated repo analysis and code-to-product mapping |

All models work. `gemma4:e4b` is the recommended daily driver, while `qwen2.5-coder` excels at Step 2 (Repo Analysis).

---

## Multi-repo support

RepoToPitch was built specifically for products spread across multiple repos. You can add as many repos as you have — each tagged as `Frontend` or `API` — and mark which repos call which. The master PRD step synthesises all of them into one product story with cross-repo user flows.

---

---

## Architecture & Logic

RepoToPitch is built on a **Native Desktop / Local-First AI** architecture:
- **Tauri 2.0 Core**: High-performance Rust backend providing secure filesystem access and native window management.
- **Ollama Fallback**: Automatically detects and adapts to your local LLM configuration.
- **Hierarchical Synthesis Engine**: Breaks large artifacts (like pitch decks) into atomic sub-tasks to ensure stability on local models.
- **Custom Prompts**: Full control over the 'brain' of the app—edit templates directly to tailor output style and depth.
- **Snow Premium UI**: A high-fidelity, light-mode interface designed for deep focus and executive clarity.
- **Batch Synthesis**: Generate all project artifacts (PRD, GTM, Arch) with a single click.

See [repo_map.md](docs/repo_map.md) for a detailed codebase walkthrough.

---

## Requirements

- **OS**: Windows (tested extensively). Supports macOS and Linux via Tauri (community-maintained, untested).
- **Ollama**: Running locally (`ollama serve`). 8GB+ RAM recommended.
- **Rust (Dev only)**: Required for building from source.

---

## Exports

| Category | Output | Formats |
|----------|--------|---------|
| **PRDs** | Per-repo & Master | `.md`, `.docx` (Word), `.pdf` |
| **Pitch** | Investor Deck | `.pptx` (PowerPoint), `.json`, `.pdf` |
| **Bundles** | All project docs | Single `.md` export |

---

## Workflow (6 steps)

| Step | What you do |
|------|-------------|
| **1. Settings** | Connect to Ollama, pick model |
| **2. Repos** | Add repos via path or folder picker. Tag roles (FE/API). |
| **3. Analyze** | Per-repo breakdown and deep-dives into modules. |
| **4. Founder Q&A** | High-level strategy and vision session. |
| **5. Synthesis** | Review Repo PRDs and generate the Master PRD. |
| **6. Pitch Deck** | View and download the high-fidelity investor slides. |

Everything auto-saves to native storage via Tauri's filesystem bridge.

---

## Technical Stack

- **Framework**: Tauri 2.0 (Native Desktop)
- **Backend**: Rust
- **Frontend**: React 18 + Vite
- **State**: Zustand (Persisted to Native Storage)
- **UI**: Vanilla CSS (Snow Premium Aesthetic)
- **AI**: Ollama API (Local-Only)
- **Exports**: `docx`, `jspdf`, `pptxgenjs`

---

## Configuration & Deployment

### Ollama on a remote machine / different port
Change the host in **Settings** inside the app. For CORS:
```bash
OLLAMA_ORIGINS="*" ollama serve
```

### Production build (Desktop)
```bash
npm run build        # Build frontend
npm run tauri build  # Build native EXE (requires Rust/WiX)
```

> [!NOTE]
> The application uses a custom internal port mapping on **4029** for the development environment.


---

## Contributing 🌍

RepoToPitch is an open-source project. We believe that local-first AI is the future of privacy-preserving developer tools, and we welcome contributions from the community.

Issues and PRs are highly encouraged. We are specifically looking for:
- **Platform Testers**: Validating path handling and shell commands on macOS and Linux.
- **Export Themes**: New styling templates for the Pitch Deck and Markdown exports.
- **Model Tuning**: Optimization of prompts for specific local LLMs (Llama 3, Qwen, etc.).

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our full contribution guidelines.

If this tool helps you successfully raise funding or scale your product, please share your story with us!

---

## About

Built by **[Anuraag Jain](https://www.growthvariable.com)** — Fractional CTO, Chief AI Officer, and founder of [Growth Variable](https://www.growthvariable.com).

29 years in technology, including the engineering foundations behind Betfair's £1.6B IPO and The Hut Group's £5.4B IPO. I've spent the last few years helping founders and executives use AI as a genuine decision partner — not a novelty.

This tool came from watching the same pattern repeat: a technical founder with a working product, no documentation, and a funding conversation coming up. I built it to solve that specific problem.

If your situation is more complex than a tool can handle, [Growth Variable offers advisory engagements](https://www.growthvariable.com/services) for founders who need strategic clarity, not just better documents.

📘 I also wrote **[Prompt Engineering the Subconscious](https://book.growthvariable.com)** — a framework for founders and executives who've hit an invisible ceiling. The technical architecture of AI turns out to be a precise metaphor for how the mind actually works under pressure.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
<sub>If this saved you a week of work, a ⭐ takes two seconds.</sub>
</div>
