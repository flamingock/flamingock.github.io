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

### Expected build output

During the build process, Flamingock will emit logs similar to the following — indicating successful annotation processing and metadata generation.

<Tabs groupId="gradle_maven">
<TabItem value="gradle" label="Gradle" default>

```bash
> Task :compileJava
Note:    [Flamingock] Starting Flamingock annotation processor initialization.
warning: [Flamingock] 'resources' parameter NOT passed. Using default 'src/main/resources'
warning: [Flamingock] 'sources' parameter NOT passed. Searching in: '[src/main/java, src/main/kotlin, src/main/scala, src/main/groovy]'
Note:    [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
Note:    [Flamingock] Initialization completed. Processed templated-based changes.
warning: Supported source version 'RELEASE_8' from annotation processor 'org.gradle.api.internal.tasks.compile.processing.TimeTrackingProcessor' less than -source '17'
Note:    [Flamingock] Searching for code-based changes (Java classes annotated with @Change or legacy @ChangeUnit annotations)
Note:    [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
Note:    [Flamingock] Finished processing annotated classes and generating metadata.
Note:    [Flamingock] Final processing round detected - skipping execution.
3 warnings
```

</TabItem>
<TabItem value="maven" label="Maven">

```bash
[INFO]   [Flamingock] Starting Flamingock annotation processor initialization.
[WARNING] [Flamingock] 'resources' parameter NOT passed. Using default 'src/main/resources'
[WARNING] [Flamingock] 'sources' parameter NOT passed. Searching in: '[src/main/java, src/main/kotlin, src/main/scala, src/main/groovy]'
[INFO]   [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
[INFO]   [Flamingock] Initialization completed. Processed templated-based changes.
[WARNING] Supported source version 'RELEASE_8' from annotation processor 'io.flamingock.core.processor.ChangesPreProcessor' less than -source '17'
[INFO]   [Flamingock] Searching for code-based changes (Java classes annotated with @Change or legacy @ChangeUnit annotations)
[INFO]   [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
[INFO]   [Flamingock] Finished processing annotated classes and generating metadata.
[INFO]   [Flamingock] Final processing round detected - skipping execution.
```

</TabItem>
</Tabs>

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


---

## Expected native image output

When creating the native image, you should see log output from Flamingock's GraalVM `RegistrationFeature`, confirming that Flamingock successfully scanned and registered internal classes, templates, system modules, and user-defined change units. 

The actual output may differ slightly depending on the modules you’ve included, but it should look similar to the following:

```
 - io.flamingock.graalvm.RegistrationFeature
[Flamingock] Starting GraalVM classes registration
[Flamingock] Starting registration of internal classes
    Registering class: io.flamingock.core.task.TaskDescriptor 
    Registering class: io.flamingock.core.task.AbstractTaskDescriptor 
    Registering class: io.flamingock.core.preview.PreviewPipeline 
    Registering class: io.flamingock.core.preview.PreviewStage 
    Registering class: io.flamingock.core.preview.CodePreviewChangeUnit 
    Registering class: io.flamingock.core.preview.CodePreviewLegacyChangeUnit 
    Registering class: io.flamingock.core.preview.PreviewMethod 
    Registering class: io.flamingock.core.api.template.ChangeTemplateConfig 
    Registering class: io.flamingock.core.preview.TemplatePreviewChangeUnit 
    Registering class: io.flamingock.core.pipeline.Pipeline 
    Registering class: io.flamingock.core.pipeline.LoadedStage 
    Registering class: io.flamingock.core.task.loaded.AbstractLoadedTask 
    Registering class: io.flamingock.core.task.loaded.AbstractReflectionLoadedTask 
    Registering class: io.flamingock.core.task.loaded.AbstractLoadedChangeUnit 
    Registering class: io.flamingock.core.task.loaded.CodeLoadedChangeUnit 
    Registering class: io.flamingock.core.task.loaded.TemplateLoadedChangeUnit 
    Registering class: java.nio.charset.CoderResult 
[Flamingock] Completed internal classes
[Flamingock] Starting registration of templates
    Registering class: io.flamingock.core.api.template.TemplateFactory 
    Registering class: io.flamingock.core.api.template.ChangeTemplate 
    Registering class: io.flamingock.core.api.template.AbstractChangeTemplate 
    Registering class: io.flamingock.template.mongodb.MongoChangeTemplate 
    Registering class: io.flamingock.template.mongodb.model.MongoOperation 
    Registering class: io.flamingock.template.mongodb.MongoChangeTemplateConfig 
[Flamingock] Completed templates
[Flamingock] Starting registration of system modules
    Registering class: io.flamingock.core.engine.audit.importer.changeunit.MongockImporterChangeUnit 
    Registering class: io.flamingock.core.engine.audit.importer.ImporterModule 
[Flamingock] Completed system modules
[Flamingock] Starting registration of user classes
    Registering class: io.flamingock.changes._1_create_clients_collection_change 
    Registering class: io.flamingock.changes._2_insertClientFederico_change 
    Registering class: io.flamingock.changes._3_insert_client_jorge 
[Flamingock] Completed user classes
[Flamingock] Completed GraalVM classes registration
```

