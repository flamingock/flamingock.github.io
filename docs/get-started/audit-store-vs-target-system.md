---
title: Target systems vs audit store
sidebar_position: 40
---

# Target systems vs audit store
*Understanding Flamingock's dual-system design for enterprise safety*

Flamingock's architecture separates business changes from execution tracking through two distinct system types. This separation is fundamental to Flamingock's safety guarantees and competitive advantages.


## The dual-system architecture

### Target systems: where changes are applied
**Target systems** are your business systems where actual changes happen:

- **Examples**: User database, Product catalog, Order management system, Kafka topics, S3 buckets, REST APIs
- **Purpose**: Store and process your business data and configurations
- **Modified by**: Your business logic through Changes
- **Configuration**: See [Target Systems](../target-systems/introduction.md) for technical setup

### Audit store: where execution is tracked
**Audit store** is Flamingock's dedicated system for tracking what happened:

- **Examples**: Flamingock Cloud backend or dedicated audit table/collection in the user's database.
- **Purpose**: Record execution history, compliance data, issue tracking
- **Modified by**: Flamingock framework automatically (never your code)
- **Configuration**: See [Audit Stores](../audit-stores/introduction.md) for technical setup


## Why this separation matters

### Enterprise safety benefits
1. **Complete Audit Trail**: Every change attempt is recorded regardless of business system failures
2. **Governance Separation**: Business data and compliance data have different access patterns
3. **Recovery Capabilities**: Operations team can resolve issues by reading audit state, not business data
4. **Compliance Independence**: Audit integrity is maintained even during business system issues


## Target system types

### Transactional target systems
Systems with native ACID transaction support (PostgreSQL, MySQL, MongoDB 4.0+):

**Safety and coordination:**
- **Community Audit Stores**: Reliable execution tracking and recovery capabilities
- **Cloud Edition**: Advanced coordination protocols ensure complete recoverability

### Non-transactional target systems
Systems without native transaction support (Kafka, S3, REST APIs, File Systems):

**Safety and coordination:**
- **Community Audit Stores**: Reliable execution tracking and rollback-based recovery
- **Cloud Edition**: Enhanced recoverability with custom validation options


## Audit store types

### Cloud Edition audit store
Flamingock Cloud provides a fully managed audit store with superior synchronization and recovery through advanced coordination protocols, real-time dashboards, advanced analytics, and multi-environment governance.

### Community audit stores
User-provided audit store (MongoDB, DynamoDB, Couchbase, SQL) that ensures complete execution tracking, prevents duplicate executions, and provides basic recovery capabilities. See [Audit stores](../audit-stores/introduction.md) for setup.



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
