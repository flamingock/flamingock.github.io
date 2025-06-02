---
sidebar_position: 2
---

# Core Concepts

### 📦 ChangeUnits
**ChangeUnits** are the fundamental structure that hold your change logic. They are executed atomically and versioned for traceability. They represent any kind of change applied to a system, such as configuration modifications, API calls, data migration, etc.

Each ChangeUnit includes:
- Unique ID and metadata
- Execution logic (e.g., Java, YAML, or no-code template)
- Rollback capability

### 📋 Auditing
Flamingock includes built-in **auditing** for full traceability of executed changes.
- Stores metadata about each executed ChangeUnit: timestamp, status, user, and system
- Useful for compliance, debugging, and visibility
- Can be extended to external observability platforms (e.g., ELK, Prometheus, Datadog)

### 🗄️ Audit store vs. Target system

- **Audit Store**: The dedicated location where Flamingock records metadata about change executions. Its sole purpose is to track which ChangeUnits ran, when, and with what outcome—ensuring idempotency, rollbacks, and distributed coordination. This might be a user-provided database (Community Edition) or Flamingock’s cloud backend (Cloud Edition).

- **Target System**: The external resource that ChangeUnits operate upon (e.g., a database schema, S3 bucket, Kafka topic, or configuration service). Flamingock’s ChangeUnits apply changes to these systems in an ordered, auditable fashion. When a database serves as both target and audit store, Flamingock can wrap change and audit insert in one transaction; otherwise, auditing and execution occur separately.

:::tip
To better understand the differences between Audit store and target system, please se the [Audit store vs target system section](../audit-store-vs-target-system.md)
:::

---

### 🏃 Runner
The **Runner** is the heart of Flamingock's execution lifecycle. It's responsible for scanning, orchestrating, and executing ChangeUnits at application startup (or on-demand).

It can be embedded in your application or run as an independent service in distributed environments.

### 🔌 Driver
A **Driver** acts as an adapter between Flamingock and the underlying technology it integrates with (e.g., MongoDB, DynamoDB, SaaS services, configuration systems). Each driver ensures compatibility with its target system, managing low-level tasks such as locking, transactional behavior, and audit logging.

---

### 🔁 Transaction Handling
Flamingock supports **transactional consistency** where possible:
- For databases that support ACID transactions (like MongoDB), Flamingock ensures ChangeUnits run atomically.
- For non-transactional systems (e.g., HTTP APIs), Flamingock uses compensating actions (rollbacks) and auditing to maintain integrity.

### 🔙 Rollbacks
Each ChangeUnit can define rollback logic:
- For providing safe reversion in the case of non-transactional operations
- For reverting to a previous version of the software ('UNDO'), invoked via the CLI

---

### 🧩 Templates
Flamingock introduces **change templates** for low-code/no-code use cases. These are YAML or JSON-based definitions that let teams describe changes declaratively—especially useful for config changes and SaaS integrations.

Templates are:
- Extensible and version-controlled
- Friendly to non-developer users

---

### 🔄 Workflows
Workflows group and coordinate multiple ChangeUnits, grouped into stages. In future releases, they will support:
- **Sequential** or **parallel** execution
- **Conditional branching** (e.g., only run if previous unit succeeded)

This will enable advanced orchestration logic during deployments or upgrades.

---

### 🔒 Distributed Locking
To ensure safe execution in multi-instance deployments, Flamingock uses a distributed lock mechanism. This guarantees:
- Avoidance of duplicate execution or race conditions
- Synchronisation between multiple runners
- Coordination across microservices in distributed environments

It supports multiple lock implementations (e.g., MongoDB, Redis, DynamoDB).

---

Stay tuned for deeper dives into each of these areas, including advanced usage, customization, and integration guides.