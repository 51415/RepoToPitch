# Implementation Details — RepoToPitch

This document covers the specific technical implementation details for the core features of RepoToPitch.

## 1. High-Resilience JSON Extraction

The `extractJson` utility in `src/lib/jsonUtils.js` is the backbone of the system's reliability. It uses a multi-stage approach to handle non-conformant LLM outputs:

1.  **Iterative Scanning**: A bracket-counting scanner finds the outermost `{` and `}` or `[` and `]`.
2.  **Noise Removal**: It automatically strips markdown code fences (```json ... ```) and conversational text before/after the data.
3.  **Automatic Repair**:
    *   Removes trailing commas which cause native `JSON.parse` to fail.
    *   Detects `INCOMPLETE_JSON_STRUCTURE` or `INCOMPLETE_ARRAY` errors, which are then surfaced to the UI as truncation warnings.

    *   Detects `INCOMPLETE_JSON_STRUCTURE` or `INCOMPLETE_ARRAY` errors, which are then surfaced to the UI as truncation warnings.

## 2. Iterative Synthesis Engine (Context Window Optimization)

To handle complex projects with large context requirements on local LLMs (Ollama), the system implements a strict chunking and iterative strategy:

- **Multi-Pass Generation**: For large artifacts like the Pitch Deck, the system first generates a structural **Outline** (JSON), then spawns individual sub-tasks to populate each slide's content.
- **Context Injection**: Each sub-task receives only the necessary context (e.g., the Master PRD + the specific slide definition), keeping the prompt size within the 4k-8k token limit common for local 7B models.
- **Atomic State Updates**: Partial results are streamed and saved into the `pitchSlides` state in real-time, ensuring that a single failure doesn't lose the entire generation.

## 3. Integrated Command Center

The application layout in `App.jsx` and `Sidebar.jsx` implements a structured navigational hierarchy:
- **Persistent Sidebar**: Anchored to the left, providing one-click access to the 6-step project lifecycle and real-time task monitoring.
- **Floating Controls**: A glassmorphic navigation bar (`fixed` at `top: 32px`, `right: 32px`) provides context-aware 'PREV' and 'NEXT' actions, bridging the gap between deconstruction phases.
- **Glassmorphism**: High-fidelity backgrounds use `backdrop-filter: blur(12px)` and `rgba(255,255,255,0.7)` to maintain visual lightness without sacrificing control visibility.

## 3. High-Fidelity Slide Rendering

Slides are rendered using the `SlideCard` component, optimized for a **16:9 540px fixed-height** aesthetic:
- **Smart Scaling**: Font sizes scale down (`32px` for headers, `16px` for bullets) to prevent out-of-bounds overflow.
- **Content Persistence**: Main content and speaker notes are wrapped in `overflow-y: auto` containers to gracefully handle verbose AI outputs.
- **Theming**: Implements a dual-theme system (Light/Dark/Accent) that alternates automatically during the schematic phase.

## 4. Background Task Orchestration

Task monitoring is handled via the `addTask` and `updateTask` methods in `src/lib/store.js`:
- **State Cleanliness**: Adding a new task automatically purges stale `error` states from the system.
- **UI Visibility**: Real-time progress is visible in the sidebar task queue, providing transparency for long-running AI synthesis operations.

## 5. Local Export Pipeline

Exports are handled by `src/lib/exportUtils.js` using:
- **docx**: For structural Word document generation.
- **pptxgenjs**: For programmatic PowerPoint slide creation.
- **jspdf**: For generating high-quality PDFs of both the PRDs and the Pitch Deck.

## 6. Tauri Native Bridge (`src/lib/tauriUtils.js`)

To enable the "Desktop First" experience, the app implements a bridge to Tauri's native capabilities:

- **Environment Detection**: `isTauri()` checks for the presence of the Tauri internal metadata to toggle between browser-level and native-level APIs.
- **Native Folder Picking**: Replaces the browser's `showDirectoryPicker` with `tauri-plugin-dialog`, providing a standard OS folder selection interface.
- **Optimized Scanning**: `scanDirectoryTauri` uses the native Rust-based `readDir` and `readTextFile` commands. This bypasses the async iterator overhead of the File System Access API, resulting in significantly faster repository indexing for large codebases.
- **Permission Persistence**: Unlike browser-based sessions that require re-permissioning after refresh, the desktop app maintains stable access to indexed paths throughout the application lifecycle.

## 7. Snow Premium Design System

The application employs a custom "Snow Premium" design system defined in `index.css` and `src/components/UI.jsx`:
- **Typography**: A global baseline of `14px` with hierarchical scaling (+2px across all core tokens) ensures readability in high-density technical environments.
- **Color Palette**: Uses a refined 'Snow' theme—clean whites, soft borders (`var(--border)`), and vibrant indigo accents (`var(--accent)`) to distinguish between code and synthesis results.
- **Consistency**: Centralized `Btn`, `Card`, and `SectionTitle` components ensure that all workflow pages share a unified visual weight and architectural layout.

## 8. Interaction Safeguards (Settings Lock)

The navigation interceptor in `Sidebar.jsx` uses a centralized logic block:
- **State Check**: Before executing any `onClick` or `Link` action, the system checks the `showSettings` state.
- **Intervention**: If settings are open, the action is cancelled, and `triggerSettingsFlash()` is called.
- **Animation Implementation**: The flash effect uses a CSS `@keyframe` pulse combined with inline style overrides (glow and scale) in `SettingsPage.jsx` to ensure high visibility even with complex backgrounds.

## 9. Controlled Folder Explorer

The migration of the repository tree to a controlled component allows for:
- **External Triggers**: The "Expand All" and "Collapse All" buttons are implemented as secondary-variant `Btn` components in `ReposPage.jsx`.
- **Recursive State Calculation**: The `collapseAll` function performs a full depth-first walk of the `treeData` object to pre-calculate all directory paths, ensuring the entire tree is collapsed with a single state update.
- **Performance**: Managing the expansion set via a `Set` object provides O(1) lookups during tree rendering, maintaining 60fps even for deep nested structures.

