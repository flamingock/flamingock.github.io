---
title: Introduction
sidebar_position: 0
---

# Target systems

Target systems are the real-world systems where your business changes are applied.  
They can be databases, message queues, storage buckets, APIs, or any external service your application depends on.

A ChangeUnit always declares which target system it belongs to. This ensures Flamingock can:
- Track and audit changes per system
- Guarantee safe execution across heterogeneous environments
- Provide clear visibility (and, in the Cloud Edition, dashboards and filters per target system)

> **Conceptual Overview**: For architectural understanding of target systems vs audit store, see [Target Systems vs Audit Store](../overview/audit-store-vs-target-system.md).

---

## Why target systems matter

### Explicit ownership
Every change is tied to a named target system, avoiding ambiguity and enabling clear governance.

### Transactionality awareness
- **Transactional target systems** (like PostgreSQL, MySQL, or MongoDB with transactions) allow Flamingock to use native rollback and guarantees.
- **Non-transactional systems** (like S3, Kafka, or REST APIs) are still safe, but Flamingock relies on rollback methods you provide.

This distinction is built into the target system definition.

### Dependency injection

Each target system can expose the dependencies required by its ChangeUnits. For example:
- A MongoDB target system provides a `MongoDatabase`
- A Kafka target system provides a `KafkaTemplate`  
- A SQL target system provides a `Connection` or `DataSource`

#### Dependency resolution hierarchy

Each target system needs specific dependencies to function (except `DefaultTargetSystem` which requires none). When Flamingock initializes a target system, it resolves dependencies using this hierarchy:

1. **Direct injection** via `.withXXX()` methods (highest priority)
2. **Global context** lookup if not directly injected
3. **Default values** for optional configurations, or **exception** for required ones

This approach provides maximum flexibility while ensuring all requirements are met:

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-db")
    .withDatabase(database);

// Resolution process:
// - MongoDatabase: provided directly ✓
// - MongoClient: searches global context
// - WriteConcern: not found, uses default (MAJORITY with journal)
// - If MongoClient missing from global context: throws exception
```

:::info
ChangeUnits are not limited to target system dependencies. They can also request shared or application-level dependencies. Flamingock resolves them automatically, starting from the target system context and falling back to the general context.
:::

---

## Registering target systems

Target systems are registered at runtime with the Flamingock builder.  
You can define and register as many as you need:

```java

SqlTargetSystem mysql = new SqlTargetSystem("mysql-inventory")
    .withDatasource(ds);

DefaultTargetSystem s3 = new DefaultTargetSystem("aws-s3");

DefaultTargetSystem kafka = new DefaultTargetSystem("kafka-stock");

Flamingock.builder()
    .setAuditStore(new MongoSyncAuditStore(mongoClient, mongoDatabase))
    .addTargetSystems(mysql, s3, kafka)
    .build()
    .run();
  
```

At startup, Flamingock automatically injects the right dependencies from the corresponding target system into each ChangeUnit.

### Spring Boot Integration
For Spring Boot applications, target systems are configured as beans:

```java
@Bean
public SqlTargetSystem sqlTargetSystem(DataSource dataSource) {
    return new SqlTargetSystem("mysql-inventory")
        .withDatasource(dataSource);
}

@Bean  
public DefaultTargetSystem kafkaTargetSystem() {
    return new DefaultTargetSystem("kafka-stock");
}
```

Spring Boot's auto-configuration will automatically register these target systems with Flamingock.

For more details, see [Spring Boot Integration](../frameworks/springboot-integration/introduction.md).


---

## Linking ChangeUnits to target systems

When defining ChangeUnits, you specify which target system they belong to using the `@TargetSystem` annotation:

```java
@TargetSystem("mysql-inventory")
@ChangeUnit(id = "add-category", order = "001", author = "team")
public class _001_AddCategory {
    //...
}
```


---

## Cloud Edition visibility

In the Cloud Edition, target systems become a first-class part of the dashboard:
- See all changes grouped by target system
- Filter execution history by system
- Track failures and recoveries per system

This makes it easier to govern and audit distributed environments at scale.

---

## Best practices

- Use descriptive names (`mysql-inventory`, `aws-s3`, `kafka-stock`)
- Be consistent across related ChangeUnits
- Avoid generic names like "database" or "api"
- Provide rollback logic for non-transactional systems
- Keep dependencies scoped to the system they belong to — don’t overload the general context when they are system-specific

---

## Available target system implementations

Flamingock provides several built-in target system implementations, organized by their transactional capabilities:

### Transactional target systems
These systems support native transactions, allowing automatic rollback on failure:

- [MongoDB target system](../target-systems/mongodb-target-system.md) - For MongoDB with the sync driver
- [MongoDB Spring Data target system](../target-systems/mongodb-springdata-target-system.md) - For MongoDB with Spring Data
- [SQL target system](../target-systems/sql-target-system.md) - For relational databases (PostgreSQL, MySQL, etc.)
- [DynamoDB target system](../target-systems/dynamodb-target-system.md) - For Amazon DynamoDB
- [Couchbase target system](../target-systems/couchbase-target-system.md) - For Couchbase

### Non-transactional target systems
These systems don't support native transactions but are still safe through Flamingock's compensation mechanisms:

- [Default target system](../target-systems/default-target-system.md) - For any non-transactional system (S3, Kafka, REST APIs, etc.)

---

**Key Takeaway**: Target systems provide the foundation for safe, auditable changes across your entire technology stack. By explicitly declaring and configuring them, you enable Flamingock to orchestrate complex distributed system evolution with confidence.