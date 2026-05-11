---
title: GraalVM
sidebar_position: 80
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GraalVM support

Flamingock provides **first-class support for GraalVM native images**, so your application can compile into a fast, self-contained executable without losing change tracking, rollback, or template support.

This page covers two setups: a **plain Java project with Gradle** and a **Spring Boot project** using Spring Boot's Native Build Tools.


## How it works

- At compile time, the Flamingock annotation processor records the classes that need reflective access at runtime — your `@Change` classes, discovered templates, and their payload types.
- The `flamingock-graalvm` artifact ships a GraalVM `Feature` (`RegistrationFeature`) together with a `META-INF/native-image/native-image.properties` descriptor. When the artifact is on the native-image classpath, GraalVM applies the feature automatically.
- At native-image build time, the feature reads Flamingock's compile-time records and registers the required classes for reflection.

No hand-written `reflect-config.json`, no `resource-config.json`, and no `--features=...` flag are required.

:::tip
For a primer on GraalVM native images, see the [GraalVM Native Image basics guide](https://www.graalvm.org/latest/reference-manual/native-image/basics/).
:::


## Setup: Spring Boot

When you use Spring Boot, prefer Spring Boot's Native Build Tools plugin. It produces the AOT artifacts Spring Boot needs and invokes `native-image` for you. Flamingock's feature is picked up automatically alongside Spring's contributions.

### 1. Apply the plugins

```kotlin
plugins {
    java
    id("org.springframework.boot") version "[SPRING_BOOT_VERSION]"
    id("io.spring.dependency-management") version "[DEP_MGMT_VERSION]"
    id("io.flamingock") version "[VERSION]"
    id("org.graalvm.buildtools.native") version "[NATIVE_BUILDTOOLS_VERSION]"
}
```


### 2. Enable Flamingock GraalVM support

```kotlin
flamingock {
    springboot()
    graalvm()
    // Add any template methods you use, e.g. sql(), mongodb(), etc.
}
```

Template methods are listed on the [Gradle plugin page](../get-started/gradle-plugin.md#configuration-options).


### 3. Build the native image

```bash
./gradlew nativeCompile
```

Spring Boot's AOT processing and Flamingock's GraalVM feature interoperate without additional configuration. For a container-based image, `./gradlew bootBuildImage` works the same way.


### 4. Run the native image

```bash
./build/native/nativeCompile/your-app
```

:::info JDK
Spring Boot pins to specific JDK and GraalVM versions for native image builds. Match your JDK to the Spring Boot version you are using; see Spring Boot's native image documentation for the supported combination.
:::

:::tip
For more on image creation options, see the [GraalVM build overview](https://www.graalvm.org/latest/reference-manual/native-image/overview/Build-Overview/).
:::


## Setup: plain Java with Gradle

Use this path when your application does not depend on Spring Boot's AOT and Native Build Tools.

### 1. Apply the plugin and enable GraalVM support

<Tabs groupId="gradle_maven">
<TabItem value="gradle" label="Gradle" default>

```kotlin
plugins {
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    graalvm()
}
```

</TabItem>
<TabItem value="maven" label="Maven">

Add the runtime dependency. The Flamingock annotation processor must also be configured — see the [Quick start](../get-started/quick-start.md) for the full Maven setup.

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-graalvm</artifactId>
  <version>${flamingock.version}</version>
</dependency>
```

</TabItem>
</Tabs>


### 2. Configure the JAR

The native-image tool needs a runnable JAR that contains your application classes, your dependencies, and a `Main-Class` entry in the manifest. The simplest way in Gradle is to bundle everything into a single JAR:

```kotlin
tasks.withType<Jar> {
    manifest {
        attributes["Main-Class"] = "com.example.app.MyFlamingockApp"
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    from(sourceSets.main.get().output)
    from({
        configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) }
    })
}
```

Then build:

```bash
./gradlew clean build
```


### 3. Create the native image

```bash
native-image \
  --no-fallback \
  -H:+ReportExceptionStackTraces \
  -jar build/libs/your-app.jar
```

The `flamingock-graalvm` artifact contributes the feature registration automatically — you do not need to pass `--features` or supply a resource configuration.

:::info `--initialize-at-build-time`
Flamingock itself does not require any build-time initialization. If your logging library benefits from it (for example, `slf4j-simple`), add the relevant entries — but only for that purpose. Omit if unsure.
:::


### 4. Run the native image

```bash
./build/native-image/your-app
```
