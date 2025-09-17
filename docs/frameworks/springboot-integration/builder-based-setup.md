---
title: Builder-based (manual)
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Flamingock supports manual integration with Spring Boot using the same builder API shared with standalone setups. 

This unified approach makes it easy to switch between environments without changing your integration logic, while giving you full control over how Flamingock is initialized and executed within your application.

It’s especially useful when integrating Flamingock alongside other frameworks, when you need fine-grained control over the setup process, or when you want to override or prioritize specific dependencies manually.


## Import the springboot integration library

Add the Flamingock Spring Boot integration dependency:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation("io.flamingock:flamingock-springboot-integration:$flamingockVersion")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-springboot-integration</artifactId>
    <version>${flamingock.version}</version>
</dependency>
```
  </TabItem>
</Tabs>

### Version Compatibility

Check [Version Compatibility](introduction.md#version-compatibility)

## Configure setup and build Flamingock manually

With the manual setup, you first need to configure Flamingock using `@EnableFlamingock` annotation with `setup = SetupType.BUILDER`, then manually configure and run Flamingock using the builder API.

### 1. Configure the annotation

```java
@EnableFlamingock(
    setup = SetupType.BUILDER,
    stages = {
        @Stage(location = "com.yourapp.changes")
    }
)
@Configuration
public class FlamingockConfig {
    // Configuration class
}
```

### 2. Manual builder configuration

With the manual setup, you are responsible for configuring and running Flamingock using the builder API. This includes:

- Providing your configuration (e.g., lock settings, metadata) directly via the builder
- Registering the required **platform components** using `.addDependency(...)`
- `ApplicationContext`
- `ApplicationEventPublisher`

```java
FlamingockBuilder builder = Flamingock
    .setLockAcquiredForMillis(120000) // example config
    .addDependency(applicationContext)
    .addDependency(applicationEventPublisher);
```

:::info
Platform components are registered using the same `.addDependency(...)` method used for change unit dependencies.  
For details, see the [Context and dependencies](../../flamingock-library-config/context-and-dependencies.md) page.
:::
## Overriding Spring-provided dependencies
When using the builder-based setup, Flamingock will attempt to resolve dependencies using the Spring context.

However, if you manually register a dependency via `.addDependency(...)`, that dependency will take precedence over anything resolved from the Spring context. This gives you fine-grained control when you want to:

- Override a Spring-managed bean with a custom instance
- Inject mock or test-specific versions of services
- Provide external or non-Spring-managed components directly

```java
builder
  .addDependency(customClientService) // Overrides Spring's bean of same type
  .addDependency(applicationContext); // Registers Spring context for base dependency injection
```
In a nutshell, Flamingock resolves dependencies using the following order:
- Manually added dependencies via .addDependency(...)
- Beans from the Spring context (if ApplicationContext was registered)


## Running Flamingock

Once you've configured the builder, you can choose how to execute Flamingock:

### Option 1: Run manually

You can run Flamingock manually:

```java
builder.build().run();
```

### Option 2: Expose as a Spring Bean

Alternatively, you can integrate Flamingock into the Spring Boot lifecycle by exposing it as an `ApplicationRunner` or `InitializingBean`:

```java
@Bean
public ApplicationRunner flamingockRunner() {
  return SpringbootUtil.toApplicationRunner(builder.build());
}
```

Or:

```java
@Bean
public InitializingBean flamingockRunner() {
  return SpringbootUtil.toInitializingBean(builder.build());
}
```

This ensures Flamingock executes automatically as part of the Spring Boot startup sequence.


## Next steps

**Want to avoid manual setup?** Explore the [Automatic Setup](./enable-flamingock-setup.md) for automatic integration with minimal code.
