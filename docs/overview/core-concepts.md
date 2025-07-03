---
sidebar_position: 80
---

# Core Concepts

### 📦 ChangeUnits
**ChangeUnits** are the fundamental structure that hold your change logic. They are executed atomically and versioned for traceability. They represent any kind of change applied to a system, such as configuration modifications, API calls, data migration, etc.

Each ChangeUnit includes:
- Unique ID and metadata
- Execution logic (e.g., Java, YAML, or no-code template)
- Rollback capability

For a deeper dive around ChangeUnits, see the [ChangeUnits deep dive](../flamingock-library-config/changeunits-deep-dive.md) section.

### 📋 Auditing
Flamingock includes built-in **auditing** for full traceability of executed changes.
- Stores metadata about each executed ChangeUnit: timestamp, status, user, and system
- Useful for compliance, debugging, and visibility
- Can be extended to external observability platforms (e.g., ELK, Prometheus, Datadog)

### 🗄️ Audit store vs. Target system

- **Audit store**: The dedicated location where Flamingock records metadata about change executions. Its sole purpose is to track which ChangeUnits ran, when, and with what outcome—ensuring idempotency, rollbacks, and distributed coordination. This might be a user-provided database (Community Edition) or Flamingock’s cloud backend (Cloud Edition).

- **Target system**: The external resource that ChangeUnits operate upon (e.g., a database schema, S3 bucket, Kafka topic, or configuration service). Flamingock’s ChangeUnits apply changes to these systems in an ordered, auditable fashion. When a database serves as both audit store and target system, Flamingock can wrap change and audit insert in one transaction; otherwise, auditing and execution occur separately.

:::tip
To better understand the differences between Audit Store and Target System, see the [Audit store vs target system section](./audit-store-vs-target-system.md)
:::

---

### 🏃 Runner
The **Runner** is the heart of Flamingock’s execution lifecycle. It’s responsible for:
- Scanning, orchestrating, and executing ChangeUnits at application startup (or on-demand)
- Coordinating interactions with the Audit Store (via its Driver)

It can be embedded in your application or run as an independent service in distributed environments.

### 🔌 Driver
A **Driver** acts as an adapter between Flamingock and the Audit Store. It manages all low-level interactions required for:
- Writing audit-log entries when a ChangeUnit runs
- Acquiring and releasing distributed locks
- Querying execution history to prevent duplicate runs

Depending on the edition, the Driver may connect to a user-provided database (CE) or Flamingock’s cloud backend (Cloud Edition). It does *not* perform any Target System changes—that responsibility lies fully with the ChangeUnit code.

---

### 🔁 Transaction handling
Flamingock supports **transactional consistency** where possible:

- **When the target System is also a database supporting ACID transactions** (like MongoDB), Flamingock ensures that a ChangeUnit’s operation on the target System and its audit-log insert into the Audit Store commit together as a single transaction.
- **When the target System does not support transactions** (e.g., HTTP APIs, file systems, or message brokers), Flamingock uses compensating actions (rollbacks) and auditing to maintain integrity.

For a deeper dive around Transactions, see the [Transactions](../flamingock-library-config/transactions.md) section.

### 🔙 Rollbacks
Each ChangeUnit can define rollback logic:
- For safe reversion when operating against non-transactional systems
- For reverting to a previous version of the software ("Undo"), invoked via the CLI

---

### 🧩 Templates
Flamingock introduces **change templates** for low-code use cases. These are YAML or JSON-based definitions that let teams describe changes declaratively—especially useful for configuration changes and SaaS integrations.

Templates are:
- Extensible and version-controlled
- Friendly to non-developer users

For a deeper dive around Templates, see the [Templates](../templates/templates-introduction.md) section.

---

### 🔄 Workflows
Workflows group and coordinate multiple ChangeUnits into stages. In future releases, they will support:
- **Sequential** or **parallel** execution
- **Conditional branching** (e.g., only run if a previous unit succeeded)

This will enable advanced orchestration logic during deployments or upgrades.

For a deeper dive around Workflows, see the [Pipelines and stages](../flamingock-library-config/pipeline-and-stages.md) section.

---

### 🔒 Distributed Locking
To ensure safe execution in multi-instance deployments, Flamingock uses a distributed lock mechanism. This guarantees:
- Avoidance of duplicate execution or race conditions
- Synchronisation between multiple runners
- Coordination across microservices in distributed environments

It supports multiple lock implementations (e.g., MongoDB, Redis, DynamoDB).


For a deeper dive around distributed locks, see the [Distributed locking](../flamingock-library-config/lock-configuration.md) section.

---

### 📣 Events
Flamingock is able to notify your Application around the execution status of changes via Events.

For a deeper dive around Events, see the [Events](../flamingock-library-config/events.md) section.