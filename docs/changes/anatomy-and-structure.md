---
title: Anatomy & Structure
sidebar_position: 2
---

# Change Anatomy & Structure

Every Change is configured through key components that work together, following the natural development workflow:

- **[File name](#file-name-and-order)**: Created first, determines execution order and change name.
- **[`@Change` annotation](#change-annotation-properties)**: Defines the Change's unique identifier (`id`) and author for accountability. 
- **[`@TargetSystem` annotation](#target-system-annotation)**: Specifies which system the Change will affect.
- **[Apply and rollback methods](#apply-and-rollback-methods)**: Implement the actual change logic.

Understanding this anatomy is essential for creating reliable changes that execute predictably and safely.

## Complete example

Here's what a complete Change looks like with minimal configuration - we'll explain each component in detail below:

```java
@TargetSystem("user-database")
@Change(id = "add-user-status", author = "backend-team")
public class _0001__AddUserStatus {

    @Apply
    public void apply(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(
                    new Document("status", new Document("$exists", false)),
                    new Document("$set", new Document("status", "active"))
                );
    }

    @Rollback
    public void rollback(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(
                    new Document(),
                    new Document("$unset", new Document("status", ""))
                );
    }
}
```

Now let's break down each component:

## File name and order

The execution order of Changes is determined by the filename pattern. Every Change file must follow the `_ORDER__CHANGE-NAME` format.

### File naming pattern

**Pattern**: `_ORDER__CHANGE-NAME.[java|yaml]`

- **ORDER**: Alphanumeric string (required: at least 4 characters, left-padded zeros)
- **Double underscore `__`**: Separates order from change name
- **CHANGE-NAME**: PascalCase descriptive name

**Examples:**
```
_0001__CreateInvoiceCollection.java
_0002__AddUserStatusColumn.yaml
_0003__MigrateUserData.java
_0010__OptimizeQueries.java
```

### How Flamingock extracts order

Flamingock uses a simple rule to determine execution order:

1. **Filename must start with underscore `_`**
2. **Everything between the first `_` and `__` (double underscore) becomes the order**
3. **Everything after `__` is the descriptive name**

**Name examples:**

| Filename | Extracted Order | Change Name |
|----------|----------------|-------------|
| `_0001__CreateUsers.java` | `0001` | `CreateUsers` |
| `_0010__SimpleChange.yaml` | `0010` | `SimpleChange` |
| `_V1_2__DatabaseUpgrade.java` | `V1_2` | `DatabaseUpgrade` |

**Order rules:**
- **Required**: Orders must be at least 4 characters (compilation requirement)
- **Recommended format**: `NNNN` with left-padding zeros (e.g., `0001`, `0002`, `0010`)
- **Flexibility**: Can contain any characters valid for OS filenames and Java class names
- **Evaluation**: Orders are compared alphanumerically for execution sequence
- **Immutability**: Cannot be changed once deployed

## Change annotation properties

The `@Change` annotation must define these two properties, with optional properties available (covered later):

### `id` - Unique identifier
The `id` must be unique across all Changes in your application.

```java
@Change(id = "add-user-status", author = "dev-team")
```

**Rules:**
- Must be unique application-wide
- Use descriptive names (e.g., `add-user-status`, not `change1`)
- Cannot be modified once deployed

### `author` - Responsibility tracking
Identifies who is responsible for this change.

```java
@Change(id = "update-schema", author = "database-team")
@Change(id = "migrate-users", author = "john.doe@company.com")
```

**Best practices:**
- Use team names for shared responsibility: `database-team`, `api-team`
- Use individual emails for personal changes: `john.doe@company.com`
- Keep consistent within your organization

## Target system annotation

### `@TargetSystem` - System specification
Declares which target system this Change affects.

```java
@TargetSystem("user-database")
@Change(id = "add-user-fields", author = "api-team")
public class _0001__AddUserFields {
    // Implementation
}
```

## Apply and rollback methods

Both methods implement your change logic and use dependency injection to access the systems they need to modify.

### `@Apply` - Change logic
Contains the actual change implementation.

```java
@Apply
public void apply(MongoDatabase database, ClientSession session) {
    // Your change logic here
    database.getCollection("users")
            .updateMany(
                new Document("status", new Document("$exists", false)),
                new Document("$set", new Document("status", "active"))
            );
}
```

### `@Rollback` - Undo logic
Provides logic to reverse the change, essential for safety and CLI undo operations.

```java
@Rollback
public void rollback(MongoDatabase database, ClientSession session) {
    // Undo the change
    database.getCollection("users")
            .updateMany(
                new Document(),
                new Document("$unset", new Document("status", ""))
            );
}
```

### Method implementation guide

**Method characteristics:**
- Must be public
- Can have any name (`execute`, `run`, `apply`, etc.)
- Should contain idempotent operations when possible

**Parameters you can expect:**
- **Target system dependencies**: `MongoDatabase`, `DataSource`, `S3Client`, `KafkaTemplate`, etc.
- **Transaction context**: `ClientSession` (MongoDB), `Connection` (SQL), transaction builders (DynamoDB)
- **Custom dependencies**: Any beans or objects you've configured in your target system

**Method parameters are automatically injected** by Flamingock based on your target system configuration and global dependencies.

**Why rollback is required:**
- **Non-transactional systems**: Used automatically if execution fails
- **All systems**: Required for CLI/UI undo operations
- **Safety**: Ensures every change can be reversed
- **Governance**: Demonstrates you've thought through the change impact

For detailed information about dependency injection and parameter configuration, see [Method Parameters and Dependency Injection](./dependency-injection.md).

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



## Optional properties

The `@Change` annotation supports additional optional properties to control behavior:

### `transactional` - Transaction behavior
Controls whether the change runs within a transaction (default: `true`).

```java
@Change(
    id = "create-large-index",
    author = "db-team",
    transactional = false  // DDL operations may require this
)
```

**Important:** For non-transactional target systems (S3, Kafka, etc.), this flag has no effect.

### `recovery` - Failure handling strategy
Controls how Flamingock handles execution failures (default: `MANUAL_INTERVENTION`).

```java
// Default behavior (manual intervention)
@Change(id = "critical-change", author = "team")
public class _0001__CriticalChange {
    // Execution stops on failure, requires manual resolution
}

// Automatic retry
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
@Change(id = "idempotent-change", author = "team")
public class _0002__IdempotentChange {
    // Automatically retries on failure until successful
}
```

**Recovery strategies:**
- `MANUAL_INTERVENTION` (default): Stops execution on failure, requires CLI resolution
- `ALWAYS_RETRY`: Automatically retries on subsequent executions until successful

For detailed information on recovery strategies, see [Safety and Recovery](../safety-and-recovery/introduction.md).

## Next steps

- **[Change types & implementation](./types-and-implementation)** - Deep dive into code-based vs template-based approaches
- **[Change best practices](./best-practices)** - Learn proven patterns for reliable Changes
- **[Target systems](../target-systems/introduction)** - Configure where your changes will be applied