---
title: Default (Non-transactional)
sidebar_position: 6
---

# Default Target System

The Default target system (`DefaultTargetSystem`) is Flamingock's generic target system for any system that doesn't require specialized handling. It serves as the universal option when no dedicated target system implementation exists or is needed for your specific technology.

## Why use DefaultTargetSystem?

DefaultTargetSystem is the fallback choice when there's no specialized target system implementation available for your technology. While Flamingock provides dedicated target systems for technologies that benefit from specific handling (like transactional systems that leverage native rollback capabilities), many systems don't require such specialization.

**When to use DefaultTargetSystem:**
- No dedicated target system exists for your technology
- Your system doesn't have unique characteristics that warrant specialized handling
- You need a simple, flexible solution without technology-specific optimizations

**Future extensibility:** The Flamingock ecosystem may expand with more specialized target systems as specific needs are identified. 


**Common systems using DefaultTargetSystem:** Kafka Schema Registry, message queues, object storage (S3), REST APIs, file systems, cache systems, feature flags, search engines

## Minimum recommended setup

```java
DefaultTargetSystem schemaRegistry = new DefaultTargetSystem("kafka-schema-registry");
```

Unlike specialized target systems, DefaultTargetSystem requires no mandatory dependencies. You have complete flexibility to inject whatever dependencies your ChangeUnits need.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/target-system-configuration.md#dependency-resolution-hierarchy), you can provide dependencies via direct injection or global context.

### No required dependencies

DefaultTargetSystem has no `.withXXX()` methods for required dependencies. This provides maximum flexibility for working with any type of system.

### Generic dependency injection

All dependencies are provided through generic methods:

| Method | Description |
|--------|-------------|
| `.addDependency(object)` | Add a dependency by type |
| `.addDependency(name, object)` | Add a named dependency |
| `.setProperty(key, value)` | Set a configuration property |

Remember: If not provided directly, Flamingock searches the global context for dependencies.

## Configuration example

Here's a comprehensive example showing dependency resolution:

```java
// Target system with Kafka Schema Registry dependencies
DefaultTargetSystem schemaRegistry = new DefaultTargetSystem("kafka-schema-registry")
    .addDependency(schemaRegistryClient)
    .addDependency("registry-url", "http://schema-registry:8081")
    .setProperty("compatibility.level", "BACKWARD");

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(metricsService)           // Available to all targets
    .addDependency(notificationService)      // Available to all targets
    .addTargetSystems(schemaRegistry)
    .build();
```

**What gets resolved for ChangeUnits in "kafka-schema-registry":**
- **SchemaRegistryClient**: Available from target system context
- **Registry URL**: Available as "registry-url" from target system context  
- **Compatibility level**: Available as property from target system context
- **MetricsService**: Available from global context
- **NotificationService**: Available from global context

The target system context always takes precedence, ensuring proper isolation between different systems.

**How compensation works:**
1. **No transaction boundaries**: Operations execute immediately with no automatic rollback
2. **Rollback execution**: If any failure occurs, Flamingock calls the `@RollbackExecution` method
3. **Manual compensation**: You provide the logic to undo or compensate for the changes made

**Important**: Always provide `@RollbackExecution` methods for DefaultTargetSystem ChangeUnits to ensure safe rollback capabilities.

## Available dependencies in ChangeUnits

Your ChangeUnits can inject any dependencies you add to the target system context via `.addDependency()`, taking precedence over global dependencies. Common examples include system clients, configuration values, custom services, and properties.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Next steps

- Learn about [Target system configuration](../flamingock-library-config/target-system-configuration.md)
- Explore [ChangeUnits](../change-units/introduction.md)  
- See [DefaultTargetSystem examples](https://github.com/flamingock/flamingock-examples/tree/master/default)