---
sidebar_position: 10
sidebar_label: Introduction
title: " "
---

# Introduction

Flamingock is a change management framework that ensures your distributed systems evolve safely and consistently. It applies versioned, auditable changes to any target system (message brokers, APIs, cloud services, databases, and any other external service) with guaranteed safety and recovery mechanisms.

## Core principles

### Safety by default
When Flamingock cannot guarantee a safe outcome, it stops and requires manual intervention. This prevents silent data corruption and ensures predictable deployments.

### Complete auditability
Every change execution is tracked in an audit store, providing a complete history of what was applied, when, by whom, and with what result.

### Recovery strategies
Configurable recovery mechanisms determine how Flamingock handles failures:
- **Manual intervention** (default): Stops on failure and requires human review
- **Always retry**: Automatically retries idempotent operations  


## Target systems

Flamingock can apply changes to any external service your application interacts with. Examples include:
- **Message brokers**: Kafka, RabbitMQ, AWS SQS
- **Cloud services**: S3, Lambda, API Gateway
- **APIs**: REST endpoints, GraphQL schemas
- **Configuration systems**: Feature flags, vault secrets
- **Databases**: SQL (PostgreSQL, MySQL) and NoSQL (MongoDB, DynamoDB)
- **And any other external system** your application needs to evolve

## Architecture overview

### ChangeUnits
The fundamental unit of change. Each ChangeUnit:
- Has a unique identifier and execution order
- Targets a specific system
- Contains execution and rollback logic
- Is executed exactly once

### Audit store vs target system
- **Audit store**: Where Flamingock tracks execution history (managed by Flamingock)
- **Target system**: Where your business changes are applied (any external service your application interacts with)

### Execution flow
1. Application startup triggers Flamingock
2. Flamingock discovers all ChangeUnits
3. Checks audit store for pending changes
4. Acquires distributed lock
5. Executes changes in order
6. Records results in audit store
7. Handles failures according to recovery strategy  


## Next steps
- [Quick start](quick-start.md) - Minimum setup to run Flamingock
- [Core concepts](core-concepts.md) - Detailed explanation of key concepts
- [Audit store vs target system](audit-store-vs-target-system.md) - Understanding the dual-system architecture  
