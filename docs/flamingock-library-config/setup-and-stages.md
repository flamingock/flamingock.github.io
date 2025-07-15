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

:::info Multiple stages (advanced)
For complex scenarios requiring independent change sets, you can define multiple stages
:::
---

## Stage Types

Flamingock supports two families of stages:

### Standard Stages (default)
The default stage type where users place their changes. This is where you'll put all your application changes (Kafka, MongoDB, SQL, S3, etc.). Standard stages execute changeUnits in order and provide predictable, sequential execution.

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")  // Standard stage (default type)
    }
)
```

### Special Stages
For specific scenarios, Flamingock provides special stage types that require explicitly specifying a `type` parameter. Examples include `SYSTEM` and `LEGACY` stage types, which are used in particular contexts such as the Mongock upgrade process.

```java
@EnableFlamingock(
        stages = {
                @Stage(type = SYSTEM, location = "com.yourapp.system"),
                @Stage(type = LEGACY, location = "com.yourapp.mongock"),
                @Stage(location = "com.yourcompany.changes")  // Standard stage (default type)
        }
)
```

To see these special stages in action, refer to the [Upgrade from Mongock guide](../resources/upgrade-from-mongock) which demonstrates their practical usage.

---

## Multiple Stages (Advanced)

Most applications will naturally fit into a single stage, which keeps things simple and ensures a clear, deterministic execution order. 
However, if you prefer to organize changes into multiple stages—for example, to separate concerns or enforce isolated execution 
flows—Flamingock fully supports that as well. We’ll explain how it works and what to consider when taking that approach.
### When to Use Multiple Stages

Multiple stages are beneficial in specific scenarios:

#### Multi-module Applications
In monolithic applications with well-defined module boundaries, you can give each module its own stage for full autonomy:

```java
@EnableFlamingock(
    stages = {
        @Stage(name = "user-module", location = "com.yourapp.users.changes"),
        @Stage(name = "billing-module", location = "com.yourapp.billing.changes"),
        @Stage(name = "notification-module", location = "com.yourapp.notifications.changes")
    }
)
```

This approach allows:
- Independent change management across modules
- Different release cycles for different modules
- Clear separation of concerns and responsibilities

#### Functional Separation
You might want to separate changes by function or lifecycle:

```java
@EnableFlamingock(
    stages = {
        @Stage(name = "core-setup", location = "com.yourapp.setup.changes"),
        @Stage(name = "business-logic", location = "com.yourapp.business.changes"),
        @Stage(name = "monitoring-setup", location = "com.yourapp.monitoring.changes")
    }
)
```

### Restrictions and Important Considerations

#### No Execution Order Guarantees
**Critical limitation**: Flamingock does not guarantee execution order between stages. This means:

- Stage A might execute before, after, or concurrently with Stage B
- You cannot rely on changes in one stage being applied before another stage starts
- Each stage should be completely independent from others

#### Why This Matters
Consider this problematic scenario:
```java
// ❌ PROBLEMATIC: Relies on execution order
@EnableFlamingock(
    stages = {
        @Stage(name = "create-tables", location = "com.yourapp.schema"),     // Creates tables
        @Stage(name = "seed-data", location = "com.yourapp.data")           // Inserts data - DEPENDS on tables existing!
    }
)
```

The `seed-data` stage might execute before `create-tables`, causing failures.

#### Correct Approach
Instead, group dependent changes in the same stage:
```java
// ✅ CORRECT: All related changes in one stage
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourapp.changes")  // Contains both table creation AND data seeding in order
    }
)
```


### When NOT to Use Multiple Stages

Avoid multiple stages when:
- **You need execution order across different change types** - Use a single stage instead
- **Changes are logically related** - Keep them together for easier maintenance
- **Simple applications** - The complexity isn't worth the overhead
- **Cross-cutting concerns** - Changes that affect multiple areas should be in one stage

:::info Future Enhancements
Conditional stage execution based on dependencies or conditions is planned for future releases, which would allow:
- Running stages based on success/failure of other stages
- Defining explicit dependencies between stages
- More sophisticated stage orchestration patterns
:::
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

## Best Practices

### Single Stage Execution (default and recommended)

In most applications, **changes that require a specific, deterministic execution order** should be grouped into a **single stage**. This ensures they are applied sequentially and in the exact order they are defined.

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")
    }
)
```

Grouping related changes into a single stage:
- Ensures **predictable, sequential execution**
- Avoids ambiguity from cross-stage execution timing
- Eliminates the need to manage inter-stage dependencies
- Keeps setup simple and easier to maintain
- Supports mixing all types of changes (Kafka, MongoDB, SQL, S3, etc.) in a well-defined order

:::info Advanced scenarios
If your application benefits from separating changes—for example, by module or lifecycle—you can define [Multiple Stages (Advanced)](#multiple-stages-advanced). Just remember: deterministic execution is guaranteed only within a stage, not across them.
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