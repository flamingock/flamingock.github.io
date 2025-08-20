---
title: Transactions
sidebar_position: 90
---

# Transactions

Flamingock supports transactional execution for change units **when the underlying system and configuration allow it**.

In this context, **transactional execution means wrapping both the user-defined change and the corresponding audit record** in a single, atomic operation. This ensures that either both the change and the audit log are committed together, or neither are.

Flamingock logs each change unit execution in an audit store. In transactional scenarios, the change and the audit record are persisted together.

This page explains:
- What Flamingock considers transactional
- When transactions apply and when they don’t
- How Flamingock handles failure and rollback when transactions aren’t available

---

## What Flamingock considers transactional

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
<!--  To ensure Flamingock performs rollback properly, see the [Manual rollback](#manual-rollback) section. -->
:::


:::warning
If a change unit is marked as transactional (`transactional = false` not applied) but targets a system or operation that doesn’t support transactions, Flamingock assumes the database rolled back the change, and skips the `@RollbackExecution` method in case of failure. This can result in partial updates and loss of consistency.
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

[//]: # (TODO: Add target section reference)
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

---

## When to use `transactional = false`

| Type of change                                                                      | `transactional = false`? |
|-------------------------------------------------------------------------------------|:------------------------:|
| Operation allowed in transaction - same DB as audit log (transactional)             |            ❌             |
| Operation not allowed inside transaction (e.g., DDL operations in Mysql or MongoDB) |            ✅             |
| ChangeUnit targets different DB than audit log                                      |            ✅             |
| ChangeUnit targets non-database system or a non-transactional                       |            ✅             |

---

## Flamingock Cloud Edition

:::info
Flamingock Cloud Edition will support transactions through its own internal coordination mechanism.  
Documentation will be added when this feature is released.
:::

---

## Edition-specific transaction behavior
The examples and recommendations on this page apply to Flamingock generally, but each Community Edition (CE) driver has its own transactional capabilities and constraints.

Refer to the relevant edition page for detailed behavior, including:
- Whether transactions are supported
- How they are initiated and managed
- Known limitations (e.g., unsupported operations)

**Supported transactional CE editions:**
- [flamingock-ce-mongodb-sync](../community-edition/ce-mongodb-java-driver.md)
- [flamingock-ce-mongodb-springdata](../community-edition/ce-mongodb-springdata.md)
- [flamingock-ce-dynamodb](../community-edition/ce-dynamodb.md)
- [flamingock-ce-couchbase](../community-edition/ce-couchbase.md)

:::info
Cloud Edition transactional support will be explained in its own section once released.
:::

---

## :white_check_mark: Best practices

-  **Use `transactional = false` for changes that cannot run in a transaction**

Some database drivers (e.g., MongoDB Sync) don’t support all operations inside transactions (such as DDL or index creation). In those cases, explicitly set `transactional = false` to avoid runtime errors.

- **Always set `transactional = false` for non-database change units**

If your change interacts with a message queue, API, file system, or another external system, it should **not** be marked as transactional. Flamingock will treat it as non-transactional and enable manual rollback instead.

-  **Keep change unit scope narrow and isolated**

Avoid combining transactional and non-transactional logic within the same change unit. If part of the logic targets a non-transactional system, isolate that logic in a dedicated change unit and mark it appropriately.

- **Prefer automatic rollback (via transaction) when available**

Transactional change units offer stronger guarantees. Use them when the system supports them to ensure atomic execution and safe rollback on failure.