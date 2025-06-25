---
sidebar_position: 10
title: Template mapping
---

### :small_blue_diamond: How Execution and Rollback Mapping Works

In a template-based change unit (declarative format), Flamingock uses the `execution` and `rollback` sections to determine which methods to invoke in your template class.

#### Execution

- The method annotated with `@Execution` is **mandatory** for the template developer.
- The `execution` section in the declarative change unit is **mandatory** for the user.
- If the `execution` section is missing, Flamingock throws an exception at startup.

#### Rollback

- The method annotated with `@RollbackExecution` is **mandatory** for the template developer.
- The `rollback` section in the declarative change unit is **optional** for the user.

The behavior of rollback varies depending on context:

**Rollback during execution failure**

- If the system is **transactional** (e.g., MySQL), Flamingock relies on the system’s native transaction handling. It will not call the rollback method.
- If the system is **non-transactional**, Flamingock will:
  - Attempt to call the `@RollbackExecution` method only if the user provides a `rollback` section in the declarative file.
  - If no rollback config is provided, Flamingock skips the method call and logs the change as **FAILED**.

**Rollback during Undo operations (manual reversion)**

- If a `rollback` section is present in the declarative file, Flamingock will call the `@RollbackExecution` method — even if the change was previously applied successfully.
- If no `rollback` is provided, Flamingock skips the rollback logic, but still marks the change as **ROLLED_BACK** in the audit.

:::note 
In undo operations, if rollback is not defined in the declarative file, the change is marked as reverted even though no actual rollback was executed. It’s up to the user to ensure reversibility when needed.
:::