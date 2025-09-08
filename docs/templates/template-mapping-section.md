---
sidebar_position: 10
title: Template mapping
---

### How Execution and Rollback Mapping Works

In a template-based change unit (declarative format), Flamingock uses the `execution` and `rollback` sections to determine which methods to invoke in your template class.

#### Execution

- The method annotated with `@Execution` is **mandatory** for the template developer.
- The `execution` section in the declarative change unit is **mandatory** for the user.
- If the `execution` section is missing, Flamingock throws an exception at startup.

#### Rollback

- The method annotated with `@RollbackExecution` is **mandatory** for the template developer.
- The `rollback` section in the declarative change unit is **optional** for the user.

The behavior of rollback varies depending on the target system capabilities and the `transactional` flag:

> For detailed information on transaction behavior, see [Transactions](../flamingock-library-config/transactions.md).

**Rollback during execution failure**

**For transactional target systems** (e.g., MySQL, PostgreSQL, MongoDB):
- **With `transactional = true` (default)**: Flamingock relies on the system's native transaction handling for automatic rollback. The `@RollbackExecution` method is NOT called.
- **With `transactional = false`**: Flamingock will call the `@RollbackExecution` method if the user provides a `rollback` section in the declarative file.

**For non-transactional target systems** (e.g., Kafka, S3, REST APIs):
- **The `transactional` flag is ignored** - behavior is always the same:
- Flamingock will call the `@RollbackExecution` method if the user provides a `rollback` section in the declarative file.
- If no rollback config is provided, Flamingock skips the method call and logs the change as **FAILED**.

**Rollback during Undo operations (manual reversion via CLI)**

- If a `rollback` section is present in the declarative file, Flamingock will call the `@RollbackExecution` method regardless of target system type.
- If no `rollback` is provided, Flamingock skips the rollback logic, but still marks the change as **ROLLED_BACK** in the audit.

:::note 
In undo operations, if rollback is not defined in the declarative file, the change is marked as reverted even though no actual rollback was executed. It’s up to the user to ensure reversibility when needed.
:::