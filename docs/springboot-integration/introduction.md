---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Spring Boot integration

Flamingock integrates seamlessly with Spring Boot, offering a powerful and flexible setup for managing your change units in Spring-based applications.

This integration leverages Spring Boot’s features—such as dependency injection, profiles, event publishing, and property configuration—to provide a streamlined and production-ready experience.

---

## Why integrate Flamingock with Spring Boot?

Using Flamingock with Spring Boot allows you to:

- Inject Spring-managed beans directly into change units
- Configure Flamingock via Spring Boot's native configuration files
- Use Spring profiles to control when specific change units run
- Receive execution lifecycle events using `ApplicationEventPublisher`
- Choose between Spring Boot lifecycle hooks (`ApplicationRunner` or `InitializingBean`) to run Flamingock

---

## Two setup approaches

Flamingock offers **two ways to integrate with Spring Boot**, depending on how much control you want over the configuration and lifecycle.

### Builder-based setup (manual)

This approach gives you full control and uses the standard Flamingock builder.  
You manually inject the required Spring Boot components as well as any Flamingock configuration (core or driver).

This is recommended for advanced users or highly customized environments.

> See: [Builder-based setup](./builder-based-setup.md)

---

### @EnableFlamingock setup (automatic)

This is the simplest way to enable Flamingock in Spring Boot.  
Just annotate your main application class with `@EnableFlamingock`, and Flamingock will:

- Auto-detect the application context and event publisher
- Read configuration from Spring Boot config files
- Automatically wire the `FlamingockRunner` bean

Ideal for most users who prefer convention over configuration.

> See: [@EnableFlamingock setup](./enable-flamingock-setup.md)

---

## Additional integration features

Once Flamingock is running in a Spring Boot context, you can benefit from:

- **Profile-based execution**: Run change units conditionally based on Spring profiles.  
  > See: [Profiles](./profiles.md)

- **Lifecycle integration**: Choose how and when Flamingock runs (e.g., at app startup).  
  > See: [Runner strategy](./runner-strategy.md)

- **Event publishing**: Listen to change execution events in your Spring components.  
  > See: [Event handling](./events.md)

---

## Dependency

To use the Spring Boot integration, add the appropriate module for your version:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
// For Spring Boot 2.x
implementation("io.flamingock:springboot-integration-v2:$flamingockVersion")

// For Spring Boot 3.x
implementation("io.flamingock:springboot-integration-v3:$flamingockVersion")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<!-- For springboot 2.x -->
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>sringboot-integration-v2</artifactId>
    <version>${flamingock.version}</version>
</dependency>

<!-- For springboot 3.x -->
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>sringboot-integration-v3</artifactId>
    <version>${flamingock.version}</version>
</dependency>
```
  </TabItem>
</Tabs>

