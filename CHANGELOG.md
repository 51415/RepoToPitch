# Changelog

All notable changes to this project will be documented in this file.

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
