---
title: Target systems vs audit store
sidebar_position: 40
---

# Target systems vs audit store
*Understanding Flamingock’s dual-system model for safe, controlled evolution*

Flamingock works with two closely related concepts:

- The **Target System** — where your application applies real, versioned changes.
- The **Audit Store** — where Flamingock records the execution history of those changes.

Although they are conceptually distinct, the Audit Store is not an entirely separate system.  
Instead, it is **a specialized form of a Target System**, created from a Target System that supports this role and used exclusively for audit tracking.

This separation — yet tight relationship — is key to Flamingock’s safety model.

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

## Audit Store: where execution is tracked

The **Audit Store** is where Flamingock records the state of every changes:

- when it ran  
- in what order  
- in which environment  
- its execution status  
- and all relevant metadata

Its purpose:

- Ensure idempotency  
- Prevent duplicate execution  
- Provide a reliable audit trail  
- Enable safe recovery after failures  
- Give full visibility into system evolution  

For setup details, see:  
**[Audit Stores › Introduction](../audit-stores/introduction.md)**

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

Even though the Audit Store is technically built from a Target System, separating the **concepts** gives you clear guarantees:

### 1. Different responsibilities
- **Target System →** business data  
- **Audit Store →** execution history  

This prevents mixing operational data with audit metadata.

### 2. Predictable recovery
If something fails halfway:

- Flamingock consults the **Audit Store**, not the business system.
- Flamingock knows exactly what ran and what hasn’t.
- Flamingock can safely resume or stop.

### 3. Governance and compliance
Audit data often has:

- different retention rules  
- different permissions  
- stricter access controls  
- different visibility requirements  

The conceptual separation supports this.

### 4. Deployment flexibility
You can store the audit history in:

- **Flamingock Cloud**, or  
- a local collection/table in the same Target System, or  
- a separate Target System altogether  

The model works consistently in all cases.

---

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
4. **Audit Store captures the complete execution history**  

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

It ensures that changes are applied once, tracked forever, and recoverable at any time — regardless of failures, concurrency, or distributed complexity.

