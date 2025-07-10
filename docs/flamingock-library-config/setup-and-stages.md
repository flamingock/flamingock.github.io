---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Setup & Stages

The Flamingock **setup** organizes and executes your changes using **stages**. By default, you'll use a single stage that groups all your changes and executes them sequentially.

Changes within a stage are executed sequentially with order guaranteed. However, execution order between stages is not guaranteed - Flamingock handles system and legacy stages appropriately to ensure correctness.

---

## Setup configuration

Flamingock is configured using the `@EnableFlamingock` annotation on any class in your application. This annotation is required for all environments — whether you're using the standalone runner or Spring Boot integration.

The annotation is **only** used for defining the setup (stages and their sources). No runtime configuration should be placed here.

:::info
Alternatively, you can use a YAML file by specifying `pipelineFile` in the annotation.
:::

---

## Defining the setup

Here's the default single-stage configuration:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")
    }
)
public class FlamingockConfig {
    // Configuration class
}
```

:::info Multiple stages (advanced)
For complex scenarios requiring independent change sets, you can define multiple stages:
```java
@EnableFlamingock(
    stages = {
        @Stage(name = "setup", location = "com.yourcompany.setup"),
        @Stage(location = "com.yourcompany.changes")
    }
)
```
:::

Alternatively, using a YAML file:

```java
@EnableFlamingock(pipelineFile = "config/setup.yaml")
public class FlamingockConfig {}
```

Where `config/setup.yaml` contains:
```yaml
pipeline:
  stages:
    - name: main
      location: com.yourcompany.changes
```

---

## Stage Types

Flamingock supports three types of stages:

### Standard Stages (default)
The default stage type where users place their changes. This is where you'll put all your application changes (Kafka, MongoDB, SQL, S3, etc.). Standard stages execute in order within the stage, but there's no guaranteed order between multiple standard stages.

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")  // Standard stage (default)
    }
)
```

### System Stages  
Used for internal framework changes. System stages are handled by Flamingock for framework-level operations and are not typically used by application developers.

```java
@Stage(type = SYSTEM, location = "com.yourapp.flamingock.system")
```

### Legacy Stages
Used specifically for migrating from Mongock to Flamingock. For detailed information about legacy stages and migration, see the [Migration from Mongock guide](../resources/migration-mongock-to-flamingock).

```java  
@Stage(type = LEGACY, location = "com.yourapp.mongock")
```

---

## Required fields

Each stage must define:
- `name` (optional): A unique identifier - if not provided, it will be auto-derived from the location
- `location`: The package or directory where changes are located

---

## Stage fields

| Field            | Required            | Description                                                                 |
|------------------|---------------------|-----------------------------------------------------------------------------|
| `location`       | :white_check_mark:  | Package or directory scanned for both code-based and template-based changes |
| `name`           | :x:                 | Unique identifier for the stage (auto-derived from location if not provided) |
| `description`    | :x:                 | Optional text explaining the stage's purpose                                |

---

## Where Changes are located

- **`location`** refers to a source package (e.g., `com.company.changes`), a relative(e.g., `my/path/changes`) or absolute(e.g., `/my/path/changes`) resources directory.  
  - Template-based and code-based changes can co-exist if location is a source package.
  - If location references a resource directory, it only accepts template-based changeUnits.
  - Default source roots: `src/main/java`, `src/main/kotlin`, `src/main/scala`, `src/main/groovy`. 
  - Source root can be customized via the `sources` compiler option.
  - Resource root can be customized via the `resources` compiler option.
  
- Customizing Source and Resource Root Paths
<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
```kotlin
tasks.withType<JavaCompile> {
    options.compilerArgs.addAll(listOf(
        "-Asources=custom/src",
        "-Aresources=custom/resources"
    ))
}
```
    </TabItem>
    <TabItem value="maven" label="Maven">
```xml
<build>
  <plugins>
    <plugin>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <compilerArgs>
          <arg>-Asources=custom/src</arg>
          <arg>-Aresources=custom/resources</arg>
        </compilerArgs>
      </configuration>
    </plugin>
  </plugins>
</build>
```
    </TabItem>
</Tabs>


---

## Example Pipeline

```yaml
pipeline:
  stages:
    - name: user-setup
      description: User-related DB setup
      location: com.yourapp.flamingock.users
```

Folder view:

```
src/
  main/
    java/
      com/
        yourapp/
          flamingock/
            users/
              _0001_CREATE_USERS_TABLE.java
              _0002_ADD_INDEX.yaml
```

---

## 🛠 Troubleshooting

### My stage isn't picked up
- Make sure the stage has a `location` field defined
- Check the file path is correct and uses `/` as a separator, not `.` in YAML
- If using resource directory paths, make sure the file is placed under `src/main/resources/your-dir`

### No changes found in stage
- Verify that the class or YAML file is located in the expected package/directory
- For code-based changes, ensure the class is annotated with `@Change` or `@ChangeUnit`
- For template-based changes, check file names and YAML formatting

---

## Best Practices

### Single stage approach (recommended)
The default and recommended approach is to use a **single stage** with all your changes:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")
    }
)
```

This approach:
- Simplifies setup management and reduces complexity
- Ensures all changes execute in a predictable sequential order
- Eliminates the need to manage inter-stage dependencies
- Provides the clearest mental model for most applications
- Allows you to mix all types of changes (Kafka, MongoDB, SQL, S3, etc.) in deterministic order

### Multiple stages (advanced use cases)
Multiple stages are useful for specific scenarios:

**Multi-module applications**: Give each module its own independent stage for full autonomy:
```java
@EnableFlamingock(
    stages = {
        @Stage(type = SYSTEM, location = "com.yourapp.module1.changes"),
        @Stage(type = LEGACY, location = "com.yourapp.module1.changes"),
        @Stage(location = "com.yourapp.module2.changes")
    }
)
```

**Important considerations for multiple stages**:
- Execution order between stages is not guaranteed
- Don't rely on one stage executing before another
- Most applications should use a single stage to maintain deterministic execution order

:::info Future enhancement
Conditional stage execution (running stages based on conditions or dependencies) is planned for future releases.
:::

### Placing your changes
We strongly recommend placing all your changes — code-based and template-based — in a **single location** defined by the `@Stage` annotation.
  - Ensures changes are always scanned, regardless of type
  - Avoids needing two locations if one template-based change requires fallback to code
  - Keeps everything in one logical location

---

### Naming Convention for Changes
To ensure clarity and enforce ordering, we recommend naming changes using the following format:

```
_0001_CREATE_CLIENTS_TABLE.java
_0002_ADD_INDEX_TO_EMAIL.yaml
```

- `XXXX`: The execution order of the change
- `CHANGE_NAME`: Descriptive name of what the change does

This convention:
- Works across both code-based and template-based formats
- Makes the execution order obvious at a glance
- Ensures consistent naming and project hygiene

:::tip
While Java typically avoids underscores and leading digits, change units are not traditional classes. Prioritizing **readability and order** is more valuable in this context.
:::
