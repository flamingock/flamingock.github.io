---
title: Transactions
sidebar_position: 40
---

# Transactions

Flamingock provides intelligent transaction management that adapts to your target systems' capabilities. Understanding when and how changes are executed transactionally is key to building reliable system evolution.

## How Flamingock handles transactions

Flamingock's transaction handling is determined by the **target system's capabilities**, not just the `transactional` flag. The behavior differs fundamentally between transactional and non-transactional target systems.

### 🔄 Transactional target systems
**Examples**: PostgreSQL, MySQL, MongoDB, SQL databases, DynamoDB, Couchbase

These systems support native transaction capabilities:

**When `transactional = true` (default)**:
- Execution runs within a native database transaction
- **On failure**: Automatic rollback using database's native transaction mechanism
- Session/connection managed automatically by Flamingock
- `@Rollback` used only for manual operations (CLI undo)

**When `transactional = false`**:
- Execution runs without transaction
- **On failure**: Safety through compensation logic (@Rollback)
- Useful for DDL operations or large bulk operations that exceed transaction limits

### ⚡ Non-transactional target systems
**Examples**: Kafka, S3, REST APIs, file systems, message queues

These systems have no native transaction support:

**The `transactional` flag is ignored** - behavior is always the same:
- Execution runs normally (no native transaction possible)
- **On failure**: Safety through compensation logic (@Rollback)
- Safety relies entirely on idempotent operations and rollback methods

### Behavior summary table

| Target System Type | `transactional = true` (default) | `transactional = false` |
|---------------------|-----------------------------------|-------------------------|
| **Transactional** | Native transaction rollback on failure | `@Rollback` on failure |
| **Non-transactional** | **Flag ignored** - `@Rollback` on failure | **Flag ignored** - `@Rollback` on failure |

## Best practices

### Always provide @Rollback
- **Transactional systems with `transactional = true`**: Used for manual rollback operations (CLI undo)
- **Transactional systems with `transactional = false`**: Called automatically on failure
- **Non-transactional systems**: Always called automatically on failure (flag ignored)
- **All cases**: Essential for complete change management

### Use appropriate transactionality
- **Keep default `transactional = true`** for regular data changes on transactional systems
- **Use `transactional = false`** only when necessary on transactional systems (DDL, bulk operations)
- **For non-transactional systems**: The flag doesn't matter - design idempotent operations and robust rollback logic

**Key takeaway**: Flamingock's transaction behavior is determined by your target system's capabilities. For transactional systems, the `transactional` flag controls failure handling (native rollback vs @Rollback). For non-transactional systems, the flag is ignored and @Rollback is always used.