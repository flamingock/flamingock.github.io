---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Pipeline & stages

The **pipeline** defines how Flamingock organizes and executes your changes across one or more **stages**. Each stage groups related changes and determines the order of execution.

Flamingock processes stages sequentially, in the order they appear in the pipeline file.

:::note
Parallel stage execution is coming soon.
:::
---

## The pipeline file

The pipeline is defined in a dedicated file located at:

```
src/main/resources/flamingock/pipeline.yaml
```

This file is required for all environments — whether you're using the standalone runner or Spring Boot integration.  
It is **only** used for defining the pipeline (stages and their sources). No other configuration should be placed here.

:::info
The location of the resources directory can be customized using the `resources` compiler option.
:::

---

## Defining the pipeline

Here's an example of the pipeline file:

```yaml
pipeline:
  stages:
    - name: mysql-stage
      description: Mysql stage
      sourcesPackage: com.yourcompany.flamingock.mysql
```

---

## Required fields

Each stage must define:
- `name`: A unique identifier
- At least one of `sourcesPackage` or `resourcesDir`

---

## Stage fields

| Field            | Required            | Description                                                                 |
|------------------|---------------------|-----------------------------------------------------------------------------|
| `name`           | :white_check_mark:  | Unique identifier for the stage                                             |
| `description`    | :x:                 | Optional text explaining the stage's purpose                                |
| `sourcesPackage` | :white_check_mark:* | Scanned for both code-based and template-based changes                      |
| `resourcesDir`   | :white_check_mark:* | Used for template-based changes in the resources directory                  |

:::info
You must provide at least one of `sourcesPackage`, `resourcesDir`, or both.
:::

---

## Where Changes Are Located

- **`sourcesPackage`** refers to a source package (e.g., `com.company.init`).  
  - Template-based and code-based changes can co-exist here.
  - Default source roots: `src/main/java`, `src/main/kotlin`, `src/main/scala`, `src/main/groovy`
  - Can be customized via the `sources` compiler option.

- **`resourcesDir`** refers to a path inside `src/main/resources`.  
  - Only used for template-based changes.
  - Can be customized via the `resources` compiler option.
  
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
      sourcesPackage: com.yourapp.flamingock.users
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
              _001_CREATE_USERS_TABLE.java
              _002_ADD_INDEX.yaml
```

---

## 🛠 Troubleshooting

### My stage isn't picked up
- Make sure the stage has a `name` and **at least one** of `sourcesPackage` or `resourcesDir`
- Check the file path is correct and uses `/` as a separator, not `.` in YAML
- If using `resourcesDir`, make sure the file is placed under `src/main/resources/your-dir`

### No changes found in stage
- Verify that the class or YAML file is located in the expected package/directory
- For code-based changes, ensure the class is annotated with `@Change` or `@ChangeUnit`
- For template-based changes, check file names and YAML formatting

---

## ✅ Best Practices

### Placing your changes
We strongly recommend placing all your changes — code-based and template-based — in a **single `sourcesPackage`**.
  - Ensures changes are always scanned, regardless of type
  - Avoids needing two locations if one template-based change requires fallback to code
  - Keeps everything in one logical location

---

### Naming Convention for Changes
To ensure clarity and enforce ordering, we recommend naming changes using the following format:

```
_001_CREATE_CLIENTS_TABLE.java
_002_ADD_INDEX_TO_EMAIL.yaml
```

- `XXX`: The execution order of the change
- `CHANGE_NAME`: Descriptive name of what the change does

This convention:
- Works across both code-based and template-based formats
- Makes the execution order obvious at a glance
- Ensures consistent naming and project hygiene

:::tip
While Java typically avoids underscores and leading digits, change units are not traditional classes. Prioritizing **readability and order** is more valuable in this context.
:::
📚 *See our [Best Practices](/docs/best-practices) guide for broader recommendations on naming, structure, and change design.*

---
