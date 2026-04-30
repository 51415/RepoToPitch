# Repo Map — RepoToPitch

This document provides a high-level overview of the codebase structure for developers and AI assistants.

## Directory Structure

```text
├── src-tauri/          # Rust backend for Desktop App (Tauri 2.0)
│   ├── capabilities/   # Plugin permissions (dialog, fs, log)
│   ├── src/lib.rs      # Native plugin registration and proxy setup
│   └── tauri.conf.json # Build and bundle configuration
├── src/
│   ├── components/     # Reusable UI components (Buttons, Cards, Modals, etc.)
│   │   ├── Sidebar.jsx # Navigation sidebar with step tracking
│   │   └── UI.jsx      # 'Snow Premium' atomic design (Btn, Card, Tag, Spinner)
│   ├── lib/            # Core business logic and utilities
│   │   ├── exportUtils.js  # Document generation (DOCX, PDF, PPTX, JSON)
│   │   ├── tauriUtils.js   # Native File System bridge (Tauri API)
│   │   ├── jsonUtils.js    # High-resilience JSON extraction and repair
│   │   ├── ollama.js       # API client with fallback logic
│   │   ├── prompts.js      # Structured system prompts for PRD generation
│   │   └── store.js        # Global state with native persistence
│   ├── pages/          # Main application views (Step-based)
│   │   ├── SettingsPage.jsx # Step 0: Ollama & Model selection
│   │   ├── ReposPage.jsx    # Step 1: Native repo management & scanning
│   │   ├── AnalysePage.jsx  # Step 2: Per-repo technical deconstruction
│   │   ├── QAPage.jsx       # Step 3: Strategic context session
│   │   ├── MasterPage.jsx   # Step 4: Hierarchical synthesis engine
│   │   └── PitchPage.jsx    # Step 5: High-fidelity Pitch Deck schematic
│   ├── App.jsx         # Main layout and floating command center
│   └── main.jsx        # React entry point
```

## Key Architectural Patterns

1.  **Native Desktop Persistence**: All state (repos, analysis, answers) is managed by Zustand and persisted to the local filesystem via Tauri, ensuring privacy and reliability.
2.  **Ollama Robustness**: The `ollama.js` client automatically detects and adapts to the local environment, providing a zero-config bridge for LLM inference.
3.  **Snow Premium Design**: The UI follows a strict "Snow Premium" aesthetic—high-fidelity light mode with centralized atomic components in `UI.jsx`.
4.  **Hierarchical Synthesis**: Repositories are analyzed technical-first, then merged with strategic founder context to produce a unified Master PRD.
5.  **Direct-to-Artifact Export**: Programmatically generates professional artifacts (DOCX, PDF, PPTX) directly in the webview, keeping the app lightweight and fast.
6.  **Iterative Synthesis Engine**: Complex generations are broken into atomic sub-tasks to ensure stability on local models and hardware.

## Platform Support
RepoToPitch is a **Standalone Desktop Application** built on Tauri 2.0. It is optimized for **Windows**, with cross-platform support for macOS and Linux enabled by its Rust/Webview architecture.
