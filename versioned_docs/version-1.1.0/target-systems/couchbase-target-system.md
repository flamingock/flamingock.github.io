---
title: Couchbase
sidebar_position: 6
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Couchbase Target System

The Couchbase target system (`CouchbaseTargetSystem`) enables Flamingock to apply changes to Couchbase databases using the official Couchbase Java SDK. As a transactional target system, it supports automatic rollback through Couchbase's transaction capabilities.

## Version compatibility

| Component | Version Requirement |
|-----------|-------------------|
| Couchbase Java Client | 3.6.0+ |

Couchbase Java Client 3.6.0+ is required and must be included in your project dependencies.

## Installation

Add the Couchbase Java Client dependency to your project (version 3.6.0+ required):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("com.couchbase.client:java-client:3.6.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>com.couchbase.client</groupId>
    <artifactId>java-client</artifactId>
    <version>3.6.0</version> <!-- 3.6.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the target system:

```java
var couchbaseTarget = new CouchbaseTargetSystem("user-database-id", cluster, "userBucket");
```

The constructor requires the target system name, Couchbase cluster, and bucket name. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System configuration

The Couchbase target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor dependencies (mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `Cluster` | `cluster` | Couchbase cluster connection - **required** for both target system configuration and change execution |
| `String` | `bucketName` | Target bucket name - **required** for both target system configuration and change execution |

## Dependencies available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `Cluster`, `Bucket`, `TransactionAttemptContext`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var couchbaseTarget = new CouchbaseTargetSystem("user-database", productionCluster, "userBucket")
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
- **Bucket name**: Must be provided via constructor (`"userBucket"`)

**Change dependency resolution for Changes in "user-database":**
- **Cluster**: From target system context (`productionCluster`)
- **Bucket**: From target system context (derived from `productionCluster` + `"userBucket"`)
- **TransactionAttemptContext**: From target system context (created by Flamingock)
- **AuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage Couchbase's transactional capabilities, it must use the `TransactionAttemptContext` parameter. Flamingock uses the injected `Cluster` and `Bucket` dependencies to create and manage this context's lifecycle - creating the transaction context before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("user-database-id")
@Change(id = "create-users", author = "team")  // order extracted from filename
public class _0001__CreateUsers {

    @Apply
    public void apply(Cluster cluster, Bucket bucket, TransactionAttemptContext txContext) {
        // TransactionAttemptContext is required for transactional execution
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
@TargetSystem("user-database-id")
@Change(id = "update-configs", author = "team")  // order extracted from filename
public class _0002__UpdateConfigs {

    @Apply
    public void apply(Cluster cluster, Bucket bucket) {
        // Operations without TransactionAttemptContext won't participate in transactions
        Collection collection = bucket.defaultCollection();

        JsonObject config = JsonObject.create()
            .put("version", "2.0")
            .put("updated", Instant.now().toString());

        collection.upsert("config::app", config);
    }
}
```

**How transactions work:**
1. **Context creation**: Flamingock uses the target system's `Cluster` to create an `TransactionAttemptContext` for transaction management
2. **Transaction management**: The same `Cluster` and `Bucket` handle transaction operations and coordinate with the context
3. **Lifecycle**: Flamingock automatically creates the transaction context, commits on success, or rolls back on failure

Without the `TransactionAttemptContext` parameter, operations will execute but won't participate in transactions.

## Available dependencies in Changes

Your Changes can inject Couchbase-specific dependencies like `Cluster`, `Bucket`, and `TransactionAttemptContext` (for transactions), but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [Flamingock examples](https://github.com/flamingock/flamingock-java-examples)
