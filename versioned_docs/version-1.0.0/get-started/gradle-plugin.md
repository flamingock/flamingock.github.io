---
title: Gradle plugin
sidebar_position: 25
---

# Gradle plugin

The Flamingock Gradle Plugin provides zero-boilerplate dependency configuration for your Gradle projects. Instead of manually managing multiple dependencies, you configure Flamingock with a simple DSL.

## Why use the plugin?

Setting up Flamingock manually requires adding several dependencies:

```kotlin
// Without the plugin - multiple dependencies to manage
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-community")
implementation("io.flamingock:flamingock-springboot-integration")
testImplementation("io.flamingock:flamingock-springboot-test-support")
annotationProcessor("io.flamingock:flamingock-processor:$version")
```

With the plugin, this becomes:

```kotlin
// With the plugin - simple DSL
plugins {
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    springboot()
}
```

The plugin automatically adds the correct dependencies, annotation processors, and BOMs based on your configuration.


## Requirements

- **Gradle** 7.4+
- **Java** 8+


## Quick start

Add the plugin to your `build.gradle.kts`:

```kotlin
plugins {
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
}
```


## Configuration options

| Method | Description |
|--------|-------------|
| `community()` | Enables Community edition (adds BOM and core library) |
| `springboot()` | Adds Spring Boot integration and test support |
| `graalvm()` | Adds GraalVM native image support |
| `mongock()` | Enables seamless migration from Mongock — imports audit log, detects legacy change units, and executes pending ones |


## What gets added

The plugin automatically adds dependencies based on your configuration:

### Always added

```kotlin
annotationProcessor("io.flamingock:flamingock-processor:$version")
```

### community()

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-community")
```

### springboot()

```kotlin
implementation("io.flamingock:flamingock-springboot-integration")
testImplementation("io.flamingock:flamingock-springboot-test-support")
```

### graalvm()

```kotlin
implementation("io.flamingock:flamingock-graalvm")
```

### mongock()

```kotlin
implementation("io.flamingock:mongock-support")
annotationProcessor("io.flamingock:mongock-support")
```


## Examples

### Basic standalone application

```kotlin
plugins {
    java
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
}

dependencies {
    // Your audit store
    implementation("io.flamingock:flamingock-auditstore-mongodb-sync")

    // Your drivers
    implementation("org.mongodb:mongodb-driver-sync:5.0.0")
}
```

### Spring Boot application

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    springboot()
}

dependencies {
    // Your audit store
    implementation("io.flamingock:flamingock-auditstore-mongodb-sync")

    // Your drivers
    implementation("org.mongodb:mongodb-driver-sync:5.0.0")
}
```

### Migrating from Mongock

```kotlin
plugins {
    java
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    springboot()
    mongock()  // Adds Mongock migration support
}
```

### With GraalVM native image

```kotlin
plugins {
    java
    id("org.graalvm.buildtools.native") version "0.9.28"
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    graalvm()  // Adds GraalVM support
}
```


## Alternative: Manual dependencies

If you prefer to manage dependencies manually, or if you're using Maven, see the dependency sections in each feature's documentation:

- [Quick start](./quick-start.md) - Core Flamingock dependencies
- [Spring Boot integration](../frameworks/springboot-integration/introduction.md) - Spring Boot dependencies
- [Coming from Mongock](../resources/coming-from-mongock.md) - Mongock migration dependencies


## Links

- [Gradle Plugin Portal](https://plugins.gradle.org/plugin/io.flamingock)
- [Plugin source code](https://github.com/flamingock/flamingock-gradle-plugin)
