<img src="../public/icons/main logo.png" width="200" alt="RepoToPitch" />

# RepoToPitch — Documentation (v1.0.1)

## Contents

1. [Getting Started](#getting-started)
2. [Step-by-Step Guide](#step-by-step-guide)
3. [Working with Multiple Repos](#working-with-multiple-repos)
4. [Choosing Your Model](#choosing-your-model)
5. [Understanding the Outputs](#understanding-the-outputs)
6. [Pro Edition Features](#pro-edition-features)
7. [Prompts Reference](#prompts-reference)
8. [Configuration & Deployment](#configuration--deployment)
9. [Troubleshooting](#troubleshooting)
10. [Tips for Better Output](#tips-for-better-output)

---

## Getting Started

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Ollama** — [ollama.ai](https://ollama.ai) (free, runs locally)
- At least one Ollama model pulled (see [Choosing Your Model](#choosing-your-model))

### Installation (User)

1. **Download the latest release**: Grab the `.exe` (Windows) from the [Releases](https://github.com/anuraagjain/repo-to-pitch/releases) page.
2. **Install & Run**: Launch the application.

### Installation (Developer)

```bash
git clone https://github.com/anuraagjain/repo-to-pitch.git
cd repo-to-pitch
npm install
npm run tauri dev
```

### First run checklist

- [ ] Ollama is running (`ollama serve` in a terminal)
- [ ] At least one model is pulled (`ollama pull llama3.2`)
- [ ] You have the `tree` output ready for at least one repo (see below)

---

## Step-by-Step Guide

### Step 0 — Settings

Connect the app to your Ollama instance and select a model.

- Default host: `http://localhost:11434`
- Click **Connect** — the app will list all models currently installed in Ollama
- Select a model and click **Start**

If Ollama is running on a different machine or port, change the host field before connecting.

---

### Step 1 — Repos

Add each of your repositories here. For each repo you need:

**Name** — a short identifier, e.g. `auth-api`, `web-app`, `billing-service`

**Role** — `Frontend` (user-facing UI) or `API` (backend service)

**Tree structure** — the output of running `tree` in that repo's root directory

**Dependencies (optional)** — which other repos this one calls. Click the names of repos this one depends on. This feeds into the cross-repo synthesis later.

#### Getting your tree output

```bash
# Mac / Linux — recommended
tree -L 3 --gitignore

# If tree is not installed
find . \
  -not -path "./.git/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/.venv/*" \
  -not -path "*/dist/*" \
  | head -200

# Windows
tree /F
```

You can add as many repos as your product has. There is no limit. The tool was designed for products with 5–10 repos.

---

### Step 2 — Analyze

This is where the LLM does its work. For each repo you have three tabs:

#### Overview tab
Click **Run Overview** to have the LLM analyze the tree structure and describe:
- What this repo does in the overall system
- What it enables users to do
- Its key technical boundaries
- Likely API surface or entry points

This is required before anything else. It gives the LLM context for all subsequent analysis.

> **Time:** 15–60 seconds depending on model and repo size.

#### Modules tab
Optionally paste key source files for deeper analysis. For each file:
1. Enter the file path (e.g. `src/routes/auth.js`)
2. Paste the file contents
3. Click **▶ Analyze**

The LLM will describe what this file enables users to do, identify user flows, and flag constraints and risks — in product language, not technical language.

You do not need to paste every file. Focus on:
- The main entry point
- Core business logic
- Key API endpoints or UI components
- Anything that makes your product different

#### Repo PRD tab
Once Overview is complete, click **▶ Generate Repo PRD** to produce a focused Product Requirements Document for just this repo.

This includes:
- Purpose and dependencies
- Features as user stories with acceptance criteria
- API / interface contract
- Non-functional requirements
- A repo-level roadmap

---

### Step 3 — Founder Q&A

Seven questions that convert your knowledge of the product into the narrative layer the LLM needs to write a compelling PRD and pitch deck.

You need to answer at least three to proceed. The more you answer, the better the output.

| Question | Why it matters |
|----------|---------------|
| What problem were you solving for yourself? | Becomes your problem statement |
| Who else has this problem? | Defines target personas |
| What makes this different from alternatives? | The moat / differentiator slide |
| What are your top 3 features? | Features the user pays for |
| What would you charge? | Business model slide |
| Any early traction or signals? | Traction slide |
| What is your commercialisation goal? | The ask slide |

Be specific. "I kept spending hours doing X" is better than "there is a gap in the market for Y."

---

### Step 4 — Master PRD + Pitch Deck

Three tabs:

#### Master PRD
Click **▶ Generate Master PRD** to synthesise all repo overviews, per-repo PRDs, and your Q&A answers into a single document covering:

- Product name, problem statement, personas, value proposition
- System architecture summary (how the repos work together)
- End-to-end user flows that span multiple repos
- Master feature list with priorities
- Goals and KPIs
- Non-functional requirements
- Master roadmap (now / 3–6 months / 6–12 months)
- Open questions for validation

> **Time:** 30–120 seconds. This is the heaviest prompt — it sees everything.

#### Pitch Deck
Click **▶ Generate Pitch Deck** (requires Master PRD) to produce 10 high-fidelity slides:

1. Title
2. Problem
3. Solution
4. How It Works (shows your multi-service architecture simply)
5. Market & Niche
6. Key Features
7. Traction
8. Business Model
9. Roadmap
10. The Ask

Each slide includes bullets and speaker notes. Export as Markdown (for Canva, Figma, Google Slides) or JSON (for programmatic use). The system uses a high-resilience parsing engine to handle local LLM output inconsistencies.

#### Repo PRDs
Browse all per-repo PRDs in one place. Copy or download individually.

---

## Working with Multiple Repos

RepoToPitch was designed for exactly this situation: a product that grew organically across multiple repos with no central documentation.

### The dependency map

When you add repos, click which other repos each one calls. For example:
- `web-app` → calls `auth-api`, `products-api`
- `mobile-app` → calls `auth-api`, `notifications-api`
- `auth-api` → calls `users-db-service`

This map is passed to the master PRD prompt. The LLM uses it to describe your system architecture and write cross-repo user flows accurately.

### Order of operations

The tool does not require a specific order, but this sequence produces the best results:

1. Add all repos and paste tree structures first
2. Run Overview on every repo before generating any PRDs
3. Add modules only for the repos where the tree structure alone is not enough
4. Answer Q&A honestly and specifically
5. Generate Master PRD last — it benefits from having all per-repo PRDs done first

### What if a repo is mostly infrastructure?

Tag it as `API` and paste the tree. In the Overview tab, the LLM will recognize it as infrastructure (Kubernetes configs, CI/CD, etc.) and describe it appropriately — usually as "enables the product to deploy reliably" rather than a user-facing feature. That is correct and useful for the architecture summary.

---

## Choosing Your Model

All models supported by Ollama work. These are the ones tested:

| Model | Pull command | Size | Notes |
|-------|-------------|------|-------|
| `gemma4:e4b` | `ollama pull gemma4:e4b` | 4 GB | Best balance of speed and quality for most users |
| `gemma4:31b` | `ollama pull gemma4:31b` | 19 GB | Most capable dense model for complex PRDs |
| `qwen2.5-coder` | `ollama pull qwen2.5-coder` | 4.7 GB | Dedicated to code analysis and technical mapping |

**Recommendation:** Use `gemma4:e4b` for daily synthesis. Switch to `qwen2.5-coder` for Step 2 (Repo Analysis).

You can switch models between steps — use a fast model for overviews and a stronger model for the master PRD.

---

## Understanding the Outputs

### Per-repo PRD
A focused requirements document for one service or frontend. Use this for:
- Onboarding new engineers to a specific repo
- Scoping work within one service
- Communicating what a service does to non-technical stakeholders

### Master PRD
The document you give to investors, advisors, or co-founders. It describes the whole product as a single coherent thing, with cross-repo flows and a unified roadmap.

### Pitch Deck (Markdown export)
Import into Canva: create a new presentation, use a blank template, and paste each slide's content into a text block. The visual_hint field on each slide tells you what graphic or diagram would work.

Import into Google Slides: create a new presentation, then use File → Import slides or paste content manually per slide.

Import into Figma: paste into a FigJam board for collaborative editing.

### Pitch Deck (JSON export)
The raw structured data. Each slide object contains `title`, `subtitle`, `bullets`, `speaker_note`, and `visual_hint`. Use this if you are building your own slide generation pipeline or want to process the deck programmatically.

---

## Pro Edition Features

The Pro Edition adds three capabilities designed specifically for consultants and fractional CTOs delivering client work.

### Custom Prompts

Every document type in RepoToPitch has a prompt that drives its output. In the Pro Edition, you can edit these prompts directly from the Settings screen — no code changes required.

**Why this matters:** A risk register for a fintech client needs to surface regulatory and compliance language. A health tech PRD needs MHRA and data governance framing. A SaaS product needs different KPI language to an internal enterprise platform. The default prompts are tuned for general use. Custom prompts make every output feel like it was written for your client's specific world.

**How to use it:** In Settings, scroll to the Prompt Library section. Each document type (Repo Overview, Module Analysis, Repo PRD, Master PRD, Pitch Deck, and all Synthesis artifacts) has an editable prompt field. Edit, save, and all subsequent generations use your version. You can reset to default at any time.

**Tip:** Start by editing the Master PRD prompt. Add a line like: *"This document is for a regulated financial services business. Flag any compliance, audit trail, or data residency considerations explicitly."* The difference in output quality is immediate.

---

### White-Label Outputs

In the Pro Edition, every exported document — PDF, Word (.docx), and PowerPoint (.pptx) — carries your branding, not RepoToPitch's.

**How to set it up:** In Settings, go to the Branding section. Upload your logo (PNG or SVG, recommended 400px wide), enter your company name, and optionally set your primary brand colour (hex code). Save once. All exports from that point forward use your branding on the cover page, header, footer, and title slide.

**What gets branded:**
- PDF: Cover page with your logo and company name, footer on every page
- Word (.docx): Cover page, header with company name
- PowerPoint (.pptx): Title slide with your logo, footer on every slide

This means a consultant can hand a client a pitch deck with their own practice's name on the cover. The client never needs to know which tool produced it.

---

### Onboarding Call & Direct Support

Every Pro licence includes a 30-minute onboarding call with Anuraag Jain and 90 days of direct email support.

**Booking the onboarding call:** After purchase you will receive a confirmation email with a calendar link. Book at a time that suits you. Come with your first use case in mind — ideally a real client repo you are about to analyse. The call is most useful when it is practical, not theoretical.

**What the call covers:**
- Which Ollama models work best for your type of client work
- How to tune custom prompts for your sector
- How to get the most out of the Engagement workflow for consulting deliverables
- Any questions about the tool

**Direct support:** Email anuraag.jain@growthvariable.com with your licence reference in the subject line. This is not a support ticket queue. You will get a direct response within one business day.

---

*Pro Edition is available at [£496.99 Founding Member pricing](https://repotopitch.lemonsqueezy.com/buy/pro) — first 20 licences only.*

---

## Prompts Reference

All prompts are in `src/lib/prompts.js`. You can edit them directly to change the output style, add constraints, or tailor the format to your needs.

### `repoOverview(repo, allRepoNames)`
Analyzes a single repo's tree structure and returns a product-level description. Aware of other repos in the system.

### `moduleAnalysis(repoName, repoRole, overview, filePath, fileContent)`
Analyzes one source file and returns user flows, constraints, and a product description. Uses the repo overview as context.

### `repoPrd(repo)`
Generates a focused PRD for one repo using its overview and module analyses.

### `masterPrd(repos, qaAnswers)`
Synthesises all repo overviews, per-repo PRDs, and founder Q&A into a master PRD. This is the most context-heavy prompt.

### `pitchDeck(masterPrd, qaAnswers, repos)`
Generates 10 pitch deck slides using an iterative synthesis engine to ensure completeness.

---

## Configuration & Deployment

### Environment: development

```bash
npm run dev
# Vite dev server at http://localhost:4029
# Ollama proxied at /ollama → http://localhost:11434
```

### Environment: production build (Desktop)

```bash
npm run build        # Build frontend assets
npm run tauri build  # Build native EXE
```

The production build generates a standalone installer (`.exe` or `.msi`) in `src-tauri/target/release/bundle/`. This installer can be distributed to users without requiring them to have Node.js or Git. Each user connects to their own local Ollama instance. No shared backend required.

### Ollama on a remote machine

1. Start Ollama with CORS enabled: `OLLAMA_ORIGINS="*" ollama serve`
2. Open Settings in the app and change the host to the remote machine's IP/URL
3. Click Connect

---

## Troubleshooting

### "Cannot reach Ollama"

- Check Ollama is running: `ollama serve`
- Check the host in Settings matches where Ollama is running
- If Ollama is on a different machine, ensure `OLLAMA_ORIGINS="*"` is set
- Check nothing is blocking port 11434

### "No models available"

- Pull a model: `ollama pull llama3.2`
- Check with: `ollama list`

### Output stops mid-generation

- This usually means the model hit its context limit
- Try a model with a larger context window (`qwen2.5:7b` or `gemma2:9b`)
- Or reduce the input — use shorter tree outputs, paste fewer modules

### Pitch deck JSON fails to parse

- Some models occasionally wrap JSON in markdown fences despite instructions
- Click Regenerate — usually resolves on the second attempt
- If persistent, try a different model

### The PRD is too generic

- Add module analyses — the more source code the LLM sees, the more specific it gets
- Answer all 7 Q&A questions, especially the differentiator and problem questions
- Be specific in Q&A — "I spent 3 hours every time I needed to prep for a funding meeting" beats "there is a documentation gap"

---

## Tips for Better Output

**On tree structure:** Include file names at 2–3 levels deep. The LLM infers a lot from naming conventions — `auth.js`, `billing_service.py`, `UserDashboard.tsx` tell a clear story. You don't need the full tree of every file, just enough to show the shape.

**On module selection:** Pick the files where the core value lives, not the boilerplate. For an API: the main routes file and one or two core service files. For a frontend: the main page component and the API client.

**On the dependency map:** Even a rough map is better than none. If your web app calls three APIs, mark those connections. The master PRD's architecture summary and cross-repo user flows depend on this.

**On Q&A:** Write answers as you would speak them to a peer, not as you would write them in a formal document. The LLM will formalise the language. What it needs is your honest, specific knowledge of the product.

**On regeneration:** The tool is non-destructive — regenerating any step overwrites only that step's output. If you are not happy with the master PRD, regenerate it without losing your per-repo work.
