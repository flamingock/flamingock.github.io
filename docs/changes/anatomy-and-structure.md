---
title: Anatomy & Structure
sidebar_position: 2
---

# Change Anatomy & Structure

Every Change follows a consistent structure with required properties, optional configurations, and specific annotations. Understanding this anatomy is essential for creating reliable changes.

## Required properties

Every Change must define these three properties:

### `id` - Unique identifier
The `id` must be unique across all Changes in your application.

```java
@Change(id = "add-user-status", author = "dev-team")  // order extracted from filename
```

**Rules:**
- Must be unique application-wide
- Use descriptive names (e.g., `add-user-status`, not `change1`)
- Cannot be modified once deployed
____

### `order` - Execution sequence
The `order` determines when the Change executes relative to others.

```java
@Change(id = "create-indexes", order = "20250923_01", author = "dev-team")
@Change(id = "migrate-data", order = "20250923_02", author = "dev-team")
@Change(id = "cleanup-temp-data", order = "20250923_03", author = "dev-team")
```

**Requirements:**
- Recommended format: `YYYYMMDD_NN` (e.g., `20250923_01`, `20250923_02`)
- YYYY = year, MM = month, DD = day, NN = sequence number (01-99)
- Determines execution order across all target systems
- Cannot be changed once deployed

:::warning Order Field Rules
- The `order` must be specified in **at least one** of these places:
  - In the file/class name following the pattern `_ORDER_DescriptiveName.[java|yaml]`
  - In the annotation (@Change) or YAML structure
- Both are optional, but **at least one is required**
- If order is specified in **both** locations, they **must be identical**
- For file/class names:
  - Must start with underscore `_`
  - Order is extracted between the first `_` and the last `_`
  - Recommended format: `YYYYMMDD_NN` (e.g., `_20250923_01_CreateUserTable.java`)
  - Order extracted: everything between first and last underscore (e.g., `20250923_01`)
- Orders are evaluated in alphanumeric order
:::

