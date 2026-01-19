---
sidebar_position: 10
sidebar_label: Introduction
title: " "
---

# Introduction

**Flamingock** brings *Change-as-Code (CaC)* to your entire stack.  
It applies **versioned, auditable changes** to the external systems your application depends on — such as schemas, message brokers, databases, APIs, cloud services, and any other external system your application needs.  

Unlike infrastructure-as-code tools, Flamingock runs **inside your application** (or via the **CLI**).  
It ensures these systems evolve **safely, consistently, and in sync with your code at runtime**.  


---

### What Flamingock manages
Flamingock focuses on **application-level changes** that your code requires to run safely:

- Database schemas and reference data  
- Message queues and schemas  
- APIs and configuration values  
- Cloud service resources directly tied to your application  
- Configuration changes (feature flags, secrets, runtime values)  

### What Flamingock does *not* manage
Flamingock is **not an infrastructure-as-code tool**. It does not provision servers, clusters, or networks — those belong in Terraform, Pulumi, or similar. Instead, Flamingock **complements them by handling the runtime changes your application depends on**.

---

## Core principles

### 🔒 Safety by default
When Flamingock cannot guarantee a safe outcome, it stops and requires manual intervention. This prevents silent data corruption and ensures predictable deployments.

### 📝 Complete auditability
Every change execution is tracked in an audit store, providing a complete history of what was applied, when, by whom, and with what result.

### 🔄 Recovery strategies
Configurable mechanisms determine how Flamingock handles failures:
- **Manual intervention** (default): stops on failure and requires human review  
- **Always retry**: automatically retries idempotent operations  

---

## Target systems

Flamingock can apply changes to any external system your application interacts with. Examples include:

- **Message brokers**: e.g. Kafka, RabbitMQ, AWS SQS  
- **Cloud services**: e.g. S3, Lambda, API Gateway  
- **Databases**: SQL (e.g. PostgreSQL, MySQL) and NoSQL (e.g. MongoDB, DynamoDB)  
- **APIs**: e.g. REST endpoints, GraphQL schemas  
- **Configuration systems**: e.g. feature flags, vault secrets  
- **And any other external system** your application needs to evolve  

---

## Architecture overview

### Changes
The fundamental unit of change. Each **Change**:
- Has a unique identifier and execution order  
- Targets a specific system  
- Contains execution logic (and optionally rollback logic)  
- Is executed exactly once  

### Audit store vs target system
- **Audit store** → where Flamingock tracks execution history (managed by Flamingock).  
- **Target system** → where your business changes are applied (any external system your application interacts with).  

### Execution flow
1. Application startup (or CLI invocation) triggers Flamingock  
2. Flamingock discovers all Changes  
3. Checks audit store for pending changes  
4. Acquires a distributed lock  
5. Executes changes in order  
6. Records results in the audit store  
7. Handles failures according to the configured recovery strategy  

---

## Next steps
- [Quick start](quick-start.md) – minimum setup to run Flamingock  
- [Core concepts](core-concepts.md) – detailed explanation of key concepts  
- [Changes](../changes/introduction.md) – anatomy and execution of Changes  
