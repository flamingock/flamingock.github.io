---
title: Couchbase
sidebar_position: 5
---

# Couchbase Target System

The Couchbase target system (`CouchbaseTargetSystem`) enables Flamingock to apply changes to Couchbase databases using the official Couchbase Java SDK. As a transactional target system, it supports automatic rollback through Couchbase's transaction capabilities.

## Minimum recommended setup

```java
CouchbaseTargetSystem couchbaseTarget = new CouchbaseTargetSystem("user-database")
    .withCluster(cluster)
    .withBucket(bucket);
```

While dependencies can be provided through the global context, we highly recommend injecting them directly at the target system level. This provides clearer scoping, better isolation between systems, and makes dependencies explicit and easier to track.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/target-system-configuration.md#dependency-resolution-hierarchy), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `Cluster` | `.withCluster(cluster)` | Couchbase cluster connection - **required** for both ChangeUnit execution and transaction management |
| `Bucket` | `.withBucket(bucket)` | Target bucket instance - **required** for both ChangeUnit execution and transaction management |

Remember: If not provided directly via `.withXXX()`, Flamingock searches the global context. If still not found:
- **Required dependencies** will throw an exception

## Configuration example

Here's a comprehensive example showing dependency resolution:

```java
// Target system with specific dependencies
CouchbaseTargetSystem couchbaseTarget = new CouchbaseTargetSystem("user-database")
    .withCluster(productionCluster)        // Target-specific cluster
    .withBucket(userBucket)                // Target-specific bucket
    .addDependency(auditService);          // Custom service for this target

// Global context with different dependencies
Flamingock.builder()
    .addDependency(defaultCluster)         // Different cluster in global
    .addDependency(defaultBucket)          // Different bucket in global
    .addDependency(emailService)           // Available to all targets
    .addTargetSystems(couchbaseTarget)
    .build();
```

**What gets resolved for ChangeUnits in "user-database":**
- **Cluster**: Uses `productionCluster` (from target system, not `defaultCluster` from global)
- **Bucket**: Uses `userBucket` (from target system, not `defaultBucket` from global)
- **AuditService**: Available from target system context
- **EmailService**: Available from global context

The target system context always takes precedence, ensuring proper isolation between different systems.

## Transactional support

For a ChangeUnit to leverage Couchbase's transactional capabilities, it must use the `AttemptContext` parameter. Flamingock uses the injected `Cluster` and `Bucket` dependencies to create and manage this context's lifecycle - creating the transaction context before execution, committing on success, and rolling back on failure.

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-users", order = "001")
public class CreateUsers {
    
    @Execution
    public void execution(Cluster cluster, Bucket bucket, AttemptContext txContext) {
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
@ChangeUnit(id = "update-configs", order = "002")
public class UpdateConfigs {
    
    @Execution
    public void execution(Cluster cluster, Bucket bucket) {
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

## Available dependencies in ChangeUnits

Your ChangeUnits can inject Couchbase-specific dependencies like `Cluster`, `Bucket`, and `AttemptContext` (for transactions), but are not limited to these. Any dependency can be added to the target system context via `.addDependency()`, taking precedence over global dependencies.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Next steps

- Learn about [Target system configuration](../flamingock-library-config/target-system-configuration.md)
- Explore [ChangeUnits](../change-units/introduction.md)
- See [Couchbase examples](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)