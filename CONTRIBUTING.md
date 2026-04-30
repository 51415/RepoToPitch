<img src="public/icons/main logo.png" width="200" alt="RepoToPitch" />

# Contributing to RepoToPitch

Thank you for your interest in contributing to RepoToPitch! This project was born from a need to bridge the gap between technical execution and strategic communication—entirely within a local, private environment.

As an open-source project, we rely on the community to help us refine our prompts, improve our native integrations, and expand our export capabilities.

## Our Philosophy

1.  **Local-First, Always**: We will never support cloud-based LLM providers or centralized data storage. The core of this project is privacy.
2.  **Aesthetic Precision**: We believe developer tools should be beautiful. All UI changes should respect the "Snow Premium" design system.
3.  **Low Friction**: Contributing should be easy. Our architecture is modular to allow for targeted improvements.

## How You Can Help

### 1. Bug Reports & Feedback
If you find a bug, please open an issue with:
- Your Operating System.
- The model you are running in Ollama.
- Clear steps to reproduce the issue.

### 2. Prompt Engineering (`src/lib/prompts.js`)
This is the "brain" of the app. If you find that a specific model (e.g. Llama 3) isn't performing well with a certain template, please submit a PR with an optimized version.

### 3. Native Integrations (`src-tauri/`)
Help us improve filesystem scanning, shell command execution, and native dialog stability on macOS and Linux.

### 4. New Export Formats (`src/lib/exportUtils.js`)
We currently support Markdown, PDF, and PPTX. Contributions for Notion, Confluence, or Google Docs integrations are welcome.

## Development Setup

1.  **Prerequisites**:
    - Node.js 18+
    - Rust (latest stable)
    - Ollama (running locally)
2.  **Installation**:
    ```bash
    npm install
    ```
3.  **Run in Dev Mode**:
    ```bash
    npm run tauri dev
    ```

## Pull Request Process

1.  **Fork** the repository and create your branch from `main`.
2.  **Ensure** your code follows the existing style and is linted.
3.  **Test** your changes thoroughly in the desktop environment.
4.  **Submit** your PR with a clear description of the problem solved or feature added.

## License

By contributing to RepoToPitch, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

---

Questions? Reach out to the maintainers via GitHub Issues or at anuraag.jain@growthvariable.com.
