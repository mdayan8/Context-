# contextOS 🧠

> The portable AI memory and context layer for any repository.

**contextOS** is a ultra-fast, minimal CLI tool and dashboard designed to bridge the gap between complex codebases and AI context windows. It scans your repository, builds a semantic map, and synthesizes a "repo brain" that allows LLMs (like Gemini, Claude, and GPT-4) to understand your project in seconds—not minutes.

---

## ⚡️ Key Features

-   **🔍 Semantic Mapping**: Intelligent repository scanning that respects `.gitignore` and detects architectural patterns.
-   **💎 AI Brain Synthesis**: Generates a `memory.json` containing the "personality", complexity score, and dependency relationships of your repo.
-   **📄 Context Generation**: Produces a token-optimized `context.md` perfect for copy-pasting into LLM chats.
-   **🚀 Blazing Fast**: Built for speed using TypeScript and globby. 
-   **✨ Beautiful UI**: A built-in terminal-inspired dashboard for visual exploration of your repo's intelligence.

## 📦 Installation

```bash
# Using npm
npm install -g contextos

# Using Bun (Recommended)
bun add -g contextos
```

## ⌨️ CLI Usage

```bash
# Initialize contextOS in your repo
contextos init

# Map the architecture
contextos map

# Generate a repo brain using Gemini
contextos brain

# View the dashboard
npm run dev
```

## 🛠 Tech Stack

-   **Runtime**: Node.js / Bun
-   **Intelligence**: Google Gemini (via `@google/genai`)
-   **CLI**: Commander.js & Chalk
-   **Dashboard**: React, Vite, Tailwind CSS, Framer Motion

## 📂 Output Examples

### `memory.json` (The Brain)
```json
{
  "personality": "Modular Full-stack ESM",
  "complexityScore": 8.4,
  "keyDependencies": ["express", "vite", "gemini"],
  "suggestedOptimizations": [
    "Consolidate core utility types into a shared lib",
    "Add more granular error handling in the scan loop"
  ]
}
```

### `context.md` (LLM Context)
A Markdown summary optimized for LLM comprehension, including:
-   High-level architecture overview
-   Key entry points and file relationships
-   Technology stack breakdown

## 📜 License

MIT © [contextOS Team](https://github.com/contextos)
