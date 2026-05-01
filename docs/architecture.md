<img src="../public/icons/main logo.png" width="200" alt="RepoToPitch" />

# Architecture — RepoToPitch

RepoToPitch is a local-first, AI-orchestrated document synthesis platform. It is designed to work entirely within the user's local environment using Ollama for inference.

## 1. Design Philosophy

- **Local-First Privacy**: No source code or analysis artifacts ever leave the user's machine.
- **Hierarchical Synthesis**: Knowledge is built bottom-up (Repo -> Module -> PRD -> Master PRD -> Pitch).
- **Chunking & Iterative Generation**: Large artifacts are broken into atomic sub-tasks to bypass the finite context windows of local LLMs.
- **Resilience-by-Design**: The system assumes local LLMs may produce inconsistent or truncated structured data and implements self-healing parsers.
- **Architectural Aesthetic**: The UI uses a "Snow Premium" design language — high-fidelity, light-mode, and vibrant — to convey precision and professionalism.
- **Desktop-Enhanced Local-First**: The native Tauri wrapper provides the high-speed I/O required for rapid source code chunking and indexing.

## 2. Platform Architecture (Tauri 2.0)

RepoToPitch is packaged as a native desktop application using **Tauri 2.0**.

### 2.1 The Rust Core (`src-tauri/`)
The backend is written in Rust and provides:
- **Native FS Operations**: High-speed directory recursive scanning using `tauri-plugin-fs`.
- **System Dialogs**: Native "Pick Folder" dialogs via `tauri-plugin-dialog`.
- **Global Proxy**: Securely proxies requests to the local Ollama instance (`localhost:11434`), preventing CORS issues.
- **Port Mapping**: The development environment is mapped to internal port **4029**.

### 2.2 The Webview Container
The frontend runs in the system's native webview (WebView2 on Windows). This ensures a tiny binary size while maintaining full access to modern web APIs.

## 3. Core Components

### 2.1 State Management (`src/lib/store.js`)
Powered by **Zustand** with persistent storage. It manages:
- Repository metadata and tree structures.
- Analysis results (Overviews, Module deep-dives).
- Master artifacts (PRDs, Pitch Slides).
- Task Queue (Background process tracking).
- **Native Persistence**: State is persisted to the user's local data directory via Tauri's filesystem bridge, ensuring data survives application updates and system reboots.

### 2.2 AI Orchestration (`src/lib/ollama.js`)
A robust client that handles:
- Connection heartbeats.
- Model discovery.
- Streaming chat responses.
- **Fallback Logic**: Seamlessly switches between `/api/chat` and `/api/generate` to support various LLM runners.

### 2.3 Data Resilience (`src/lib/jsonUtils.js`)
The "Self-Healing" engine. It:
- Extracts JSON blocks from markdown noise.
- Fixes common LLM output errors (trailing commas, missing brackets).
- Implements a bracket-balancing scanner to identify and report truncated responses.

### 2.4 Iterative Synthesis Engine
The core logic for handling large-scale generation:
- **Task Decomposition**: Complex artifacts (like a 10-slide deck) are split into a multi-phase workflow: Outline Generation -> Phase 1 Content -> Phase 2 Content.
- **Context Management**: Only relevant chunks of technical context are fed to the LLM at each stage to prevent token overflow.
- **Stateful Merging**: Partial results are cached in the global store and merged only when all sub-tasks are complete.

### 2.5 Prompt Engineering (`src/lib/prompts.js`)
A library of structured system prompts designed for "Founder-First" narratives. Prompts are templated to inject context dynamically from the state.

## 3. The Synthesis Pipeline

1.  **Ingestion**: User adds repositories via native folder picker.
2.  **Architectural Mapping**: LLM generates high-level technical overviews of each repo.
3.  **Local Synthesis**: Per-repo summaries define individual service boundaries and roles.
4.  **Strategic Context**: User provides founder-level insights via the Context module.
5.  **Global Synthesis**: All technical and strategic context is merged into a single Master PRD and satellite artifacts.
6.  **Presentation Generation**: The Master PRD is transformed into a high-fidelity investor deck.

## 4. Export Layer (`src/lib/exportUtils.js`)
Uses browser-native libraries (`docx`, `pptxgenjs`, `jspdf`) to generate industry-standard artifacts. This layer implements a **High-Fidelity Sanitization Engine**:
- **Nuclear Purge**: A multi-pass text processor that aggressively strips Markdown artifacts (`**`, `__`, `` ` ``), LaTeX math delimiters (`$`), and Unicode whitespace artifacts.
- **Typographic Stabilization**: Implements mandatory character-spacing resets (`setCharSpace(0)`) to prevent font-rendering glitches and "letter-spacing drift" common in browser-based PDF generation.
- **Technical Symbol Normalization**: Automatically converts complex AI-generated sequences (e.g., `$\leftrightarrow$`) into clean, ASCII-safe technical symbols for professional interaction maps.
- **Bullet Deduplication**: Ensures clean list rendering by stripping redundant Markdown markers before applying professional document styling.

## 5. Interaction & Navigation Safeguards

To prevent state corruption and accidental data loss, the application implements a global navigation lock:
- **Settings Interceptor**: The `Sidebar` component wraps all project actions and navigation links in a `handleSidebarAction` interceptor. This blocks interaction while the Settings panel is active.
- **Zustand-Triggered Feedback**: Navigation blocks trigger a `settingsFlashCount` increment in the store. The `SettingsPage` observes this count to trigger a "flash" pulse on the Close button, providing clear visual guidance on how to resume navigation.
- **Component Class Support**: The core `Btn` component supports external `className` injection to facilitate these dynamic UI animations.

## 6. Repository Management Explorer

The repository explorer implements a "Controlled Tree" pattern:
- **Lifting State**: The expansion/collapse state (`collapsed` Set) is managed in the `RepoCard` level.
- **Global Actions**: This enables tree-wide commands like "Expand All" and "Collapse All" to be located prominently in the section headers, separate from the scrollable tree content.
- **Independence**: Each repository card maintains its own independent expansion state, allowing users to manage complex multi-repo projects with granular control.

