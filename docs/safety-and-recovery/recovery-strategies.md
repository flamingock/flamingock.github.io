---
title: Recovery strategies
sidebar_position: 2
---

# Recovery strategies

Recovery strategies determine how Flamingock handles Change execution failures. They provide configurable behavior to balance safety with automation based on your specific requirements.

## Strategy types

### Manual intervention (default)
- **Behavior**: Stops execution and requires human intervention when any failure occurs
- **Use case**: When safety is prioritized over automation
- **Technical challenge**: Prevents silent failures and ensures human oversight for uncertain outcomes

### Always retry
- **Behavior**: Automatically retries the change on subsequent executions until successful
- **Use case**: When changes are idempotent and safe to retry automatically
- **Technical challenge**: Reduces operational overhead for recoverable failures

## Configuration

### Code-based Changes

Use the `@Recovery` annotation to specify the strategy:

```java
// Default behavior (manual intervention)
@Change(id = "example-change", order = "20250207_01", author = "team")
public class ExampleChange {
    @Apply
    public void apply() {
        // Change logic here
    }
}

// Explicit always retry
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
@Change(id = "retry-change", order = "20250207_02", author = "team")
public class RetryChange {
    @Apply
    public void apply() {
        // Idempotent change logic here
    }
}
```

### Template-based Changes

Use the `recovery` field in your YAML configuration:

```yaml
# Default behavior (manual intervention)
id: example-change
order: "001"
author: team
template: example-template
apply: |
  # Change logic here

---

# Explicit always retry
id: retry-change
order: "002"
author: team
recovery: ALWAYS_RETRY
template: example-template
apply: |
  # Idempotent change logic here
```

## When failures occur

### Manual intervention workflow
1. Execution stops immediately on failure
2. Issue is logged in the audit store
3. Use CLI tools to investigate and resolve
4. Mark change as applied or rolled back manually

### Always retry workflow
1. Execution fails but continues on next run
2. Change attempts retry automatically
3. Process continues until successful or manually intervened

## Best practices

### Choose manual intervention when:
- Changes modify critical system state
- Failures require investigation before proceeding
- Rollback logic is complex or requires validation

### Choose always retry when:
- Operations are truly idempotent
- Failures are typically transient (network, temporary unavailability)
- Automatic recovery is acceptable

For detailed information on Change annotations and configuration, see [Change anatomy](../changes/anatomy-and-structure.md).

For operational workflows when issues occur, see [Issue resolution](issue-resolution.md).