---
id: overview
title: Overview
sidebar_position: 0
---

# Flamingock Documentation


**Flamingock** brings *Change-as-Code (CaC)* to your entire stack.
It applies **versioned, auditable changes** to the external systems your application depends on — such as schemas, message brokers, databases, APIs, cloud services, and any other external system your application needs.

Unlike infrastructure-as-code tools, Flamingock runs **inside your application** (or via the **CLI**).
It ensures these systems evolve **safely, consistently, and in sync with your code at runtime**.

👉 For a deeper explanation, see the [Introduction](./get-started/Introduction)

---

## 🔎 What It Looks Like

A simple change in Flamingock:

```java
@TargetSystem("user-database")
@Change(id = "create-users-collection", author = "dev-team")
public class _0001__CreateUsersCollection {
    @Apply
    public void apply(MongoDatabase db) {
        db.createCollection("users");
    }
}
```

*When your app starts, Flamingock applies this change and records it in the Audit Store.*


## 🚀 Getting Started

- 👉 [What is Flamingock?](./get-started/introduction) – learn the core ideas and principles
- 👉 [Quick Start](./get-started/quick-start) – set up Flamingock in minutes
- 👉 [Core Concepts](./get-started/core-concepts) – understand the building blocks
- 👉 [FAQ](./resources/faq) – Frequently asked questions
- 👉 [Agentic Coders](./resources/agentic-coders) – Using Flamingock with AI assistants

---

## 🛠 Editions

| Edition                        | Description                                                                |
|--------------------------------|----------------------------------------------------------------------------|
| 🟢 **Community Edition (CE)**  | Open-source, library only                                                  |
| ☁️ **Cloud Edition**           | SaaS with dashboard, observability, and premium features **(coming soon)** |
| 🏢 **Self-Hosted Edition**     | Same as Cloud, deployable in your infrastructure **(coming soon)**         |


---

## 🔍 Resources

- [GitHub repository](https://github.com/flamingock/flamingock-java)
- [Examples GitHub repository](https://github.com/flamingock/flamingock-java-examples)
- [Skills repository (Agentic Coders)](https://github.com/flamingock/flamingock-skills)
- [Releases](https://github.com/flamingock/flamingock-java/releases)
- [Issue tracker](https://github.com/flamingock/flamingock-java/issues)
