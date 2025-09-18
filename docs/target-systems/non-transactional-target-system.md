---
title: Non transactional
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Non-transactional Target System

The Non-transactional target system (`NonTransactionalTargetSystem`) is Flamingock's generic target system for any system that doesn't require specialized handling. It serves as the universal option when no dedicated target system implementation exists or is needed for your specific technology.

## Why use NonTransactionalTargetSystem?

NonTransactionalTargetSystem is the fallback choice when there's no specialized target system implementation available for your technology. While Flamingock provides dedicated target systems for technologies that benefit from specific handling (like transactional systems that leverage native rollback capabilities), many systems don't require such specialization.

**When to use NonTransactionalTargetSystem:**
- No dedicated target system exists for your technology
- Your system doesn't have unique characteristics that warrant specialized handling
- You need a simple, flexible solution without technology-specific optimizations

**Future extensibility:** The Flamingock ecosystem may expand with more specialized target systems as specific needs are identified. 


**Common systems using NonTransactionalTargetSystem:** Kafka Schema Registry, message queues, object storage (S3), REST APIs, file systems, cache systems, feature flags, search engines

## Installation

No specific dependencies are required for DefaultTargetSystem. You can add any dependencies needed for your specific use case.

## Basic setup

Configure the target system:

```java
var schemaRegistry = new NonTransactionalTargetSystem("kafka-schema-registry-id");
```

Unlike specialized target systems, NonTransactionalTargetSystem requires no mandatory constructor dependencies. You have complete flexibility to inject whatever dependencies your Changes need.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System Configuration

The Non-transactional target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor Dependencies (None)

Unlike specialized target systems, NonTransactionalTargetSystem requires **no mandatory constructor dependencies**:

```java
// Only requires the target system name
var targetSystem = new NonTransactionalTargetSystem("system-name-id");
```

### Target System Configuration (Generic)

All dependencies and configurations are provided through generic methods with **no global context fallback** during target system configuration:

| Method | Description |
|--------|-------------|
| `.addDependency(object)` | Add a dependency by type for changes |
| `.addDependency(name, object)` | Add a named dependency for changes |
| `.setProperty(key, value)` | Set a configuration property for changes |

## Dependencies Available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - any dependencies added via `.addDependency()` or properties via `.setProperty()`
2. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (no mandatory constructor dependencies)
var schemaRegistry = new DefaultTargetSystem("kafka-schema-registry")
    .addDependency(schemaRegistryClient)     // Additional dependency for changes
    .addDependency("registry-url", "http://schema-registry:8081")  // Named dependency
    .setProperty("compatibility.level", "BACKWARD");  // Configuration property

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(metricsService)           // Available to all target systems
    .addDependency(notificationService)      // Available to all target systems
    .addTargetSystems(schemaRegistry)
    .build();
```

**Target system configuration resolution:**
- **No mandatory dependencies**: Target system created with name only
- **Additional dependencies**: Added via `.addDependency()` methods
- **Configuration properties**: Added via `.setProperty()` method

**Change dependency resolution for Changes in "kafka-schema-registry":**
- **SchemaRegistryClient**: From target system additional dependencies
- **Registry URL**: From target system context as named dependency ("registry-url")
- **Compatibility level**: From target system context as property ("compatibility.level")
- **MetricsService**: From global context (fallback)
- **NotificationService**: From global context (fallback)

This architecture provides maximum flexibility while maintaining clear separation between target system setup and change execution.

**How compensation works:**
1. **No transaction boundaries**: Operations execute immediately with no automatic rollback
2. **Rollback execution**: If any failure occurs, Flamingock calls the `@Rollback` method
3. **Manual compensation**: You provide the logic to undo or compensate for the changes made

**Important**: Always provide `@Rollback` methods for NonTransactionalTargetSystem Changes to ensure safe rollback capabilities.

## Available dependencies in Changes

Your Changes can inject any dependencies you add to the target system context via `.addDependency()` or properties via `.setProperty()`, which take precedence over global dependencies. Common examples include system clients, configuration values, custom services, and properties.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)  
- See [NonTransactionalTargetSystem examples](https://github.com/flamingock/flamingock-examples/tree/master/default)