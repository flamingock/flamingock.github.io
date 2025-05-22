---
title: Transactions
sidebar_position: 7
---

# Transactions

Flamingock supports transactional execution for change units **when the underlying system and configuration allow it**.

In this context, **transactional execution means wrapping both the user-defined change and the corresponding audit record** in a single, atomic operation. This ensures that either both the change and the audit log are committed together, or neither are.

This page explains:
- What Flamingock considers transactional
- When transactions apply and when they don’t
- How Flamingock handles failure and rollback when transactions aren’t available

---

## What counts as "transactional"?

A change unit is considered transactional when:

- The change targets a system that supports transactions (e.g., a modern database)
- The Flamingock **Community Edition** driver in use supports transactions
- The change unit is marked as `transactional = true` (default behavior)

If these conditions are met, Flamingock wraps the execution of:
- The `@Execution` method of the change unit
- The audit log record creation

...**within the same transaction**. If anything fails, the entire operation is rolled back and not recorded as executed.

---

## When transactions don’t apply

Transactions do **not** apply in the following scenarios:

- The change targets a **non-transactional system** (e.g., Kafka, S3, external APIs)
- The change targets a **different database** than the one used for Flamingock’s audit log
- The change performs **operations that are not allowed in transactions** (e.g., DDL operations in Mysql or MongoDB)
- The driver or underlying **database doesn’t support transactions**

:::tip
In all these cases, mark the change unit with `@ChangeUnit(transactional = false)` to disable transaction wrapping.

To ensure Flamingock performs rollback properly, see the [Manual rollback](#manual-rollback) section.
:::

---

## Disabling transactions

### Per change unit (recommended)

Transactions are **enabled by default**. You can disable them explicitly for a given change unit:

```java
@ChangeUnit(id = "provision-bucket", order = "004", author = "team-a", transactional = false)
public class S3ProvisioningChange {

  @Execution
  public void execute(S3Client s3) {
    s3.createBucket(...);
  }

  @RollbackExecution
  public void rollback(S3Client s3) {
    s3.deleteBucket(...);
  }
}
```

This tells Flamingock:
- Not to use a transaction for the execution and audit
- To call `@RollbackExecution` if something goes wrong

### Globally (less common)

You can also disable transactions across all change units in the builder:

```java
Flamingock
  .builder()
  .disableTransaction()
  .build()
  .run();
```

---

## Manual rollback

When `transactional = false`, Flamingock cannot rely on the underlying system to roll back failed operations. Instead, it will attempt a **manual rollback** by calling your `@RollbackExecution` method if execution fails.

This fallback allows Flamingock to support non-transactional systems like:

- Message brokers (e.g., Kafka, RabbitMQ)
- External APIs
- Cloud infrastructure

:::info
You are responsible for writing reliable rollback logic. Flamingock cannot guarantee full recovery unless your rollback method safely restores the previous state.
:::

:::warning
If a change unit is marked as transactional(`transactional = false` not applied) but targets a system or operation that doesn’t support transactions, Flamingock will assume the database's transaction rolled back successfully and will not call the `@RollbackExecution` method in case of failure. This can result in partial updates and loss of consistency.
:::

---

## Summary

When to use `transactional = false`

| Type of change                                                  | Targets Flamingock audit DB? | System supports transactions? | `transactional = false`? |
|-----------------------------------------------------------------|:----------------------------:|:-----------------------------:|:------------------------:|
| Operation not allowed in transaction (same DB as audit log)     |              ✅               |               ✅               |            No            |
| Operation not allowed inside transaction (same DB as audit log) |              ✅               |               ❌               |            ✅             |
| Change targets different DB than audit log                      |              ❌               |               ❌               |            ✅             |
| Change targets non-database system                              |              ❌               |               ❌               |            ✅             |

---

## Flamingock Cloud Edition

:::info
Flamingock Cloud Edition will support transactions through its own internal coordination mechanism.  
Documentation will be added when this feature is released.
:::

---
## Best practices

:white_check_mark: Use transactional = false for changes that cannot run in a transaction

Some database drivers (e.g., MongoDB Sync) don’t support all operations inside transactions (such as DDL or index creation). In those cases, explicitly set `transactional = false` to avoid runtime errors.

:white_check_mark: Always set transactional = false for non-database change units

If your change interacts with a message queue, API, file system, or another external system, it should **not** be marked as transactional. Flamingock will treat it as non-transactional and enable manual rollback instead.

:white_check_mark: Keep change unit scope narrow and isolated

Avoid combining transactional and non-transactional logic within the same change unit. If part of the logic targets a non-transactional system, isolate that logic in a dedicated change unit and mark it appropriately.

:white_check_mark: Prefer automatic rollback (via transaction) when available

Transactional change units offer stronger guarantees. Use them when the system supports them to ensure atomic execution and safe rollback on failure.
