---
title: Introduction
sidebar_position: 0
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Target systems

Target systems are the real-world systems where your business changes are applied.
These include any external service your application interacts with or evolves - message queues, APIs, cloud services, databases, configuration stores, and more. The examples throughout this documentation are illustrative; Flamingock can work with any system your application needs to change.

A Change always declares which target system it belongs to. This ensures Flamingock can:
- Track and audit changes per system
- Guarantee safe execution across heterogeneous environments
- Provide clear visibility into which changes affect which systems

> **Conceptual Overview**: For architectural understanding of target systems vs audit store, see [Target Systems vs Audit Store](../overview/audit-store-vs-target-system.md).


## Why target systems matter

### Explicit ownership
Every change is tied to a named target system, avoiding ambiguity and enabling clear governance.

### Transactionality awareness
- **Transactional target systems** (like PostgreSQL, MySQL, or MongoDB with transactions) allow Flamingock to use native rollback and guarantees.
- **Non-transactional systems** (like S3, Kafka, or REST APIs) are still safe, but Flamingock relies on rollback methods you provide.

This distinction is built into the target system definition.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

### Dependency isolation

Each target system provides its own dependency context, ensuring **target system isolation**. This means each system has its own set of dependencies that are isolated from other target systems, providing clear boundaries and preventing dependency conflicts between different systems, while still supporting global dependency injection as a fallback.

This isolation enables:
- Clear ownership of dependencies per target system
- Prevention of cross-system dependency conflicts
- Easier testing and debugging of system-specific changes

## Target system configuration

Target systems are configured using a **strict, no-fallback approach** with explicit parameters:

**Mandatory configuration**: Provided through constructor parameters only
- Must be provided at target system creation time
- No fallback to global context
- Example: `MongoClient` and `databaseName` for MongoDB target systems

**Optional configuration**: Provided through `.withXXX()` methods only
- No fallback to global context
- Uses sensible defaults if not provided
- Example: `WriteConcern`, connection pool settings

```java
// Mandatory configuration via constructor
var mongoTarget = new MongoSyncTargetSystem("targetsystem-id", mongoClient, "userDatabase");

// Optional configuration via .withXXX() methods
mongoTarget.withWriteConcern(WriteConcern.MAJORITY)
           .withConnectionTimeout(5000);
```

**No global context fallback** - target system configuration must be explicit and complete.


## Registering target systems

Target systems are registered at runtime. You can define and register as many as you need:

<Tabs groupId="registration">
  <TabItem value="builder" label="Flamingock Builder" default>

Use the Flamingock builder for standalone applications:

```java
var mysql = new SqlTargetSystem("mysql-inventory-id", dataSource);

var s3 = new NonTransactionalTargetSystem("aws-s3-id");

var kafka = new NonTransactionalTargetSystem("kafka-stock-id");

Flamingock.builder()
    .setAuditStore(new MongoSyncAuditStore(mongoClient, mongoDatabase))
    .addTargetSystems(mysql, s3, kafka)
    .build()
    .run();
```

At startup, Flamingock automatically injects the right dependencies from the corresponding target system into each Change.

  </TabItem>
  <TabItem value="springboot" label="Spring Boot">

For Spring Boot applications, register target systems as beans:

```java
@Bean
public SqlTargetSystem sqlTargetSystem(DataSource dataSource) {
    return new SqlTargetSystem("mysql-inventory-id", dataSource);
}

@Bean
public MongoSyncTargetSystem mongoTargetSystem(MongoClient mongoClient) {
    return new MongoSyncTargetSystem("user-database-id", mongoClient, "userDb")
        .withWriteConcern(WriteConcern.MAJORITY);
}

@Bean
public NonTransactionalTargetSystem kafkaTargetSystem() {
    return new NonTransactionalTargetSystem("kafka-stock-id");
}
```

Spring Boot's auto-configuration will automatically register these target systems with Flamingock.

For more details, see [Spring Boot Integration](../frameworks/springboot-integration/introduction.md).

  </TabItem>
</Tabs>



## Linking Changes to target systems

When defining Changes, you specify which target system they belong to using the `@TargetSystem` annotation:

```java
@TargetSystem("mysql-inventory-id")
@Change(id = "add-category", order = "001", author = "team")
public class _001_AddCategory {
    //...
}
```



## Dependency injection

Dependency injection is the mechanism used for **change execution**, providing the dependencies that Changes need to perform their operations. Each target system exposes specific dependencies required by its Changes:

- A MongoDB target system provides a `MongoDatabase`, `ClientSession`
- A Kafka target system provides a `KafkaTemplate`
- A SQL target system provides a `Connection` or `DataSource`

Flamingock uses a **flexible, multi-source approach** with fallback hierarchy for change execution:

1. **Target system context** (highest priority) - includes configuration parameters from constructor + `.withXXX()` methods
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

:::info 
Target system configuration parameters (from **constructor** and `.withXXX()` methods) are automatically available as change dependencies with highest priority.
:::

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).


## Cloud Edition visibility

In the Cloud Edition, target systems become a first-class part of the dashboard:
- See all changes grouped by target system
- Filter execution history by system
- Track failures and recoveries per system

This makes it easier to govern and audit distributed environments at scale.


## Best practices

- Use descriptive names (`mysql-inventory`, `aws-s3`, `kafka-stock`)
- Be consistent across related Changes
- Avoid generic names like "database" or "api"
- Provide rollback logic for non-transactional systems
- Keep dependencies scoped to the system they belong to — don’t overload the general context when they are system-specific


## Available target system implementations

Flamingock provides several built-in target system implementations. The ecosystem includes specialized implementations for technologies that benefit from specific handling, and a universal fallback for everything else:

### Specialized target systems
These target systems provide optimized handling for specific technologies:

**Transactional systems** - Leverage native transaction capabilities for automatic rollback:
- [MongoDB target system](../target-systems/mongodb-target-system.md) - For MongoDB with the sync driver
- [MongoDB Spring Data target system](../target-systems/mongodb-springdata-target-system.md) - For MongoDB with Spring Data
- [SQL target system](../target-systems/sql-target-system.md) - For relational databases (PostgreSQL, MySQL, etc.)
- [DynamoDB target system](../target-systems/dynamodb-target-system.md) - For Amazon DynamoDB
- [Couchbase target system](../target-systems/couchbase-target-system.md) - For Couchbase

### Universal fallback
For any system that doesn't require specialized handling:

- [Non-transactional target system](../target-systems/non-transactional-target-system.md) - The fallback choice for any system without a dedicated implementation (Kafka Schema Registry, S3, REST APIs, file systems, etc.)

**Future extensibility**: The Flamingock ecosystem may expand with more specialized target systems as specific needs are identified. These can be implemented by the Flamingock team, community contributions, or custom implementations by users.


**Key Takeaway**: Target systems provide the foundation for safe, auditable changes across your entire technology stack. By explicitly declaring and configuring them, you enable Flamingock to orchestrate complex distributed system evolution with confidence.