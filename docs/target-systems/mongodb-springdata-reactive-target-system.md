---
title: MongoDB Spring Data Reactive
sidebar_position: 5
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Spring Data Reactive Target System

The MongoDB Spring Data Reactive target system (`MongoDBSpringDataReactiveTargetSystem`) enables Flamingock to apply changes to MongoDB databases using Spring Data's `ReactiveMongoTemplate`. As a transactional target system, it integrates with Spring's reactive transaction management and supports automatic rollback through MongoDB's native transaction capabilities.

## Version compatibility

| Component | Version Requirement |
|-----------|-------------------|
| Spring Data MongoDB (reactive) | 3.1.x - 4.x |
| MongoDB Reactive Streams Driver | 4.0.0+ |
| Project Reactor | 3.4.x+ |

Spring Data MongoDB versions from 3.1.x through 4.x are supported. Version 3.1.x+ is included in Spring Boot 2.4.3+.

## Installation

Add the Spring Data MongoDB reactive dependency to your project (versions 3.1.x - 4.x supported):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.springframework.data:spring-data-mongodb:3.1.4")
implementation("org.mongodb:mongodb-driver-reactivestreams:4.0.0")
implementation("io.projectreactor:reactor-core:3.4.34")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-mongodb</artifactId>
    <version>3.1.4</version> <!-- 3.1.x - 4.x supported -->
</dependency>
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-reactivestreams</artifactId>
    <version>4.0.0</version>
</dependency>
<dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-core</artifactId>
    <version>3.4.34</version>
</dependency>
```
  </TabItem>
</Tabs>


## Basic setup

Configure the target system:

```java
var mongoTarget = new MongoDBSpringDataReactiveTargetSystem("user-database-id", reactiveMongoTemplate);
```

The constructor requires the target system name and a `ReactiveMongoTemplate`. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System configuration

The MongoDB Spring Data Reactive target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor dependencies (mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `ReactiveMongoTemplate` | `mongoTemplate` | Spring Data reactive MongoDB template - **required** for both target system configuration and change execution |

## Dependencies available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `ReactiveMongoTemplate`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var mongoTarget = new MongoDBSpringDataReactiveTargetSystem("user-database", userReactiveMongoTemplate)
    .addDependency(userAuditService);          // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)               // Available to all target systems
    .addDependency(logService)                 // Available to all target systems
    .addTargetSystems(mongoTarget)
    .build();
```

**Target system configuration resolution:**
- **ReactiveMongoTemplate**: Must be provided via constructor (`userReactiveMongoTemplate`)

**Change dependency resolution for Changes in "user-database":**
- **ReactiveMongoTemplate**: From target system context (`userReactiveMongoTemplate`)
- **UserAuditService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

The Spring Data Reactive target system integrates with Spring's reactive transaction management. When a Change is marked as transactional (the default), Flamingock uses the injected `ReactiveMongoTemplate` dependency to handle transaction operations through Spring's reactive infrastructure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("user-database-id")
@Change(id = "create-users", author = "team")  // order extracted from filename
public class _0001__CreateUsers {

    @Apply
    public void apply(ReactiveMongoTemplate mongoTemplate) {
        // ReactiveMongoTemplate automatically participates in Flamingock-managed transactions
        // The publisher must be subscribed to (e.g. via block()) for the operation to execute
        mongoTemplate.save(new User("john@example.com", "John Doe")).block();
    }
}
```

**How transactions work:**
1. **Reactive integration**: Flamingock leverages the target system's `ReactiveMongoTemplate` within its transaction context
2. **Transaction management**: The same `ReactiveMongoTemplate` handles both Change operations and transaction coordination
3. **Lifecycle**: Flamingock automatically starts the transaction, commits on success, or rolls back on failure

:::info Reactive publishers must be consumed
`ReactiveMongoTemplate` operations return `Mono`/`Flux` publishers that only execute once subscribed to. Make sure your Change method blocks on (or otherwise awaits) every publisher it produces before returning, so the operation actually completes within the Change's lifecycle.
:::

## Available dependencies in Changes

Your Changes can inject `ReactiveMongoTemplate`, but are not limited to it. The target system provides this dependency through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Spring integration

This target system is designed to work seamlessly with Spring Boot applications using Spring WebFlux. When using Spring Boot auto-configuration, your existing `ReactiveMongoTemplate` beans are automatically available for injection into target systems.

For more information on Spring Boot integration, see [Spring Boot integration](../frameworks/springboot-integration/introduction.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [Flamingock examples](https://github.com/flamingock/flamingock-java-examples)
