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
@Change(id = "add-user-status", order = "0001", author = "dev-team")
```

**Rules:**
- Must be unique application-wide
- Use descriptive names (e.g., `add-user-status`, not `change1`)
- Cannot be modified once deployed

### `order` - Execution sequence
The `order` determines when the Change executes relative to others.

```java
@Change(id = "create-indexes", order = "0001", author = "dev-team")
@Change(id = "migrate-data", order = "0002", author = "dev-team")
@Change(id = "cleanup-temp-data", order = "0003", author = "dev-team")
```

**Requirements:**
- Must use zero-padded format: `0001`, `0002`, `0100`, etc.
- Minimum 4 digits recommended for future expansion
- Determines execution order across all target systems
- Cannot be changed once deployed

### `author` - Responsibility tracking
Identifies who is responsible for this change.

```java
@Change(id = "update-schema", order = "0001", author = "database-team")
@Change(id = "migrate-users", order = "0002", author = "john.doe@company.com")
```

**Best practices:**
- Use team names for shared responsibility: `database-team`, `api-team`
- Use individual emails for personal changes: `john.doe@company.com`
- Keep consistent within your organization

## Optional properties

### `description` - Change explanation
Briefly describes what the change does, especially useful for complex operations.

```java
@Change(
    id = "optimize-user-queries",
    order = "0001",
    author = "performance-team",
    description = "Add composite index on user table to improve search performance"
)
```

### `transactional` - Transaction behavior
Controls whether the change runs within a transaction (default: `true`).

```java
@Change(
    id = "create-large-index",
    order = "0001",
    author = "db-team",
    transactional = false  // DDL operations may require this
)
```

**When to set `transactional = false`:**
- DDL operations (CREATE INDEX, ALTER TABLE)
- Large bulk operations that exceed transaction limits  
- Cross-system changes spanning multiple databases
- Operations that don't support transactions

**Important:** For non-transactional target systems (S3, Kafka, etc.), this flag has no effect.

### `recovery` - Failure handling strategy
Controls how Flamingock handles execution failures (default: `MANUAL_INTERVENTION`).

```java
// Default behavior (manual intervention)
@Change(id = "critical-change", order = "0001", author = "team")
public class CriticalChange {
    // Execution stops on failure, requires manual resolution
}

// Automatic retry
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
@Change(id = "idempotent-change", order = "0002", author = "team")
public class IdempotentChange {
    // Automatically retries on failure until successful
}
```

**Recovery strategies:**
- `MANUAL_INTERVENTION` (default): Stops execution on failure, requires CLI resolution
- `ALWAYS_RETRY`: Automatically retries on subsequent executions until successful

For detailed information on recovery strategies, see [Safety and Recovery](../safety-and-recovery/introduction.md).

## Required annotations

### `@TargetSystem` - System specification
Declares which target system this Change affects.

```java
@TargetSystem("user-database")
@Change(id = "add-user-fields", order = "0001", author = "api-team")
public class _0001_AddUserFields {
    // Implementation
}
```


### `@Change` - Class marker
Marks the class as a Change and contains all metadata.

```java
@Change(
    id = "migrate-user-data",
    order = "0001",
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

Changes receive dependencies through method parameters, automatically injected by Flamingock from the target system's context, global context, or underlying framework context.

```java
// MongoDB target system
@Apply
public void apply(MongoDatabase database, ClientSession session) {
    // database and session injected from target system or global context
}

// SQL target system
@Apply
public void apply(DataSource dataSource) {
    // dataSource and connection injected from target system or  global context
}
```

For more details on how dependency resolution works, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## File naming conventions

All Change files must follow the `_XXXX_DescriptiveName` pattern:

```
_0001_CreateUserIndexes.java
_0002_MigrateUserData.java  
_0003_AddUserStatusColumn.yml
_0100_OptimizeQueries.java
```

**Rules:**
- Start with underscore and zero-padded order
- Use PascalCase for descriptive names
- Match the `order` property in the annotation
- Applies to both code (.java/.kt/.groovy) and template (.yml/.json) files

## Complete example

Here's a complete Change showing all elements:

```java
@TargetSystem("user-database")
@Change(
    id = "add-user-preferences",
    order = "0001",
    author = "user-experience-team",
    description = "Add preferences object to user documents with default values",
    transactional = true
)
public class _0001_AddUserPreferences {
    
    @Apply
    public void apply(MongoDatabase database, ClientSession session) {
        // Add preferences field with default values
        Document defaultPreferences = new Document()
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