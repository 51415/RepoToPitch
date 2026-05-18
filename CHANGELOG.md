# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5] — 2026-05-18
### Native Synthesis & UX Hardening
- **Tauri Security Sandboxing**: Resolved runtime scope exceptions on absolute system paths under Tauri 2.0. The filesystem check now validates files relatively within the namespaced AppData sandbox before resolving them dynamically for native engines.
- **Zero-Friction Silent Saving**: Captures and registers the project's absolute disk path upon loading or opening a `.json` file from the dashboard, enabling the **SAVE** button to persist state changes silently and instantly back to disk without recurrent dialog prompts.
- **PowerPoint COM Synthesis Optimization**: Streamlined PowerPoint native COM synthesis to support headless execution and graceful fallback handling.
- **Versioning Parity**: Synchronized package config files and in-app system core panels to version 1.1.5 across the ecosystem.

## [1.1.3] — 2026-05-18
### Export Engine Enhancements
- **PowerPoint COM Template Application**: Completely refactored `exportAsPptx` and `exportPitchAsPDF` pipelines to prioritize Native MS Office COM, applying custom templates natively via `$pres.ApplyTemplate(...)` with zero XML manipulation, preventing layout/schema corruption.
- **PowerPoint COM Double Bullets**: Integrated regex-based duplicate bullet trimming (`$b -replace '^[•\-\*\s]+', ''`) directly in the PowerShell loop, eliminating double-bullet rendering bugs natively.
- **Word (DOCX) High-Fidelity Inline Markdown Parser**: Introduced a linear, character-by-character Markdown parser (`parseInlineMarkdown`) that converts standard bold (`**`), italic (`*`), and inline code (`` ` ``) formatting into native Word `TextRun` elements.
- **Word (DOCX) Bullet-Prefix Logic**: Swapped the greedy list-prefix trimmer with a precise `^[-*•]\s+` match to protect nested markdown bold styling (e.g. `* **Bold**`) from losing its bold markers during generation.

## [1.1.2] — 2026-05-15
### Native Synthesis Stabilization
- **Unified Native Engine**: Standardized Pitch and Synthesis PDF exports to use the exact same Native COM synthesis engine as PPTX, ensuring 100% formatting parity.
- **Template-Less Native Export**: Decoupled MS Office synthesis from external template dependencies; the app now generates documents directly from scratch if Office is detected.
- **Hardened COM Bridge**: Implemented "InvokeMember" patterns and PowerPoint-specific enums (DisplayAlerts/WithWindow) to resolve automation crashes across different Office versions.
- **UI Standardization**: Reordered AnalysePage export buttons to (DOCX | PDF | MD) and restored Copy functionality to match the global synthesis UX.
- **Enhanced Detection**: Expanded the dependency guard to recognize PowerPoint-only installations.

## [1.1.1] — 2026-05-01
### Export Engine Stabilization
- **Nuclear Sanitization Engine**: Implemented an aggressive, multi-pass text-processing layer that purges Markdown artifacts (`**`, `__`, `` ` ``), LaTeX math delimiters (`$`), and Unicode artifacts from all exports.
- **Typographic Stabilization**: Forced absolute character-spacing resets (`setCharSpace(0)`) for every line in PDF exports, eliminating "letter-spacing drift" and font-rendering glitches.
- **High-Fidelity Interaction Maps**: Hardened the arrow-detection logic to normalize complex AI-generated sequences (e.g., `$ \leftrightarrow $`, `< - >`) into clean, ASCII-safe technical symbols.
- **Bullet Deduplication**: Refined the list-prefix stripping regex across PPT, PDF, and Word modules to solve the "double-bullet" rendering issue.
- **Version Verification**: Added a version-tagged footer to PDF exports to assist in deployment validation.

## [1.1.0] — 2026-05-01
### UI & Stability Overhaul
- **Navigation Safeguards**: Implemented a global interceptor to block navigation/actions while settings are open, preventing state corruption.
- **Visual Alert System**: Added a pulsing "Settings Flash" notification on the Close button to guide users when navigation is locked.
- **Controlled Folder Tree**: Refactored the repository tree into a controlled component with prominent "Expand All" and "Collapse All" global controls.
- **Premium Branding**: Rolled out a new 3D glassmorphic favicon and executive documentation styling across all architecture and manual files.
- **Technical Sync**: Synchronized all internal design patterns, hardware requirements, and model licensing guides to the production documentation suite.

## [1.0.1] — 2026-04-30
### Connectivity Patch
- **Ollama Production Fix**: Resolved an issue where the production executable failed to connect to local Ollama instances.
- **Tauri HTTP Plugin Integration**: Switched to native Rust-based HTTP client to bypass browser CORS restrictions and proxy dependencies.
- **Direct Endpoint Stability**: Corrected default connection logic to ensure reliable "out-of-the-box" connectivity for new installations.


## [1.0.0] — 2026-04-30
### Release 1
- **Initial Public Release**: Full-featured standalone desktop edition of RepoToPitch.
- **Native Desktop Edition**: Built with Tauri 2.0 for a secure, local-first experience.
- **Snow Premium Design System**: High-fidelity light-mode aesthetic with executive clarity.
- **Hierarchical Synthesis Suite**: 10-artifact technical and strategic roadmap generation.
- **Pitch Deck Engine**: Iterative generation of investor-ready slides.
- **Multi-Repo Support**: Capability to synthesize entire product ecosystems.
- **Ollama Integration**: Privacy-first AI processing entirely on your local machine.

---
Built by Anuraag Jain · [growthvariable.com](https://growthvariable.com)
