# Flamingock Technical Overview

Welcome to the **Technical Overview** of Flamingock. Built as a cloud-native system change management and changes audit framework, Flamingock extends the robust foundations of Mongock beyond NoSQL databases to a broader set of systems and services.

This document defines Flamingock's core concepts and provides a high-level architecture overview to help you get up and running with confidence.

- [Flamingock Technical Overview](#flamingock-technical-overview)
  - [🏗️ Architectural Overview](#️-architectural-overview)
    - [🔍 Architecture Highlights](#-architecture-highlights)
      - [More detailed process steps](#more-detailed-process-steps)
  - [🔑 Core Concepts](#-core-concepts)
    - [📦 ChangeUnits](#-changeunits)
    - [🏃 Runner](#-runner)
    - [🔌 Driver](#-driver)
    - [🔁 Transaction Handling](#-transaction-handling)
    - [🔙 Rollbacks](#-rollbacks)
    - [🧩 Templates](#-templates)
    - [🔄 Workflows](#-workflows)
    - [🔒 Distributed Locking](#-distributed-locking)
    - [📋 Auditing](#-auditing)

---

## 🏗️ Architectural Overview

![Flamingock Architecture Diagram](../../static/img/Flamingock%20Arch%20HLD.png)

### 🔍 Architecture Highlights

In a nutshell, the Flamingock process takes all the pending changes and executes them in order during your Application startup process.

1. **Application Startup**  → Initializes the **Runner**.
2. **Runner** scans and loads all registered **ChangeUnits**.
3. **Drivers** communicate with underlying Flamingock Edition (e.g., Flamingock CE, Flamingock Cloud SaaS or Flamingock Self-hosted). 
4. **ChangeUnits** execute in a coordinated **workflow**, optionally using templates.
5. **Distributed Locking** ensures safe execution in distributed environments.
6. All executions are **audited** and can be **rolled backed**.


Flamingock is designed to run successfully the entire migration or fail. And the next time is executed, it will continue from where the migration was left(the failed ChangeUnit).

#### More detailed process steps
Flamingock process follows the next steps:

1. The runner/builder loads the pipeline of execution of changes.
1. The runner loads the files storing the changes desired (changeUnits).
1. The runner checks if there is pending change to execute.
1. The runner acquires the distributed lock through the driver.
1. The runner loops over the ChangeUnits (change files) in order.
1. Takes the next ChangeUnit and executes it.
- If the ChangeUnit is successfully executed, Flamingock persists an entry in the Flamingock change history with the state SUCCESS and start the step 5 again.
- If the ChangeUnit fails, the runner rolls back the change. If the driver supports transactions and transactions are enabled, the rollback is done natively. When the driver does not support transactions or transactions are disabled, the method @RollbackExecution is executed. In both cases the ChangeUnit failed, whereas in the latter option, and entry is added in the changelog that a change has been rolled back.
- If the runner acomplished to execute the entire migration with no failures, it's considered successful. It releases the lock and finishes the migration.
On the other hand, if any ChangeUnit fails, the runner stops the migration at that point and throws an exception. When Flamingock is executed again, it will continue from the failure ChangeUnit(included).

---

## 🔑 Core Concepts

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