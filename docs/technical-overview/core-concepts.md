---
sidebar_position: 2
---

# Core Concepts

### 📦 ChangeUnits
**ChangeUnits** are the fundamental structure that hold your change logic. They are executed atomically and versioned for traceability. They represent any kind of change applied to a system, such as data migrations, API calls, or configuration modifications.

Each ChangeUnit includes:
- Unique ID and metadata
- Execution logic (e.g., Java, YAML, or no-code template)
- Rollback capability

### 🏃 Runner
The **Runner** is the heart of Flamingock's execution lifecycle. It's responsible for scanning, orchestrating, and executing ChangeUnits at application startup (or on-demand).

It can be embedded in your application or run as an independent service in distributed environments.

### 🔌 Driver
A **Driver** acts as an adapter between Flamingock and the underlying technology it integrates with (e.g., MongoDB, DynamoDB, SaaS services, configuration systems). Each driver ensures compatibility with its target system, managing low-level tasks such as locking, transactional behavior, and audit logging.

### 🔁 Transaction Handling
Flamingock supports **transactional consistency** where possible:
- For databases that support ACID transactions (like MongoDB), Flamingock ensures ChangeUnits run atomically.
- For non-transactional systems (e.g., HTTP APIs), Flamingock uses compensating actions (rollbacks) and auditing to maintain integrity.

### 🔙 Rollbacks
Each ChangeUnit can optionally define rollback logic:
- For automatic reversion in case of failure
- For manual invocation when reverting environments
- Rollbacks can be defined via code, templates, or external scripts

### 🧩 Templates
Flamingock introduces **change templates** for low-code/no-code use cases. These are YAML or JSON-based definitions that let teams describe changes declaratively—especially useful for config changes and SaaS integrations.

Templates are:
- Extensible and version-controlled
- Friendly to non-developer users
- Compatible with CI/CD pipelines

### 🔄 Workflows
Workflows group and coordinate multiple ChangeUnits. In future releases, they will support:
- **Sequential** or **parallel** execution
- **Conditional branching** (e.g., only run if previous unit succeeded)

This will enable advanced orchestration logic during deployments or upgrades.

### 🔒 Distributed Locking
To ensure safe execution in multi-instance deployments, Flamingock uses a distributed lock mechanism. This guarantees:
- One active runner at a time per target system
- Avoidance of duplicate execution or race conditions
- Coordination across microservices in distributed environments

It supports multiple lock implementations (e.g., MongoDB, Redis, DynamoDB).

### 📋 Auditing
Flamingock includes built-in **auditing** for full traceability of executed changes. 
- Stores metadata about each executed ChangeUnit: timestamp, status, user, and system
- Useful for compliance, debugging, and visibility
- Can be extended to external observability platforms (e.g., ELK, Prometheus, Datadog)

---

Stay tuned for deeper dives into each of these areas, including advanced usage, customization, and integration guides.