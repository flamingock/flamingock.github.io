---
title: Multi-module projects
sidebar_position: 15
---

# Multi-module projects

Flamingock supports projects where stages and changes are split across multiple modules. Each module declares its own stages and contributes its own changes; at startup, Flamingock composes a single pipeline from every module on the classpath.


## Per-module ownership

The most important rule:

:::note
A stage belongs to the module that declares it. A change is owned by the module whose source set defines it.
:::
Concretely:

- A change in module **A** can only ever be assigned to a stage declared **in module A**. If A has no stage whose `location` covers the change's package, the change is an orphan of module A — it is **not** rehomed to a stage in module B, even if B has a stage whose location would otherwise match.
- `@EnableFlamingock(strictStageMapping = true)` is validated against that module's own changes only. Orphans in one module do not fail another module's validation.
- Modules are processed independently at compile time; composition happens at runtime.

If you want a stage to own changes from a different module, declare the stage in that other module.


## What each module needs

Three requirements:

1. **Apply the `io.flamingock` Gradle plugin** in the module's `build.gradle.kts`.
2. **Declare at least one class annotated with `@EnableFlamingock(stages = {...})`** — this is how a module declares the stages it contributes.
3. **Call only the per-module DSL methods that this module actually uses** in the `flamingock { }` block — for example `mongodb()`, `sql()`, `springboot()`. See the [Gradle plugin page](../get-started/gradle-plugin.md#configuration-options) for the full list.

No manifest file, pipeline YAML, or aggregator code is required to glue modules together.

### Where to put `springboot()` and `graalvm()`

`springboot()` and `graalvm()` are configured on the **executable module** — the one that runs your application or produces the native image. Library modules do not need them in their `flamingock { }` block, even when their changes run under Spring Boot or get compiled into the native image.


## Canonical example

A project with two modules:

```text
app                ← runnable Spring Boot application; owns "sql-stage"
  └── depends on
mongodb-module     ← Java library; owns "mongodb-stage"
```

**`app/build.gradle.kts`** — the runnable module declares `springboot()` and `graalvm()`:

```kotlin
plugins {
    id("io.flamingock") version "[VERSION]"
    // ...other plugins (Spring Boot, etc.)
}

flamingock {
    springboot()
    sql()
    graalvm()
}

dependencies {
    implementation(project(":mongodb-module"))
    // ...
}
```

**`mongodb-module/build.gradle.kts`** — the library module declares only what it owns:

```kotlin
plugins {
    `java-library`
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    mongodb()
}
```

**`MultiModuleApplication.java`** (in `app`) — declares the SQL stage on the application class:

```java
@EnableFlamingock(
    stages = {
        @Stage(name = "sql-stage", location = "io.flamingock.examples.multimodule.app.changes")
    }
)
@SpringBootApplication
public class MultiModuleApplication {
    public static void main(String[] args) {
        SpringApplication.run(MultiModuleApplication.class, args);
    }
}
```

The `location` is the package the annotation processor will scan for changes belonging to this stage.

**`MongoModule.java`** (in `mongodb-module`) — declares the MongoDB stage on a plain class:

```java
@EnableFlamingock(
    stages = {
        @Stage(name = "mongodb-stage", location = "io.flamingock.examples.multimodule.mongodb.changes")
    }
)
public class MongoModule {
}
```

The class has no body and is not a Spring component. It exists so the annotation processor sees the `@EnableFlamingock` annotation while compiling `mongodb-module`, where the corresponding changes also live.

When the application starts, Flamingock composes one pipeline that includes both `sql-stage` and `mongodb-stage`.


## Constraints

- **Stage names must be unique across all modules** in the project.
- **At most one module may contribute a builder provider.** Multiple builder providers across modules are rejected at startup.
- **`@EnableFlamingock(strictStageMapping = true)` is validated per-module.** Orphans in one module do not fail another module's validation.


:::tip Spring Boot wiring across modules
When target-system or audit-store beans live in a library module, wire them into the executable module's Spring context — either via `@Import({...})` on the application class or by enabling component scanning over the library packages.
:::

:::caution One-time clean build after upgrading
After bumping Flamingock to **1.3.0** or later in a multi-module project, run a one-time clean build across **all** modules — for example, `./gradlew clean build` from the project root. See [Build integration](../get-started/gradle-plugin.md#build-integration) for the reason and the equivalent Maven command.
:::


## How it works under the hood

This section is optional reading — you don't need it to use multi-module support.

- Each module compiles independently. The Flamingock annotation processor reads that module's `@EnableFlamingock` declarations and its `@Change` classes from the module's own source set, and writes pipeline metadata into the module's compiled output.
- At application startup, Flamingock discovers every module's contribution on the classpath and composes them into a single pipeline.
- Discovery happens once per module, in isolation. That's why stages and changes are scoped to their declaring module: the processor never sees another module's sources, so a stage can only own changes from its own module's source set.