For recommendations on order field placement and naming patterns, see [Best Practices - Naming Patterns](./best-practices#follow-consistent-naming-patterns).
____
### `author` - Responsibility tracking
Identifies who is responsible for this change.

```java
@Change(id = "update-schema", order = "20250923_01", author = "database-team")
@Change(id = "migrate-users", order = "20250923_02", author = "john.doe@company.com")
```

**Best practices:**
- Use team names for shared responsibility: `database-team`, `api-team`
- Use individual emails for personal changes: `john.doe@company.com`
- Keep consistent within your organization

## Optional properties

### `transactional` - Transaction behavior
Controls whether the change runs within a transaction (default: `true`).

```java
@Change(
    id = "create-large-index",
    order = "20250923_01",
    author = "db-team",
    transactional = false  // DDL operations may require this
)
```

**Important:** For non-transactional target systems (S3, Kafka, etc.), this flag has no effect.

:::tip
For detailed information on transaction handling, see [Transactions](transactions.md).
:::

----

### `recovery` - Failure handling strategy
Controls how Flamingock handles execution failures (default: `MANUAL_INTERVENTION`).

```java
// Default behavior (manual intervention)
@Change(id = "critical-change", order = "20250923_01", author = "team")
public class CriticalChange {
    // Execution stops on failure, requires manual resolution
}

// Automatic retry
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
@Change(id = "idempotent-change", order = "20250923_02", author = "team")
public class IdempotentChange {
    // Automatically retries on failure until successful
}
```

**Recovery strategies:**
- `MANUAL_INTERVENTION` (default): Stops execution on failure, requires CLI resolution
- `ALWAYS_RETRY`: Automatically retries on subsequent executions until successful

For detailed information on recovery strategies, see [Safety and Recovery](../safety-and-recovery/introduction.md).

---
### `description` - Change explanation
Briefly describes what the change does, especially useful for complex operations.

```java
@Change(
    id = "optimize-user-queries",
    order = "20250923_01",
    author = "performance-team",
    description = "Add composite index on user table to improve search performance"
)
```

## Required annotations

### `@TargetSystem` - System specification
Declares which target system this Change affects.

```java
@TargetSystem("user-database")
@Change(id = "add-user-fields", author = "api-team")  // order extracted from filename
public class _20250923_01_AddUserFields {
    // Implementation
}
```


### `@Change` - Class marker
Marks the class as a Change and contains all metadata.

```java
@Change(
    id = "migrate-user-data",
    order = "20250923_01",
    author = "migration-team",
    description = "Migrate legacy user format to new schema",
    transactional = true
)
```

## Required methods

### `@Apply` - Change logic
Contains the actual change implementation.

```java
@Apply
public void apply(MongoDatabase database, ClientSession session) {
    // Your change logic here
    database.getCollection("users")
            .insertOne(session, new Document("status", "active"));
}
```

**Method characteristics:**
- Must be public
- Can have any name (`execute`, `run`, `apply`, etc.)
- Parameters are dependency-injected by Flamingock
- Should contain idempotent operations when possible

### `@Rollback` - Undo logic
Provides logic to reverse the change, essential for safety and CLI undo operations.

```java
@Rollback
public void rollback(MongoDatabase database, ClientSession session) {
    // Undo the change
    database.getCollection("users")
            .deleteMany(new Document("status", "active"));
}
```

**Why rollback is required:**
- **Non-transactional systems**: Used automatically if execution fails
- **All systems**: Required for CLI/UI undo operations
- **Safety**: Ensures every change can be reversed
- **Governance**: Demonstrates you've thought through the change impact

## Method parameters and dependency injection

Changes receive dependencies through method parameters, automatically injected by Flamingock using a **flexible, multi-source approach** with fallback hierarchy.

### Change Execution Dependency Resolution

Change execution uses a flexible dependency resolution flow(in this priority order):

1. **Target system context** - dependencies from **constructor** + `.withXXX()` methods 
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems


### Key Benefits of This Architecture

- **Target system isolation**: Each target system has its own dependency context
- **Flexible fallback**: Changes can access both system-specific and shared dependencies
- **Clear precedence**: Target system dependencies always override global ones
- **Type safety**: Strongly typed dependency injection with compile-time checking

For complete details on target system configuration vs change execution dependencies, see [Target Systems Introduction](../target-systems/introduction.md#dependency-injection).

## File naming conventions

All Change files must follow the `_ORDER_DescriptiveName` pattern, with recommended format `_YYYYMMDD_NN_DescriptiveName`:

```
_20250923_01_CreateUserIndexes.java
_20250923_02_MigrateUserData.java
_20250924_01_AddUserStatusColumn.yaml
_20250925_01_OptimizeQueries.java
```

**Rules:**
- Start with underscore and order (recommended: YYYYMMDD_NN format)
- Use PascalCase for descriptive names
- Match the `order` property in the annotation if provided
- Applies to both code (.java/.kt/.groovy) and template (.yaml/.json) files

## Complete example

Here's a complete Change showing all elements:

```java
@TargetSystem("user-database")
@Change(
    id = "add-user-preferences",
    order = "20250923_01",
    author = "user-experience-team",
    description = "Add preferences object to user documents with default values",
    transactional = true
)
public class _20250923_01_AddUserPreferences {
    
    @Apply
    public void apply(MongoDatabase database, ClientSession session) {
        // Add preferences field with default values
        var defaultPreferences = new Document()
            .append("notifications", true)
            .append("theme", "light")
            .append("language", "en");
            
        database.getCollection("users")
                .updateMany(
                    session,
                    new Document("preferences", new Document("$exists", false)),
                    new Document("$set", new Document("preferences", defaultPreferences))
                );
    }
    
    @Rollback
    public void rollback(MongoDatabase database, ClientSession session) {
        // Remove the preferences field
        database.getCollection("users")
                .updateMany(
                    session,
                    new Document(),
                    new Document("$unset", new Document("preferences", ""))
                );
    }
}
```

## Next steps

- **[Change types & Implementation](./types-and-implementation)** - Deep dive into code-based vs template-based approaches
- **[Change best Practices](./best-practices)** - Learn proven patterns for reliable Changes
- **[Target Systems](../target-systems/introduction)** - Configure where your changes will be applied