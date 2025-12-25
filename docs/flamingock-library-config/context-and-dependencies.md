---
title: Context and dependencies
sidebar_position: 20
---

# Context and dependencies

Flamingock provides a sophisticated dependency injection system that automatically resolves dependencies for Changes from multiple sources. Understanding this system is crucial for building maintainable and well-structured changes.

## What is the context?

The context is Flamingock's dependency container that holds all the dependencies your Changes might need. It's organized hierarchically, allowing for proper scoping and isolation of dependencies.

Contexts can contain:
- System connectors (databases, message queues, storage services, APIs)
- Configuration properties and objects
- Service instances and business logic components
- Framework-specific beans (like Spring components)
- Custom utilities and helpers

## Dependency resolution hierarchy

Flamingock uses a **hierarchical resolution strategy** that searches for dependencies in this order:

1. **Target system context** - Dependencies provided by the specific target system. For more information, see [Target systems](../target-systems/introduction.md#dependency-injection).
2. **General application context** - Shared dependencies registered globally directly in the builder  
3. **Framework context** - When using Spring Boot, beans from the Spring container. For more information, see [Spring Boot integration](../frameworks/springboot-integration/introduction.md).

This approach ensures that system-specific dependencies are properly scoped while allowing shared utilities to be available everywhere.

### How it works in practice

When a Change needs a dependency, Flamingock follows a specific search pattern. For example, imagine your Change requires a `NotificationService`:

**Scenario 1**: If the Kafka target system provides its own notification service specifically for event streaming, and your Change belongs to that Kafka target system, Flamingock will use the Kafka-specific notification service. The target system context always wins.

**Scenario 2**: If your MongoDB target system doesn't provide a notification service, but you've registered one globally in Flamingock's builder, the Change will receive that global notification service. Flamingock searches the target system first, doesn't find it, then falls back to the global context.

**Scenario 3**: In a Spring Boot application, if neither the target system nor the global context provides the dependency, Flamingock will look for a Spring bean of that type. This allows seamless integration with your existing Spring components.

This hierarchy ensures that specialized implementations (like a Kafka-optimized notification service) are used when available, while still allowing shared services to be accessible across all Changes.

## Providing dependencies

### Target system dependencies

Every target system provides two ways to add dependencies:

**Specific methods** - Each concrete implementation offers `.withXXX()` methods for common dependencies:
```java
var mongoTarget = new MongoDBSyncTargetSystem("user-db", mongoClient, databaseName)
                .withReadConcern(ReadConcern.MAJORITY)              // MongoDB specific method
                .withReadPreference(ReadPreference.primary())       // MongoDB specific method
                .withWriteConcern(WriteConcern.MAJORITY);           // MongoDB specific method
```

**Generic methods** - All target systems (including NonTransactionalTargetSystem) support generic dependency injection:
```java
var kafkaTarget = new NonTransactionalTargetSystem("events-id")
    .addDependency(kafkaProducer)
    .addDependency("notification-service", notificationService)
    .setProperty("batch.size", 1000);
```

This flexibility allows NonTransactionalTargetSystem to inject any dependencies needed for non-transactional systems, while specialized target systems provide convenience methods for their common dependencies.

### Global dependencies

You can register dependencies globally to make them available to all Changes:

```java
Flamingock.builder()
    .addDependency(userService)
    .addDependency(emailService)
    .addDependency(configurationProperties)
    .addTargetSystems(mongoTarget)
    .build();
```

### Framework dependencies

When using frameworks like Spring Boot, Flamingock automatically accesses beans from the framework container:

```java
@Service
public class UserService {
    // This service is automatically available to Changes
}
```

:::warning
Remember that target system contexts are isolated. Dependencies in one target system aren't available to Changes in another target system.
:::

## Best practices

### Scope dependencies appropriately
- **Target system specific**: System connectors (DB, Kafka, S3, etc.), system-specific configurations
- **Global**: Shared services, utilities, application-wide configuration
- **Framework**: Let Spring manage beans, services, and repositories


**Key takeaway**: Flamingock's hierarchical dependency resolution provides flexibility while maintaining clear separation of concerns. Use target system contexts for system-specific dependencies and global context for shared resources.