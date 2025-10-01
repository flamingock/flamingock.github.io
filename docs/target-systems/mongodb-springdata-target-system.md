---
title: MongoDB Spring Data
sidebar_position: 4
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Spring Data Target System

The MongoDB Spring Data target system (`MongoDBSpringDataTargetSystem`) enables Flamingock to apply changes to MongoDB databases using Spring Data MongoDB. As a transactional target system, it integrates seamlessly with Spring's transaction management and supports automatic rollback through MongoDB's native transaction capabilities.

## Version compatibility

| Component | Version Requirement |
|-----------|-------------------|
| Spring Data MongoDB | 3.1.x - 4.x |

Spring Data MongoDB versions from 3.1.x through 4.x are supported. Version 3.1.x+ is included in Spring Boot 2.4.3+.

## Installation

Add the Spring Data MongoDB dependency to your project (versions 3.1.x - 4.x supported):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.springframework.data:spring-data-mongodb:3.1.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-mongodb</artifactId>
    <version>3.1.0</version> <!-- 3.1.x - 4.x supported -->
</dependency>
```
  </TabItem>
</Tabs>


## Basic setup

Configure the target system:

```java
var mongoTarget = new MongoDBSpringDataTargetSystem("user-database-id", mongoTemplate);
```

The constructor requires the target system name and MongoDB template. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System configuration

The MongoDB Spring Data target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor dependencies (mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `MongoTemplate` | `mongoTemplate` | Spring Data MongoDB template - **required** for both target system configuration and change execution |

## Dependencies available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `MongoTemplate`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var mongoTarget = new MongoDBSpringDataTargetSystem("user-database", userMongoTemplate)
    .addDependency(userAuditService);          // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)               // Available to all target systems
    .addDependency(logService)                 // Available to all target systems
    .addTargetSystems(mongoTarget)
    .build();
```

**Target system configuration resolution:**
- **MongoTemplate**: Must be provided via constructor (`userMongoTemplate`)

**Change dependency resolution for Changes in "user-database":**
- **MongoTemplate**: From target system context (`userMongoTemplate`)
- **UserAuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

Spring Data MongoDB target system integrates with Spring's transaction management. When a Change is marked as transactional (the default), Flamingock uses the injected `MongoTemplate` dependency to handle transaction operations through Spring's infrastructure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("user-database-id")
@Change(id = "create-users", author = "team")  // order extracted from filename
public class _0001__CreateUsers {

    @Apply
    public void apply(MongoTemplate mongoTemplate) {
        // MongoTemplate automatically participates in Spring transactions
        // Flamingock uses the target system's MongoTemplate for transaction management
        // through Spring's @Transactional infrastructure
        mongoTemplate.save(new User("john@example.com", "John Doe"));
    }
}
```

**How transactions work:**
1. **Spring integration**: Flamingock leverages the target system's `MongoTemplate` within Spring's transaction context
2. **Transaction management**: The same `MongoTemplate` handles both Change operations and transaction coordination
3. **Lifecycle**: Spring's transaction infrastructure manages start, commit, and rollback automatically

The transaction lifecycle is managed through Spring's transaction infrastructure, ensuring consistency with your existing Spring Data operations.

## Available dependencies in Changes

Your Changes can inject Spring Data dependencies like `MongoTemplate`, but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Spring integration

This target system is designed to work seamlessly with Spring Boot applications. When using Spring Boot auto-configuration, your existing `MongoTemplate` beans are automatically available for injection into target systems.

For more information on Spring Boot integration, see [Spring Boot integration](../frameworks/springboot-integration/introduction.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [Flamingock examples](https://github.com/flamingock/flamingock-java-examples)
