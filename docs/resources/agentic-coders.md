---
title: Using Flamingock with Agentic Coders
sidebar_position: 50
---

# Using Flamingock with Agentic Coders

**Flamingock** is designed to be **"Agent-ready"**. Modern agentic coding assistants—such as **Claude Code**, **Gemini CLI**, and **OpenCode**—can be significantly more productive and accurate when working with Flamingock thanks to our adherence to emerging standards for AI-developer collaboration.

By providing structured context and specialized skills, Flamingock ensures that AI agents generate changes that are not only syntactically correct but also follow all architectural best practices, naming conventions, and safety patterns.

---

## 🛠 Pillar 1: LLM-Optimized Documentation (`llms.txt`)

Flamingock documentation is optimized for Large Language Models (LLMs) using the [llms.txt](https://llmstxt.org/) standard. Instead of having an agent crawl dozens of HTML pages, you can provide a single, structured entry point.

We provide two key files at the root of our documentation:

1.  **`/llms.txt`**: A concise index of the documentation, providing a high-level overview and links to all relevant sections.
2.  **`/llms-full.txt`**: A comprehensive, markdown-formatted file containing the **entire documentation** content. This is the most efficient way to give an agent the full context of Flamingock in a single request.

### How to use it
When starting a session with an agentic coder, you can point it to these resources to ensure it has the latest information:

```bash
# Example with an agent that supports external context URLs
claude-code "Create a new Flamingock change to add an index to the users collection. Read the documentation in: https://docs.flamingock.io/llms-full.txt"
```

---

## 🧠 Pillar 2: Agent Skills (`agentskills.io`)

Beyond general documentation, Flamingock provides specialized **Skills** following the [agentskills.io](https://agentskills.io/) standard. A Skill is a set of machine-readable instructions that teaches an agent exactly how to perform a specific task within the Flamingock ecosystem.

All our official skills are hosted at our dedicated repository: [github.com/flamingock/flamingock-skills](https://github.com/flamingock/flamingock-skills).

Our primary skill is the `flamingock-java-change`, which enforces:

-   **Naming Conventions**: Automatic enforcement of the `_ORDER__DescriptiveName.java` pattern (e.g., `_0001__CreateUsers.java`).
-   **Annotation Requirements**: Ensuring `@TargetSystem`, `@Change`, and `@Apply` are always present and correctly configured.
-   **Transactionality Logic**: Guidance on when to use `transactional = false` (DDL, non-transactional systems) vs. `true` (DML).
-   **Dependency Injection**: Teaching the agent to use parameters in `@Apply` methods instead of instantiating clients manually.
-   **Rollback Best Practices**: Prompting the agent to always include a `@Rollback` method for safety and CLI compatibility.

Refer to the [Flamingock Skills repository](https://github.com/flamingock/flamingock-skills) for installation and usage instructions.

---

## 🚀 Practical Workflow

Follow this workflow to leverage an agentic coder for your Flamingock migrations:

### 1. Provide Context
Ensure the agent knows the current state of your project and the Flamingock documentation.
> "Read https://docs.flamingock.io/llms-full.txt to understand how to write Flamingock changes."

### 2. Describe the Business Goal
Be specific about *what* needs to change in the target system.
> "I need a new Flamingock change for the 'inventory-db' target system. It should add a 'stock_status' column to the 'products' table. This is a SQL database."

### 3. Review the Generated Change
The agent, guided by the skill and documentation, should produce a file like this:

```java
@TargetSystem("inventory-db")
@Change(id = "add-stock-status-to-products", author = "dev-team", transactional = false)
public class _0025__AddStockStatusToProducts {

    @Apply
    public void apply(Connection connection) throws SQLException {
        connection.createStatement().execute(
            "ALTER TABLE products ADD COLUMN stock_status VARCHAR(20) DEFAULT 'IN_STOCK'"
        );
    }

    @Rollback
    public void rollback(Connection connection) throws SQLException {
        connection.createStatement().execute(
            "ALTER TABLE products DROP COLUMN stock_status"
        );
    }
}
```

### 4. Verify and Run
Always verify the generated code. Once satisfied, run your application or use the Flamingock CLI to apply the change.

---

## 💎 Benefits of the Agentic Approach

-   **Consistency**: No more guessing the order number or naming pattern.
-   **Safety**: Agents are instructed to prioritize idempotency and provide rollbacks.
-   **Efficiency**: Reduce the time from "business requirement" to "deployed migration" from minutes to seconds.
-   **Architectural Alignment**: The agent follows the same patterns as a senior architect, ensuring long-term maintainability.
