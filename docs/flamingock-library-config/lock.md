---
title: Lock
sidebar_position: 30
---

# Lock

Flamingock uses a distributed lock to ensure that changes are only applied **once and only once**, even when multiple instances of your application start simultaneously in a distributed system.

This mechanism is **mandatory** and applies in both Cloud and Community editions:

- In **Cloud Edition**, the lock is managed by Flamingock’s backend
- In **Community Audit Stores**, the lock is stored in your configured database (e.g., MongoDB, DynamoDB)

---

## Configurable properties

| Property                             | Default          | Description                                                                         |
|--------------------------------------|------------------|-------------------------------------------------------------------------------------|
| `lockAcquiredForMillis`              | `60000` (1 min)  | Time the lock remains valid once acquired. Automatically released if not refreshed. |
| `lockQuitTryingAfterMillis`          | `180000` (3 min) | How long to retry acquiring the lock if another instance holds it.                  |
| `lockTryFrequencyMillis`             | `1000` (1 sec)   | Interval between attempts while waiting for the lock.                               |
| `throwExceptionIfCannotObtainLock`   | `true`           | Whether Flamingock should fail if the lock can't be acquired.                       |
| `enableRefreshDaemon`                | `true`           | Whether to run a background thread that periodically extends the lock.              |

---

## Why locking matters

In distributed systems, multiple app instances may start simultaneously — but only **one** should apply pending changes. Flamingock uses locking to:

- Prevent race conditions
- Ensure consistent and safe state transitions
- Guarantee single execution of each change

:::info
If no pending changes exist, the lock is not acquired and startup proceeds normally.
:::
---

## Refresh Daemon (safety net)

The **refresh daemon** is a background thread that extends the lock before it expires.  
It’s critical for **long-running changes** that might exceed the lock duration.

Without the daemon:

- A long-running change (e.g., 90s) could outlive a default lock (e.g., 60s)
- Another instance might acquire the lock prematurely, causing conflict

:::note
By default, Flamingock uses proxy-based injection guards. Before executing any injected dependency, Flamingock verifies that the lock is still valid.
:::

If you're injecting **non-critical components** (e.g., a local list or stateless helper), you can annotate them with `@NonLockGuarded` to avoid the proxy overhead.

---

## Configuration Examples

### Builder
```java
FlamingockStandalone
  .setLockAcquiredForMillis(120000)
  .setLockQuitTryingAfterMillis(300000)
  .setLockTryFrequencyMillis(2000)
  .setThrowExceptionIfCannotObtainLock(true)
  .setEnableRefreshDaemon(true)
  ...
```

---

## When to tweak Lock settings

Most projects can use the default configuration. You may need to adjust values if:

- You expect **long-running changes** (increase `lockAcquiredForMillis`)
- You run **many app instances** and want to reduce startup wait (decrease `lockTryFrequencyMillis`)
- You want Flamingock to **fail fast** if it can't acquire a lock (keep `throwExceptionIfCannotObtainLock` as `true`)

---

## ✅ Best Practices

- Keep the refresh daemon **enabled**, especially for distributed or slow-processing environments
- Avoid setting `lockAcquiredForMillis` too short if any changes might run longer
- Use `@NonLockGuarded` sparingly — only when you're sure no side-effects will occur

[//]: # (TODO: Add "🛠 Troubleshooting" section)
