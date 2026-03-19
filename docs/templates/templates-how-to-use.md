---
sidebar_position: 2
title: How to use Templates
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import VersionBadge from '@site/src/components/VersionBadge';

# How to use Flamingock Templates <VersionBadge version="1.2.0" />

:::caution Beta feature
Templates are available in **beta**.
- You can already create **custom templates** for your own use cases.
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.
- Expect API and behavior changes before GA.

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of Changes.
:::

Using a Flamingock Template is straightforward. Here's an example of how you can apply an SQL-based change using the **SQL Template**.

:::danger
This example uses the **SQL Template**, which is experimental. It is intended for testing and feedback, not yet production use.
:::

## Step 1: Add the Template dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `sql-template`:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
import io.flamingock.gradle.FlamingockTemplate.SQL

flamingock {
    //...
    templates(SQL)
}
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-java-template-sql</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

## Step 2: Create the change file

Template-based changes are defined in **YAML files** placed inside your application's resources directory. Each file represents a single change.

The **filename** determines the execution order. Use a numeric prefix followed by a double underscore and a descriptive name:

```
_0001__create_persons_table.yaml
_0002__seed_initial_data.yaml
_0003__add_orders_collection.yaml
```

Flamingock sorts files by this prefix, so `_0001__` always runs before `_0002__`, regardless of the descriptive part of the name.

## Step 3: Define the change content

In Flamingock, a **Change** represents a single unit of work that needs to be applied to your system — for example, creating a table, updating a configuration, or setting up a cloud resource.

When using template-based changes, instead of writing a Java class, you describe the change declaratively in the YAML file. Every template-based change shares the same set of common fields. The only difference is how you define the **body** of the change — which depends on the template type (simple or multi-step).

### Common fields

These fields are shared by all template-based changes, regardless of the template type:

- **`id`** *(required)*: Unique identifier for the change, used for tracking (same as in code-based changes).
- **`template`** *(required)*: The name of the template to use. This must match the template's registered name (defined via `@ChangeTemplate(name = ...)` on the template class). For example, `template: sql-template` uses the template registered with the name `"sql-template"`.
- **`targetSystem`** *(required)*: Specifies which target system this change applies to. Contains an `id` field that must match a registered target system.
- **`recovery`** *(optional)*: Failure handling configuration. Contains:
  - `strategy`: Can be `MANUAL_INTERVENTION` (default if not specified) or `ALWAYS_RETRY`. Use `ALWAYS_RETRY` for idempotent operations that can be safely retried.
- **`configuration`** *(optional)*: Shared configuration parameters accessible to both apply and rollback logic. The structure and available parameters are defined by the specific template being used.
  ```yaml
  configuration:
    timeout: 30
    retryCount: 3
  ```
- **`transactional`** *(optional)*: Whether the change should run inside a transaction. When omitted, Flamingock infers the value from the template's apply payload metadata: if any apply payload declares it doesn't support transactions, the change is treated as non-transactional; otherwise it defaults to `true`. An explicit value always takes precedence over inference.
:::tip
Well-designed templates declare transaction support in their payloads, so you can safely omit `transactional` and let Flamingock infer the right value.
:::

- **`author`** *(optional)*: The author of the change, for audit and tracking purposes.
- **`profiles`** *(optional)*: A list of profiles for conditional execution. The change only runs when one of the specified profiles is active.

### Change body: simple vs multi-step

The remaining structure of the YAML file — the **body** — depends on the template type. Whether a template is simple or multi-step is defined by the template developer, and each template's own documentation will describe the exact payload format. What all templates share is the **frame**: simple templates use root-level `apply`/`rollback`, and multi-step templates use `steps`, each with its own `apply`/`rollback`.

#### Simple templates

Simple templates use root-level `apply` and `rollback` fields. They are used when the template is inherently single-operation, or when the payload format is free-form and can naturally contain multiple operations (e.g., SQL).

```yaml
id: CreatePersonsTableFromTemplate
targetSystem: "database-system"
template: sql-template
recovery:
  strategy: ALWAYS_RETRY  # Safe to retry - CREATE TABLE IF NOT EXISTS semantics
apply: |
  CREATE TABLE IF NOT EXISTS Persons (
    PersonID int,
    LastName varchar(255),
    FirstName varchar(255),
    Address varchar(255),
    City varchar(255)
  )
rollback: "DROP TABLE IF EXISTS Persons;"
```

- **`apply`** *(required)*: The apply payload for the change. The format depends on the template (string for SQL, map for others, etc.).
- **`rollback`** *(required by default)*: The rollback payload for the change. By default, templates require rollback data, but a template developer can make it optional via `@ChangeTemplate(rollbackPayloadRequired = false)`.

#### Multi-step templates

Multi-step templates use a `steps` array instead of root-level `apply`/`rollback`. They are used when the target technology requires structured payloads per operation (e.g., MongoDB, Kafka), where each step has its own distinct set of parameters.

```yaml
id: setup-orders-collection
template: MongoChangeTemplate
targetSystem:
  id: "mongodb-system"
steps:
  - apply:
      type: createCollection
      collection: orders
    rollback:
      type: dropCollection
      collection: orders
  - apply:
      type: createIndex
      collection: orders
      keys: { orderId: 1 }
    rollback:
      type: dropIndex
      collection: orders
      index: orderId_1
```

- **`steps`** *(required)*: An array of steps, each containing:
  - **`apply`** *(required)*: The apply payload for this step.
  - **`rollback`** *(optional per template setting)*: The rollback payload for this step. Whether it's required depends on the template's `rollbackPayloadRequired` setting.

:::info
If a multi-step change fails at step N, Flamingock rolls back the previously successful steps in **reverse order** (N, N-1, ..., 0). Steps without rollback data are skipped during rollback.
:::

## Step 4: Configure Flamingock

Point a stage to the location where your change files live using the `@EnableFlamingock` annotation:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "io.flamingock.example.changes")
    }
)
public class MainApplication {
    // Configuration class
}
```

Although YAML files are not compiled code, Flamingock supports placing them in **source packages** alongside code-based changes — and this is actually the recommended approach. A stage can contain both code-based and template-based changes, and execution order is determined by the filename prefix (`_0001__`, `_0002__`, etc.) across all changes in the stage. Keeping them in the same package makes the full sequence visible at a glance, rather than having to mentally merge two separate locations.

Using a **resource folder** works too — just point the stage location to the resource path instead:

```java
@Stage(location = "templates/sql")
```

If you prefer to use a pipeline YAML file for configuration, refer to the [Setup & Stages guide](../flamingock-library-config/setup-and-stages.md) for more details.

## Step 5: Run Flamingock

At application startup, Flamingock will automatically detect the YAML file and process it as a standard change, following the same apply flow as code-based changes.
