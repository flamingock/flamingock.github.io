---
sidebar_position: 30
---

# Core concepts

### ChangeUnits
**ChangeUnits** are the fundamental building blocks of Flamingock's Change-as-Code architecture. They represent atomic, versioned changes applied to target systems with complete safety guarantees and audit capabilities.

Each ChangeUnit includes:
- **Unique identity**: ID, order, and metadata for tracking
- **Target system**: Where the changes is applied to
- **Execution logic**: The actual change implementation
- **Rollback capability**: Compensation logic for governance and undo operations
- **Recovery strategy**: Configurable behavior for handling failures

ChangeUnits can be implemented in two forms:
- **Code-based**: Java classes with annotations that contain the change logic
- **Template-based**: Declarative low-code approach using YAML configurations

For a deeper dive around ChangeUnits, see the [ChangeUnits](../change-units/anatomy-and-structure.md) section.


### Templates
Templates provide a reusable layer on top of ChangeUnits for common change patterns. When you have multiple changes that share similar logic (for example, executing SQL statements), templates allow you to abstract that common logic and reuse it.

With templates, you create multiple ChangeUnits using a declarative, low-code approach. Each ChangeUnit uses a template and passes its specific configuration. For example, an SQL template receives the SQL statement as configuration, executes it, and handles errors consistently.

This approach is particularly useful for:
- Standardizing common operations across your codebase
- Reducing boilerplate code
- Enabling non-developers to define changes through configuration

For more information about templates, see the [Templates](../templates/templates-introduction.md) section.


## Recovery strategies

Recovery strategies define how Flamingock responds when a ChangeUnit fails during execution. They determine whether the system should stop and wait for manual intervention or automatically retry the operation.

Flamingock provides two main strategies:
- **Manual intervention** (default): Stops execution and requires human review when failures occur
- **Always retry**: Automatically retries the change on the next execution attempt

The choice of strategy depends on whether your changes are idempotent and how critical they are to your system's integrity.

For detailed configuration and implementation, see the [Recovery strategies](../recovery-and-safety/recovery-strategies.md) section.


## Audit store
The **audit store** is where Flamingock records metadata about change executions. Its purpose is to track which ChangeUnits have been executed, when they ran, and their outcomes. This ensures idempotency, enables rollbacks, and provides audit capabilities. The audit store is managed entirely by Flamingock - your code never directly interacts with it.

## Target system  
The **target system** is where your actual business changes are applied. These are the systems your ChangeUnits modify - databases, message queues, APIs, configuration services, etc. Each ChangeUnit declares which target system it operates on.

For more details about how these systems work together, see the [Audit store vs target system](audit-store-vs-target-system.md) section.


## Transaction handling
Flamingock adapts its behavior based on the transactional capabilities of your target systems:

### Transactional target systems
Systems that support ACID transactions, such as MongoDB 4.0+, PostgreSQL, MySQL, or other transactional stores. When working with these systems, Flamingock can leverage native transaction support to ensure atomicity of changes. If a failure occurs mid-execution, the native rollback mechanism ensures no partial changes are left in the system.

### Non-transactional target systems
Systems like Kafka, S3, REST APIs, or file systems that don't support transactions. For these systems, Flamingock relies on explicit rollback methods and careful change design to maintain consistency. Recovery strategies become particularly important for handling failures in non-transactional contexts.

For implementation details, see the [Transactions](../flamingock-library-config/transactions.md) section.


## Stages
Stages organize your changes into logical groups within Flamingock's execution pipeline. By default, you work with a single stage that contains all your changes, ensuring they execute sequentially in a deterministic order.

Key characteristics:
- Changes within a stage execute sequentially with guaranteed order
- Most applications only need a single stage
- Multiple stages can be used for modular architectures, but execution order between stages is not guaranteed
- Each stage defines where to find its changes (package or directory location)

For detailed information about stages and advanced configurations, see the [Setup and stages](../flamingock-library-config/setup-and-stages.md) section.


## Events
Flamingock can notify your application about the execution status of changes through events. This enables integration with monitoring systems, custom logging, or triggering downstream processes based on change completion.

For more information about events, see the [Events](../flamingock-library-config/events.md) section.