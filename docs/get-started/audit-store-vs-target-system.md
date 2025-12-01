---
title: Target systems vs audit store
sidebar_position: 40
---


# Target systems vs audit store
*Understanding Flamingock's dual-system design for enterprise safety*

Flamingock operates with two complementary concepts:
the **Target System** (where real changes are applied) and the **Audit Store** (where the execution history of those changes is recorded).

Although they serve different purposes, they are closely related.
In fact, the **Audit Store is a specialized form of a Target System**, designed specifically for audit tracking.

This page explains both concepts and how they work together.


## The dual-system architecture

### Target systems: where changes are applied
**Target systems** are the systems your application depends on — the places where Flamingock applies the actual Changes.

- **Examples**: User database, product catalog, order management system, Kafka topics, S3 buckets, REST APIs  
- **Purpose**: Store and process your business data or business-related artifacts  
- **Modified by**: Your business logic inside Flamingock ChangeUnits  
- **Configuration**: See [Target Systems](../target-systems/introduction.md) for setup details


### Audit store: where execution is tracked
The **Audit Store** records what Flamingock executed:

- **Examples**: Flamingock Cloud backend, or an audit table/collection inside your existing database  
- **Purpose**: Track execution history, ensure idempotency, provide auditability and recovery metadata  
- **Modified by**: Flamingock automatically — never by your business code  
- **Configuration**: See [Audit Stores](../audit-stores/introduction.md)



# The Audit Store is a Specialized Target System

Although conceptually separate, the Audit Store is **not a separate infrastructure layer** and does **not** require its own drivers or connections.

Instead:

**✔ It is created from an existing Target System**  
**✔ It reuses the same underlying connection**  
**✔ It adds only the minimal configuration needed for auditing**  

This design keeps everything simple and consistent.

### How the Audit Store is created
You always build an Audit Store **from** a Target System, not independently.

What this means:

- The Audit Store **inherits the driver/client** from the Target System  
- It **inherits the database/bucket/schema/namespace**  
- It **does not inherit** user-specific driver options such as read preference, timeouts or consistency policies  
- It only adds what it needs:
  - the audit collection/table  
  - audit-store–specific metadata or naming  
  - internal configuration required by Flamingock  

**You do not create new connections.  You do not duplicate configuration.**

The Audit Store is simply the Target System “in audit mode,” optimized for safe tracking.


## Why this conceptual separation matters

Even though the Audit Store is built from a Target System, separating the **concepts** brings clarity and safety:

### 1. Clear responsibility boundaries
- **Target System** → holds *business data*  
- **Audit Store** → holds *execution metadata*

### 2. Better governance
Audit data often requires different retention, access rules, or compliance constraints than business data.

### 3. Reliable recovery
If something fails, Flamingock uses the Audit Store (not your business system) to know exactly what was executed and what remains pending.

### 4. Adoption flexibility
Teams can place the Audit Store in:
- Flamingock Cloud  
- or a separate collection/table in the same Target System  
- or a different Target System entirely  

The conceptual split makes this flexible.

## How it works

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

**The Flow:**
1. **You create Changes** - Define what changes need to happen
2. **Flamingock orchestrates** - Safely applies changes across all your systems
3. **Target systems evolve** - Your business systems get updated
4. **Audit store tracks everything** - Complete history for compliance and recovery


## Key takeaways

### For developers
- **Target systems**: Where your business logic runs and makes changes
- **Audit store**: Automatically managed by Flamingock for tracking and compliance
- **Implementation**: See [Target Systems](../target-systems/introduction.md) and [Audit Stores](../audit-stores/introduction.md)

### For architects
- **Clean separation**: Business logic separated from execution tracking
- **Enterprise scalability**: Architecture supports compliance, governance, multi-environment
- **Flexibility**: Works with any target system type (transactional, non-transactional, hybrid)

### For operations
- **Issue resolution**: Tools operate on audit store, you fix target systems
- **Compliance**: Complete audit trail independent of business system availability
- **Recovery**: Always know the state, even during complex failure scenarios

**Bottom Line**: This dual-system architecture is what enables Flamingock to provide enterprise-grade safety and governance capabilities that traditional tools cannot match.
