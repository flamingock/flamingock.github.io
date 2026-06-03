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

### `flamingock-onboarding`

The `flamingock-onboarding` skill guides an agent through the full Flamingock setup for any project configuration — standalone or Spring Boot, Community or Cloud edition, Java or Kotlin, Gradle or Maven.

Instead of producing generic boilerplate, the agent first collects the answers it needs:

- **Runtime flavor** — `standalone` or `springboot`
- **Language** — `java` or `kotlin`
- **Edition** — `community` or `cloud`
- **Build tool** — `gradle` or `maven`
- **Available target systems** — which Flamingock TargetSystem will be used
- **AuditStore backend** (Community only) — `mongodb`, `sql/jdbc`, `dynamodb`, or `couchbase`
- **Existing clients or beans** — whether the required runtime client already exists in the project
- **Changes package** — the package passed to `@Stage(location = "...")`
- **Activation class** — where `@EnableFlamingock` should live

Once all answers are collected, the skill routes to the correct reference file and generates only the setup relevant to that exact path: the right dependencies, the correct builder or `application.yml` configuration, and the `@EnableFlamingock` annotation with the proper `@Stage` setup.

It also includes guards to prevent common mistakes — for example, refusing to generate setup code if the required client or bean does not yet exist, or if the selected AuditStore backend is incompatible with the available target systems.

#### Example session

```
You: Set up Flamingock in my project.

Agent: To generate the correct setup, I need a few answers:
  Runtime: standalone | springboot
  Language: java | kotlin
  Edition: community | cloud
  Build tool: gradle | maven
  Available TargetSystems: ...
  Community AuditStore backend: mongodb | sql/jdbc | dynamodb | couchbase | n/a for cloud
  Required clients/beans already exist: yes | no
  Changes package: ...
  Activation class: main class | dedicated config class | exact class name

You: springboot, java, community, gradle, mongodb-springdata, mongodb, yes,
     com.acme.inventory.changes, dedicated config class

Agent: [Generates the exact Spring Boot + Gradle + MongoDB Community setup,
        including the flamingock-springboot-mongodb-springdata dependency,
        MongoDBSpringDataAuditStore.from(...) configuration,
        and @EnableFlamingock on the config class]
```

### Installing a skill

Skills are installed per project. Copy the skill folder into your project's `.agents/skills/` directory:

```bash
mkdir -p your-project/.agents/skills/
cp -r flamingock-onboarding/ your-project/.agents/skills/
```

Commit it to your repository so every developer and every CI agent gets it automatically:

```bash
git add .agents/skills/flamingock-onboarding/
git commit -m "chore: add flamingock-onboarding agent skill"
```

Refer to the [Flamingock Skills repository](https://github.com/flamingock/flamingock-skills) for the full list of available skills and usage instructions.

---

## 🚀 Practical workflow

Follow this workflow to leverage an agentic coder when setting up Flamingock:

### 1. Provide context

Point the agent to the documentation so it has full, accurate knowledge:

> "Read https://docs.flamingock.io/llms-full.txt to understand how to set up and use Flamingock."

### 2. Install the onboarding skill

Copy the `flamingock-onboarding` skill into your project's `.agents/skills/` directory (see above). Once installed, the agent will load it automatically when you ask it to set up Flamingock.

### 3. Describe your project configuration

Tell the agent what you need:

> "Set up Flamingock in this Spring Boot project. We use MongoDB with Spring Data, community edition, Gradle, and Java. The changes package is `com.acme.inventory.changes`."

### 4. Review the generated setup

The agent, guided by the skill, produces exactly the right configuration for your path. For the example above, it generates something like:

```groovy
// build.gradle.kts
plugins {
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
}
```

```java
// FlamingockConfig.java
@Configuration
@EnableFlamingock(
    stages = { @Stage(location = "com.acme.inventory.changes") }
)
public class FlamingockConfig {

    @Bean
    public MongoDBSpringDataAuditStore auditStore(MongoTemplate mongoTemplate) {
        return MongoDBSpringDataAuditStore.from(mongoTemplate);
    }
}
```

### 5. Verify and run

Start the application. Flamingock should initialize, discover the configured stage, and apply any pending changes. Restart it — the same changes must not re-execute.

---

## 💎 Benefits of the agentic approach

- **Correctness**: The agent follows the exact Flamingock API — no guessed method names, no invented configuration keys.
- **Consistency**: Every project gets the same setup patterns, regardless of which developer or agent generates them.
- **Safety**: Guards in the skill prevent common mistakes before any code is written.
- **Speed**: From "I need to set up Flamingock" to a working, production-ready configuration in seconds.
