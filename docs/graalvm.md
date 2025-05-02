---
title: GraalVM
sidebar_position: 6
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# GraalVM support

Flamingock provides **first-class support for GraalVM native images**, enabling your application to compile into fast, self-contained executables without sacrificing change tracking, rollback, or template support.

This page explains how to generate a GraalVM native image for a Flamingock-enabled application, using the **reflection metadata** produced by the **annotation processor** and Flamingock’s built-in GraalVM **registration feature**.

---

## How it works

When building your application, Flamingock's annotation processor:

- Scans for all annotated code-based changes (`@ChangeUnit`)
- Reads the pipeline file to locate stages and their related change units
- Discovers template-based changes from `sourcesPackage` and `resourcesDir`
- Generates metadata files containing all required classes for reflection

At native image generation time, Flamingock’s **GraalVM feature** picks up these files and registers the required types with GraalVM, so they’re available at runtime.

:::tip
Learn more about the basics of GraalVM native image compilation in the [GraalVM Native Image basics guide](https://www.graalvm.org/latest/reference-manual/native-image/basics/).
:::

---

## Step-by-step setup

### 1. Add Flamingock GraalVM dependency

<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("io.flamingock:flamingock-graalvm:$flamingockVersion")
```
    </TabItem>
    <TabItem value="maven" label="Maven">
```xml
<dependencies>

    <dependency>
        <groupId>io.flamingock</groupId>
        <artifactId>flamingock-graalvm</artifactId>
        <version>${flamingock.version}</version>
    </dependency>
</dependencies>
```
    </TabItem>
</Tabs>

---

### 2. Add plugin management (only for Gradle)

If using Gradle, ensure your `settings.gradle.kts` includes:

```kotlin
pluginManagement {
    repositories {
        mavenLocal()
        gradlePluginPortal()
        mavenCentral()
    }
}
```

---

## 3. Add GraalVM resource config

Create a file named `resource-config.json` in your project root:

```json
{
  "resources": {
    "includes": [
      { "pattern": "META-INF/flamingock/full-pipeline.json" },
      { "pattern": "META-INF/flamingock/templated-pipeline.json" }
    ]
  }
}
```

:::info
This file declares which resource files should be accessible to your native image. You can add other application-specific resources here as needed.

See the [GraalVM resource configuration documentation](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#resources) for more details.
:::

---

## 4. Build the application

```bash
./gradlew clean build
```

---

## 5. Create the native image

```bash
native-image \
  --no-fallback \
  --features=io.flamingock.graalvm.RegistrationFeature \
  -H:ResourceConfigurationFiles=resource-config.json \
  -H:+ReportExceptionStackTraces \
  --initialize-at-build-time=org.slf4j.simple.SimpleLogger,org.slf4j.LoggerFactory,org.slf4j.impl.StaticLoggerBinder \
  -jar build/libs/your-app.jar
```

### What these options do:

- `--features=io.flamingock.graalvm.RegistrationFeature`: Registers all Flamingock-related classes for reflection using metadata gathered during build time.
- `-H:ResourceConfigurationFiles=resource-config.json`: Informs GraalVM of required static resource files to include.
- `--initialize-at-build-time=...`: Ensures specific classes are initialized during image build rather than at runtime. Useful for frameworks and logging libraries.

:::tip
For more information on image creation and options, refer to the [GraalVM build overview documentation](https://www.graalvm.org/latest/reference-manual/native-image/overview/Build-Overview/).
:::

---

## 6. Run the native image

```bash
./your-app
```

---

## Example project

Try it out using our working example:

**→ [GraalVM example on GitHub](https://github.com/mongock/flamingock-examples/tree/master/graalvm)**
