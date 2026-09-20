---
title: Target systems vs audit store
sidebar_position: 40
---

# Target systems vs audit store
*Understanding Flamingock’s dual-system model for safe, controlled evolution*

Flamingock works with two closely related concepts:

- The **Target System** — where your application applies real, versioned changes.
- The **Audit Store** — where Flamingock keeps one mutable current-state record per Change.

Although they are conceptually distinct, the Audit Store is not an entirely separate system.
Instead, it is **a specialized form of a Target System**, created from a Target System that supports this role and used exclusively for audit tracking.

This relationship is not about sharing configuration: the Audit Store is built from a Target System because **both must point to the same external system**. A Target System represents an external system that Flamingock can modify, while the Audit Store represents *that same external system* in audit mode, used only for Flamingock's latest recorded state per Change. Internally, the Audit Store derives its connection settings from the Target System but uses its own access handle, keeping audit operations isolated while ensuring both components operate on the same underlying environment.

This separation — yet tight relationship — is key to Flamingock’s safety model.

:::tip Clarification
Flamingock can register multiple Target Systems, but only one of them is used as the base for the Audit Store
:::


---

## Quick definitions (TL;DR)

**Target System →**  The external system where Flamingock applies your changes (e.g., a database, a schema registry, object storage, or an API).

**Audit Store →**  A Target System that supports audit tracking and is used to record what Flamingock executed.
*(Only some Target Systems support this role.)*

---

## Target Systems: where your changes happen

A **Target System** is any external system your application depends on and where Flamingock applies your changes.

Typical examples:

- Databases (MongoDB, SQL, DynamoDB, Couchbase)
- Kafka Schema Registry
- Kafka topics
- S3/object storage
- External configuration stores
- REST APIs or service endpoints

The Target System represents your *business system*:
it stores the data, schemas, state or configuration that your application relies on.

Flamingock applies real changes here — safely, sequentially, and in a controlled manner.

For setup details, see:
**[Target Systems › Introduction](../target-systems/introduction.md)**

---

## Audit Store: current Flamingock state

The **Audit Store** keeps one mutable current-state record per Change, updated with the latest state Flamingock recorded. A recorded state can be successful or may require investigation of the Target System before recovery can continue. It supports idempotency, distributed coordination, and recovery.

From `<VERSION>`, Journal Events capture internal transition events for synchronization with Flamingock Cloud. Every edition retains local audit, lock, and journal resources. Cloud Edition is coming soon and provides a complete historical audit and event view; see [Audit Stores](../audit-stores/introduction.md) for the architecture and provider setup.

---

# The Audit Store is a specialized Target System

Although conceptually separate, the Audit Store is **not a new database**, nor a new cluster, nor a separate connection.

Instead:

### ✔ It is built from an existing Target System

### ✔ It reuses the same driver and connection settings, but creates its own internal access handle

### ✔ It adds only the minimal configuration needed for auditing

In practice, the Audit Store is simply:

> **the same Target System (when it supports audit tracking) running in audit mode.**

It uses the same underlying configuration (driver, client, database/namespace),
but through **its own internal object**, ensuring isolation from the Target System’s business operations.

---

## Why separate the concepts?

Although the Audit Store is built from a Target System, separating the concepts keeps Flamingock's control state distinct from the business state changed by your application.

### 1. Different responsibilities

- **Target System** holds the business data, configuration, or effects of a Change.
- **Audit Store** keeps Flamingock's current control state for each Change.

This keeps execution coordination and recovery state separate from application business data.

### 2. Predictable recovery

The recorded state helps Flamingock determine whether a Change is already applied or needs recovery. When a state requires investigation, determine the Change's actual effect in the Target System, then use the supported issue-resolution workflow.

### 3. Operational isolation

The Audit Store derives its connection settings from the supporting Target System but uses a dedicated internal access handle for audit operations. This keeps Flamingock's control operations isolated from business operations.

### 4. Governance and visibility

The separation gives Flamingock a consistent control model across Target Systems. Flamingock Cloud complements that model with a complete historical audit and event view across services and environments.

## How it works (visual overview)

```
     Your Changes:
     ┌──────────────────────────────────────────────────────────────────────────┐
     │ 1. Change[UpdateKafkaSchema] → Target System[Kafka Schema Registry]      │
     │ 2. Change[SeedKafkaEvents]   → Target System[Kafka Topics]               │
     │ 3. Change[AddUserStatus]     → Target System[User Database]              │
     └──────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      Flamingock       │
                    │    (Orchestrator)     │
                    └───────────────────────┘
                                │
                                │ Executes sequentially
                                │
                 Change #1      │───────────────────────────┐
            (UpdateKafkaSchema) │                           │
                                │                           │
                                │             ┌─────────────┴────────────┐
                                │             ▼                          ▼
                                │     ┌─────────────────────┐      ┌──────────────┐
                                │     │   Target System:    │      │ Audit Store  │
                                │     │ ┌─────────────────┐ │      │              │
                                │     │ │ Schema Registry │ │      │   Records:   │
                                │     │ └─────────────────┘ │      │ #1 applied   │
                                │     │  (applies change)   │      │              │
                                │     └─────────────────────┘      └──────────────┘
                                │
                                │
                  Change #2     │───────────────────────────┐
              (SeedKafkaEvents) │                           │
                                │                           │
                                │             ┌─────────────┴────────────┐
                                │             ▼                          ▼
                                │     ┌─────────────────────┐      ┌──────────────┐
                                │     │   Target System:    │      │ Audit Store  │
                                │     │ ┌─────────────────┐ │      │              │
                                │     │ │  Kafka Topics   │ │      │   Records:   │
                                │     │ └─────────────────┘ │      │ #2 applied   │
                                │     │  (applies change)   │      │              │
                                │     └─────────────────────┘      └──────────────┘
                                │
                                │
                  Change #3     └───────────────────────────┐
                (AddUserStatus)                             │
                                                            │
                                              ┌─────────────┴────────────┐
                                              ▼                          ▼
                                      ┌─────────────────────┐      ┌──────────────┐
                                      │   Target System:    │      │ Audit Store  │
                                      │ ┌─────────────────┐ │      │              │
                                      │ │  User Database  │ │      │   Records:   │
                                      │ └─────────────────┘ │      │ #3 applied   │
                                      │  (applies change)   │      │              │
                                      └─────────────────────┘      └──────────────┘

```


**Summary of the flow:**

1. **You define changes**
2. **Flamingock executes them safely**
3. **Target Systems evolve**
4. **Audit Store captures the execution result**

This is the foundation of Flamingock’s safety guarantees.

---

## Key takeaways

### For developers
- Target Systems → where changes actually happen
- Audit Store → automatically maintained by Flamingock
- You never write to the Audit Store yourself

### For architects
- Clean separation of business vs control responsibilities
- Consistent behaviour across environments
- Predictable recovery even in distributed systems

### For operations
- Diagnose issues using audit data
- Always know the exact execution state
- Avoid duplicates and inconsistent partial updates

---

## Bottom line

> **Flamingock’s dual-system model (where the Audit Store is a specialization of the Target System) is what enables safe, predictable and auditable evolution of distributed systems.**

It supports safe, predictable, and auditable evolution, including recovery when the latest recorded state requires investigation of the Target System.

