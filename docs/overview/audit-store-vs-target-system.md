---
title: Target Systems vs Audit Store
sidebar_position: 100
---

# Target Systems vs Audit Store
*Understanding Flamingock's dual-system design for enterprise safety*

Flamingock's architecture separates business changes from execution tracking through two distinct system types. This separation is fundamental to Flamingock's safety guarantees and competitive advantages.

---

## The Dual-System Architecture

### Target Systems: Where Changes Are Applied
**Target Systems** are your business systems where actual changes happen:

- **Examples**: User database, Product catalog, Order management system, Kafka topics, S3 buckets, REST APIs
- **Purpose**: Store and process your business data and configurations
- **Modified by**: Your business logic through ChangeUnits
- **Configuration**: See [Target System Configuration](../flamingock-library-config/target-system-configuration.md) for technical setup

### Audit Store: Where Execution Is Tracked  
**Audit Store** is Flamingock's dedicated system for tracking what happened:

- **Examples**: Flamingock Cloud backend or dedicated audit table/collection in the user's database. 
- **Purpose**: Record execution history, compliance data, issue tracking
- **Modified by**: Flamingock framework automatically (never your code)
- **Configuration**: See [Audit Store Configuration](../flamingock-library-config/audit-store-configuration.md) for technical setup

---

## Why This Separation Matters

### Enterprise Safety Benefits
1. **Complete Audit Trail**: Every change attempt is recorded regardless of business system failures
2. **Governance Separation**: Business data and compliance data have different access patterns
3. **Recovery Capabilities**: Operations team can resolve issues by reading audit state, not business data
4. **Compliance Independence**: Audit integrity is maintained even during business system issues

---

## Target System Types

### Transactional Target Systems
Systems with native ACID transaction support (PostgreSQL, MySQL, MongoDB 4.0+):

**Safety and Coordination:**
- **Community Edition**: Reliable execution tracking and recovery capabilities
- **Cloud Edition**: Advanced coordination protocols ensure complete recoverability

### Non-Transactional Target Systems
Systems without native transaction support (Kafka, S3, REST APIs, File Systems):

**Safety and Coordination:**
- **Community Edition**: Reliable execution tracking and rollback-based recovery
- **Cloud Edition**: Enhanced recoverability with custom validation options

---

## How It Works

```
     Your ChangeUnits:
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
                 ChangeUnit #1  │───────────────────────────┐
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
                  ChangeUnit #2 │───────────────────────────┐
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
                  ChangeUnit #3 └───────────────────────────┐
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
1. **You create ChangeUnits** - Define what changes need to happen
2. **Flamingock orchestrates** - Safely applies changes across all your systems  
3. **Target systems evolve** - Your business systems get updated
4. **Audit store tracks everything** - Complete history for compliance and recovery

---

## Key Takeaways

### For Developers
- **Target Systems**: Where your business logic runs and makes changes
- **Audit Store**: Automatically managed by Flamingock for tracking and compliance
- **Implementation**: See [Target System Configuration](../flamingock-library-config/target-system-configuration.md) and [Audit Store Configuration](../flamingock-library-config/audit-store-configuration.md)

### For Architects  
- **Clean Separation**: Business logic separated from execution tracking
- **Enterprise Scalability**: Architecture supports compliance, governance, multi-environment
- **Flexibility**: Works with any target system type (transactional, non-transactional, hybrid)

### For Operations
- **Issue Resolution**: Tools operate on audit store, you fix target systems
- **Compliance**: Complete audit trail independent of business system availability  
- **Recovery**: Always know the state, even during complex failure scenarios

**Bottom Line**: This dual-system architecture is what enables Flamingock to provide enterprise-grade safety and governance capabilities that traditional tools cannot match.
