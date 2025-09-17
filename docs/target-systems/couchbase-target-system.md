---
title: Couchbase
sidebar_position: 5
---

# Couchbase Target System

The Couchbase target system (`CouchbaseTargetSystem`) enables Flamingock to apply changes to Couchbase databases using the official Couchbase Java SDK. As a transactional target system, it supports automatic rollback through Couchbase's transaction capabilities.

## Basic setup

```java
CouchbaseTargetSystem couchbaseTarget = new CouchbaseTargetSystem("user-database", cluster, bucket);
```

The constructor requires the target system name, Couchbase cluster, and bucket. Optional configurations can be added via `.withXXX()` methods.

## Target System Configuration

The Couchbase target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `Cluster` | `cluster` | Couchbase cluster connection - **required** for both target system configuration and change execution |
| `Bucket` | `bucket` | Target bucket instance - **required** for both target system configuration and change execution |

### Dependencies Available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `Cluster`, `Bucket`, `AttemptContext`, plus any added via `.addDependency()`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
CouchbaseTargetSystem couchbaseTarget = new CouchbaseTargetSystem("user-database", productionCluster, userBucket)
    .addDependency(auditService);          // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)           // Available to all target systems
    .addDependency(logService)             // Available to all target systems
    .addTargetSystems(couchbaseTarget)
    .build();
```

**Target system configuration resolution:**
- **Cluster**: Must be provided via constructor (`productionCluster`)
- **Bucket**: Must be provided via constructor (`userBucket`)

**Change dependency resolution for Changes in "user-database":**
- **Cluster**: From target system context (`productionCluster`)
- **Bucket**: From target system context (`userBucket`)
- **AttemptContext**: From target system context (created by Flamingock)
- **AuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage Couchbase's transactional capabilities, it must use the `AttemptContext` parameter. Flamingock uses the injected `Cluster` and `Bucket` dependencies to create and manage this context's lifecycle - creating the transaction context before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../flamingock-library-config/transactions.md).

```java
@TargetSystem("user-database")
@Change(id = "create-users", order = "001")
public class CreateUsers {
    
    @Apply
    public void apply(Cluster cluster, Bucket bucket, AttemptContext txContext) {
        // AttemptContext is required for transactional execution
        // Flamingock uses the target system's Cluster and Bucket to handle transaction operations
        // and manages transaction start, commit, and rollback automatically
        Collection collection = bucket.defaultCollection();
        
        JsonObject user = JsonObject.create()
            .put("name", "John Doe")
            .put("email", "john@example.com");
            
        txContext.insert(collection, "user::001", user);
    }
}
```

You can also work with the Cluster and Bucket directly without transactions:

```java
@TargetSystem("user-database")
@Change(id = "update-configs", order = "002")
public class UpdateConfigs {
    
    @Apply
    public void apply(Cluster cluster, Bucket bucket) {
        // Operations without AttemptContext won't participate in transactions
        Collection collection = bucket.defaultCollection();
        
        JsonObject config = JsonObject.create()
            .put("version", "2.0")
            .put("updated", Instant.now().toString());
            
        collection.upsert("config::app", config);
    }
}
```

**How transactions work:**
1. **Context creation**: Flamingock uses the target system's `Cluster` to create an `AttemptContext` for transaction management
2. **Transaction management**: The same `Cluster` and `Bucket` handle transaction operations and coordinate with the context
3. **Lifecycle**: Flamingock automatically creates the transaction context, commits on success, or rolls back on failure

Without the `AttemptContext` parameter, operations will execute but won't participate in transactions.

## Available dependencies in Changes

Your Changes can inject Couchbase-specific dependencies like `Cluster`, `Bucket`, and `AttemptContext` (for transactions), but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [Couchbase examples](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)