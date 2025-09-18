---
title: MongoDB Sync
sidebar_position: 3
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Sync Target System

The MongoDB Sync target system (`MongoSyncTargetSystem`) enables Flamingock to apply changes to MongoDB databases using the official MongoDB Java sync driver. As a transactional target system, it supports automatic rollback through MongoDB's native transaction capabilities.

## Version Compatibility

| Component | Version Requirement |
|-----------|-------------------|
| MongoDB | 4.0.0+ |

MongoDB 4.0+ is required for transaction support.

## Installation

Add the MongoDB Java sync driver dependency to your project (version 4.0.0+ required):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.mongodb:mongodb-driver-sync:4.0.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-sync</artifactId>
    <version>4.0.0</version> <!-- 4.0.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the target system:

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database-id", mongoClient, "userDb");
```

The constructor requires the target system name, MongoDB client, and database name. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System Configuration

The MongoDB target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `MongoClient` | `mongoClient` | MongoDB connection client - **required** for both target system configuration and change execution |
| `String` | `databaseName` | Target database name - **required** to identify which database changes will affect |

### Optional Configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |


## Dependencies Available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `MongoClient`, `MongoDatabase`, `ClientSession`, plus any added via `.addDependency()`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database", productionMongoClient, "userDb")
    .withWriteConcern(WriteConcern.W1)         // Optional configuration
    .withReadPreference(ReadPreference.secondary())  // Optional configuration
    .addDependency(auditService);              // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)               // Available to all target systems
    .addDependency(logService)                 // Available to all target systems
    .addTargetSystems(mongoTarget)
    .build();
```

**Target system configuration resolution:**
- **MongoClient**: Must be provided via constructor (`productionMongoClient`)
- **Database name**: Must be provided via constructor (`"userDb"`)
- **WriteConcern**: Uses explicit configuration (`W1`) instead of default
- **ReadPreference**: Uses explicit configuration (`secondary()`) instead of default

**Change dependency resolution for Changes in "user-database":**
- **MongoClient**: From target system context (`productionMongoClient`)
- **MongoDatabase**: From target system context (derived from `productionMongoClient` + `"userDb"`)
- **ClientSession**: From target system context (created by Flamingock)
- **AuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage MongoDB's transactional capabilities, it must use the `ClientSession` parameter. Flamingock uses the injected `MongoClient` and `MongoDatabase` dependencies to create and manage this session's lifecycle - starting the transaction before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("user-database-id")
@Change(id = "create-users", order = "001")
public class CreateUsers {
    
    @Apply
    public void apply(MongoDatabase db, ClientSession session) {
        // The ClientSession is required for transactional execution
        // Flamingock uses the target system's MongoClient to create this session
        // and handles transaction start, commit, and rollback automatically
        db.getCollection("users")
          .insertOne(session, new Document("name", "John"));
    }
}
```

**How transactions work:**
1. **Session creation**: Flamingock uses the target system's `MongoClient` to create a `ClientSession`
2. **Transaction management**: The same `MongoClient` and `MongoDatabase` handle transaction operations
3. **Lifecycle**: Flamingock automatically starts the transaction, commits on success, or rolls back on failure

Without the `ClientSession` parameter, operations will execute but won't participate in transactions.

## Available dependencies in Changes

Your Changes can inject MongoDB-specific dependencies like `MongoClient`, `MongoDatabase`, and `ClientSession` (for transactions), but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [MongoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)