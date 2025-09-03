---
sidebar_position: 80
---

# Core Concepts

### 📦 ChangeUnits
**ChangeUnits** are the fundamental building blocks of Flamingock's Change-as-Code architecture. They represent atomic, versioned changes applied to target systems with complete safety guarantees and audit capabilities.

Each ChangeUnit includes:
- **Unique identity**: ID, order, and metadata for tracking
- **Target system**: Explicit annotation defining where changes are applied
- **Execution logic**: Java code, YAML templates, or declarative configurations
- **Recovery strategy**: Configurable behavior for handling failures
- **Rollback capability**: Compensation logic for governance and undo operations

**Basic Structure:**
```java
@TargetSystem("user-database")  // Required: defines where changes are applied
@ChangeUnit(id = "unique-id", order = "001", author = "team")
public class MyChange {
    @Execution
    public void execute(/* dependencies */) { }
    
    @RollbackExecution  // Highly recommended for all changes
    public void rollback(/* dependencies */) { }
}
```

For a deeper dive around ChangeUnits, see the [ChangeUnits deep dive](../flamingock-library-config/changeunits-deep-dive.md) section.

---

## 🛡️ Recovery Strategies

**Flamingock's key differentiator**: While traditional tools retry blindly or fail silently, Flamingock provides intelligent, configurable recovery strategies based on operation characteristics.

### MANUAL_INTERVENTION (Default)
**Philosophy**: "When in doubt, stop and alert rather than corrupt data."

- **When it activates**: Any failure where state is uncertain
- **What happens**: Execution stops, issue logged, requires human review
- **Why it's default**: Prevents silent data corruption in enterprise environments
- **Best for**: Critical data changes, non-idempotent operations, financial transactions

```java
@TargetSystem("user-database")
@ChangeUnit(id = "critical-user-update", order = "001", author = "platform-team")
// No @Recovery annotation needed - MANUAL_INTERVENTION is default
public class CriticalUserUpdate {
    @Execution
    public void execute(MongoDatabase db) {
        // Critical business logic - manual review on failure ensures safety
    }
}
```

### ALWAYS_RETRY  
**Philosophy**: "Keep trying until successful."

- **When it activates**: Any failure, regardless of state
- **What happens**: Automatic retry on next execution until success
- **Why opt-in**: Requires idempotent operations
- **Best for**: Cache warming, event publishing, idempotent configuration updates

```java
@TargetSystem("redis-cache")
@ChangeUnit(id = "cache-warming", order = "002", author = "platform-team")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class CacheWarmingChange {
    @Execution  
    public void execute(RedisTemplate redis) {
        // Idempotent operation - safe to retry automatically
    }
}
```

### Cloud Edition Enhanced Recovery
Cloud Edition uses the same strategies but provides enhanced outcomes through:
- **Marker mechanisms** for transactional systems
- **Intelligent reconciliation** for automatic issue resolution  
- **Advanced retry logic** with backoff and circuit breaker patterns

---

## 📋 Enterprise Auditing
Flamingock provides comprehensive audit capabilities for compliance and operational excellence:

### Audit States
- **Success States**: EXECUTED, ROLLED_BACK, MANUAL_MARKED_AS_EXECUTED
- **Failure States**: STARTED, EXECUTION_FAILED, ROLLBACK_FAILED (create issues requiring resolution)
- **Resolution States**: Manual resolutions via CLI for governance and compliance

### Audit Capabilities
- **Complete execution history** with timestamp, author, system, and outcome details
- **Issue detection and tracking** for failed or incomplete changes
- **CLI-based resolution workflow** for operational excellence
- **Compliance reporting** capabilities for regulatory requirements
- **Integration ready** for external observability platforms (ELK, Prometheus, Datadog)

### 🗄️ Audit store vs. Target system

- **Audit store**: The dedicated location where Flamingock records metadata about change executions. Its sole purpose is to track which ChangeUnits ran, when, and with what outcome—ensuring idempotency, rollbacks, and distributed coordination. This might be a user-provided database (Community Edition) or Flamingock’s cloud backend (Cloud Edition).

- **Target system**: The external resource that ChangeUnits operate upon (e.g., a database schema, S3 bucket, Kafka topic, or configuration service). Flamingock’s ChangeUnits apply changes to these systems in an ordered, auditable fashion. When a database serves as both audit store and target system, Flamingock can wrap change and audit insert in one transaction; otherwise, auditing and execution occur separately.

:::tip
To better understand the differences between Audit Store and Target System, see the [Audit store vs target system section](../overview/audit-store-vs-target-system.md)
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

- **When the target System supports ACID transactions** (like MongoDB), Flamingock executes the ChangeUnit's operation in one transaction and the audit-log write in a separate transaction, providing safety through its coordination mechanisms.
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

For a deeper dive around Workflows, see the [Pipelines and stages](../flamingock-library-config/setup-and-stages.md) section.

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