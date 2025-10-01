---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Spring Boot integration

Flamingock integrates seamlessly with Spring Boot, offering a powerful and flexible setup for managing your change units in Spring-based applications.

This integration leverages Spring Boot’s features—such as dependency injection, profiles, event publishing, and property configuration—to provide a streamlined and production-ready experience.


## Why integrate Flamingock with Spring Boot?

Using Flamingock with Spring Boot allows you to:

- Inject Spring-managed beans directly into change units
- Configure Flamingock via Spring Boot's native configuration files
- Use Spring profiles to control when specific change units run
- Receive execution lifecycle events using `ApplicationEventPublisher`
- Choose between Spring Boot lifecycle hooks (`ApplicationRunner` or `InitializingBean`) to run Flamingock.


## Two setup approaches

Flamingock offers **two ways to integrate with Spring Boot**, depending on how much control you want over the configuration and lifecycle.

### Builder-based setup (manual)

This approach gives you full control and uses the standard Flamingock builder with `@EnableFlamingock(setup = SetupType.BUILDER)`.
You manually inject the required Spring Boot components(ApplicationContext and ApplicationEventPublisher) as well as any Flamingock core configuration.

In addition, you can register other dependencies manually — these will take precedence over beans from the Spring context when resolving what to inject into change units.

This is recommended for advanced users or highly customized environments.

> See: [Builder-based setup](./builder-based-setup.md)


### Automatic setup

This is the simplest way to enable Flamingock in Spring Boot.
Just annotate any class with `@EnableFlamingock` (commonly your main application class), and Flamingock will:

- Auto-detect the application context and event publisher
- Read configuration from Spring Boot config files
- Automatically wire the `FlamingockRunner` bean
- Process the setup configuration from the annotation

Ideal for most users who prefer convention over configuration.

> See: [Automatic setup](./enable-flamingock-setup.md)


## Runner strategy: ApplicationRunner vs InitializingBean

Flamingock supports two strategies for executing its process during Spring Boot startup. You can control this via the `runnerType` property in your Spring configuration (`flamingock.runnerType`), or programmatically if using the manual builder.

### Comparison

|                                            | `ApplicationRunner`                                                        | `InitializingBean`                                                |
|--------------------------------------------|----------------------------------------------------------------------------|-------------------------------------------------------------------|
| **Phase**                                  | After all beans are initialized — just before the app is marked as started | During bean initialization — before the app is considered started |
| **Context availability**                   | ✅ Full — all Spring beans and profiles available                           | ⚠️ Limited — not all beans may be available                       |
| **Typical use case**                       | Most common — recommended for production environments                      | For lightweight internal logic or strict startup ordering         |
| **Events fully supported?**                | ✅ Yes                                                                      | ⚠️ Risky — context may not be fully ready                         |
| **Spring beans available in change units** | ✅ Yes                                                                      | ⚠️ May fail or be incomplete                                      |

### Startup failure behavior

If Flamingock encounters an error during execution — whether using `ApplicationRunner` or `InitializingBean` — the Spring Boot application **will fail to start**.

This is intentional: Flamingock runs before the application is marked as ready. In deployment platforms such as **Kubernetes**, a failure at this stage will:

- Prevent the container from reaching a *Ready* state
- Trigger restart policies, health checks, or rollbacks as configured
- Ensure that the system is never exposed in a partially initialized or inconsistent state

This behavior ensures your application only starts when all change units have been applied successfully.


## Dependency

To use the Spring Boot integration, add the following dependency:

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

### Version compatibility

The `flamingock-springboot-integration` artifact is compatible with both Spring Boot 2.x and 3.x. Your project's Spring Boot version determines the appropriate Spring framework and JDK requirements.

| Package Name                         | Spring Boot Version  |
|-------------------------------------|----------------------|
| `flamingock-springboot-integration` | 2.x and 3.x         |


## :white_check_mark: Best practices

Consider the following recommendations to get the most out of Flamingock’s Spring Boot integration:

- **Prefer `ApplicationRunner` as your runner strategy**
  It ensures Flamingock runs after the application context is fully initialized, giving it access to all beans, profiles, and configuration. It also integrates more safely with event publishing and external monitoring tools like Actuator or Prometheus.

- **Use automatic setup for simpler setups**
  Unless you have advanced needs (such as injecting non-Spring-managed dependencies), the automatic setup provides a clean and reliable integration path.

- **Use Spring profiles to scope change units**
  Profiles let you control when specific change units execute, avoiding the need for environment-specific pipelines.

- **Avoid manual execution unless absolutely necessary**
  Letting Spring handle the execution via `ApplicationRunner` or `InitializingBean` ensures Flamingock runs at the appropriate time in your application lifecycle.

- **Register custom platform components using `.addDependency(...)` only when required**
  Most applications using automatic setup will not need to register components manually.


