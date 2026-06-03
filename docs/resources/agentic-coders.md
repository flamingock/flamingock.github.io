---
title: Using Flamingock with Agentic Coders
sidebar_position: 50
---

# Using Flamingock with agentic coders

**Flamingock** is designed to be **agent-ready**. Modern agentic coding assistants — such as **Claude Code**, **Gemini CLI**, and **OpenCode** — can be significantly more productive and accurate when working with Flamingock thanks to our adherence to emerging standards for AI-developer collaboration.

By providing structured context and specialized skills, Flamingock ensures that AI agents generate setup and change code that is not only syntactically correct but also follows all architectural best practices, naming conventions, and safety patterns.

---

## 🛠 Pillar 1: LLM-optimized documentation (`llms.txt`)

Flamingock documentation is optimized for Large Language Models (LLMs) using the [llms.txt](https://llmstxt.org/) standard. Instead of having an agent crawl dozens of HTML pages, you can provide a single, structured entry point.

We provide two key files at the root of our documentation:

1. **`/llms.txt`**: A concise index of the documentation, providing a high-level overview and links to all relevant sections.
2. **`/llms-full.txt`**: A comprehensive, markdown-formatted file containing the **entire documentation** content. This is the most efficient way to give an agent the full context of Flamingock in a single request.

### How to use it

When starting a session with an agentic coder, point it to these resources to ensure it has the latest information:

```bash
# Example with an agent that supports external context URLs
claude "Create a new Flamingock change to add an index to the users collection. Read the documentation at: https://docs.flamingock.io/llms-full.txt"
```

---

## 🧠 Pillar 2: Agent skills (`agentskills.io`)

Beyond general documentation, Flamingock provides specialized **Skills** following the [agentskills.io](https://agentskills.io/) standard. A skill is a set of machine-readable instructions that teaches an agent exactly how to perform a specific task within the Flamingock ecosystem — without guessing or hallucinating APIs.

All official skills are hosted at: [github.com/flamingock/flamingock-skills](https://github.com/flamingock/flamingock-skills).

### Installing skills

Skills are installed per project, and you can install all of them using the Flamingock CLI tool:

| Command                                      | Destination          |
|----------------------------------------------|----------------------|
| `flamingock install-skills`                  | `./.agents/skills`   |
| `flamingock install-skills --agent claude`   | `./.claude/skills`   |
| `flamingock install-skills --agent github`   | `./.github/skills`   |
| `flamingock install-skills --agent cursor`   | `./.cursor/skills`   |
| `flamingock install-skills --agent opencode` | `./.opencode/skills` |
| `flamingock install-skills --agent gemini`   | `./.gemini/skills`   |
| `flamingock install-skills --agent windsurf` | `./.windsurf/skills` |
| `flamingock install-skills --agent pi`       | `./.pi/skills`       |

:::note
Paths are resolved relative to the directory where you run the command.
:::

Then commit it to your repository so every developer and every CI agent gets it automatically:

```bash
git add .agents/skills/flamingock-*/
git commit -m "chore: add Flamingock agent skills"
```

Refer to the [Flamingock Skills repository](https://github.com/flamingock/flamingock-skills) for the full list of available skills.

---

## 💎 Benefits of the agentic approach

- **Correctness**: The agent follows the exact Flamingock API — no guessed method names, no invented configuration keys.
- **Consistency**: Every project gets the same setup patterns, regardless of which developer or agent generates them.
- **Safety**: Guards in the skill prevent common mistakes before any code is written.
- **Speed**: From "I need to set up Flamingock" to a working, production-ready configuration in seconds.
