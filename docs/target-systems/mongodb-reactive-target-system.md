---
title: MongoDB Reactive
sidebar_position: 4
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Reactive Target System

The MongoDB Reactive target system (`MongoDBReactiveTargetSystem`) enables Flamingock to apply changes to MongoDB databases using the official MongoDB reactive streams driver. As a transactional target system, it supports automatic rollback through MongoDB's native transaction capabilities.

## Version compatibility

| Component | Version Requirement |
|-----------|-------------------|
| MongoDB Reactive Streams Driver | 4.0.0+ |

MongoDB 4.0+ is required for transaction support.

## Installation

Add the MongoDB reactive streams driver dependency to your project (version 4.0.0+ required):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.mongodb:mongodb-driver-reactivestreams:4.0.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-reactivestreams</artifactId>
    <version>4.0.0</version> <!-- 4.0.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the target system:

```java
var mongoTarget = new MongoDBReactiveTargetSystem("user-database-id", mongoClient, "userDb");
```

The constructor requires the target system name, a reactive `MongoClient`, and the database name. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System configuration

The MongoDB Reactive target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor dependencies (mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `MongoClient` (reactive) | `mongoClient` | Reactive MongoDB connection client - **required** for both target system configuration and change execution |
| `String` | `databaseName` | Target database name - **required** to identify which database changes will affect |

## Dependencies available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `MongoClient`, `MongoDatabase`, `ClientSession` (all from the reactive streams driver)
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var mongoTarget = new MongoDBReactiveTargetSystem("user-database", productionMongoClient, "userDb")
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

**Change dependency resolution for Changes in "user-database":**
- **MongoClient**: From target system context (`productionMongoClient`)
- **MongoDatabase**: From target system context (derived from `productionMongoClient` + `"userDb"`)
- **ClientSession**: From target system context (created by Flamingock)
- **AuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage MongoDB's transactional capabilities, it must use the reactive `ClientSession` parameter. Flamingock uses the injected `MongoClient` and `MongoDatabase` dependencies to create and manage this session's lifecycle - starting the transaction before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("user-database-id")
@Change(id = "create-users", author = "team")  // order extracted from filename
public class _0001__CreateUsers {

    @Apply
    public void apply(MongoDatabase db, ClientSession session) {
        // The reactive ClientSession is required for transactional execution
        // Flamingock uses the target system's MongoClient to create this session
        // and handles transaction start, commit, and rollback automatically
        MongoCollection<Document> users = db.getCollection("users");
        Publisher<InsertOneResult> insert = users.insertOne(session, new Document("name", "John"));

        // The Change method runs synchronously from Flamingock's point of view, so the
        // publisher must be awaited before returning - it won't execute on its own.
        Mono.from(insert).block();
    }
}
```

**How transactions work:**
1. **Session creation**: Flamingock uses the target system's reactive `MongoClient` to create a `ClientSession`
2. **Transaction management**: The same `MongoClient` and `MongoDatabase` handle transaction operations
3. **Lifecycle**: Flamingock automatically starts the transaction, commits on success, or rolls back on failure

Without the `ClientSession` parameter, operations will execute but won't participate in transactions.

:::info Reactive publishers must be consumed
The reactive streams driver returns `Publisher` objects that only execute once subscribed to - Flamingock does not subscribe to them for you. Every publisher produced inside a Change must be awaited before the method returns, so the operation actually completes within the Change's lifecycle and any failure surfaces synchronously (required for Flamingock to catch it and trigger rollback).

The example above uses Project Reactor's `Mono.from(publisher).block()`, since Reactor is already a common dependency in reactive stacks (and a hard requirement for the [Spring Data Reactive target system](mongodb-springdata-reactive-target-system.md)). If you'd rather not add Reactor as a dependency, subscribe with your own `Subscriber` (or RxJava's `Flowable.fromPublisher(...)`) and block until `onComplete`/`onError`.
:::

## Available dependencies in Changes

Your Changes can inject MongoDB reactive-specific dependencies like `MongoClient`, `MongoDatabase`, and `ClientSession` (for transactions), but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [Flamingock examples](https://github.com/flamingock/flamingock-java-examples)
