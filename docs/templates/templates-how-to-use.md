---
sidebar_position: 2
title: How to use Templates
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# How to use Flamingock Templates

:::caution Beta feature
Templates are available in **beta**.
- You can already create **custom templates** for your own use cases.
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.
- Expect API and behavior changes before GA.

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of Changes.
:::

Using a Flamingock Template is straightforward. Here's an example of how you can apply MongoDB changes using the **MongoDB Template**.

:::danger
This example uses the **MongoDB Template**, which is experimental. It is intended for testing and feedback, not yet production use.
:::

:::tip
For a complete reference of all MongoDB operations, parameters, and advanced options, see the [MongoDB Template Reference](./mongodb-template.md).
:::

### Step 1: Add the Template dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `MongoChangeTemplate`:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-mongodb-sync-template")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-mongodb-sync-template</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

### Step 2: Define a Template-based change

In Flamingock, a **Change** represents a single unit of work that needs to be applied to your system — for example, creating a collection, inserting documents, or creating an index.

When using template-based changes, instead of implementing a code-based file to define the logic of the change, you describe the change in a declarative format (e.g., **YAML** file). The structure you use will depend on the template you're leveraging.

Create a **YAML file** (e.g., `_0001__create_users_collection.yaml`) inside your application's resources directory:

```yaml
id: create-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
apply:
  - type: createCollection
    collection: users
  - type: createIndex
    collection: users
    parameters:
      keys:
        email: 1
      options:
        unique: true
```

#### 🔍 Understanding the configuration attributes

- **`id`**: Unique identifier for the change, used for tracking (same as in code-based changes).
- **`order`**: Execution order relative to other changes (also shared with code-based). When using YAML files, order is typically determined by filename prefix (e.g., `_0001__`, `_0002__`).
- **`transactional`**: Whether to run the change in a MongoDB transaction. Set to `false` for DDL operations like `createCollection`.
- **`targetSystem`**: Specifies which target system this change applies to - **required** for all template-based changes.
- **`template`**: Indicates which template should be used to handle the change logic. Use `MongoChangeTemplate` for MongoDB operations.
- **`apply`**: List of MongoDB operations to execute. Each operation has:
  - `type`: The operation type (e.g., `createCollection`, `insert`, `createIndex`)
  - `collection`: The target collection name
  - `parameters`: Operation-specific parameters (optional for some operations)
- **`rollback`**: Optional list of operations to execute when rolling back the change.
- **`recovery`**: Optional failure handling configuration. Contains:
  - `strategy`: Can be `MANUAL_INTERVENTION` (default) or `ALWAYS_RETRY`. Use `ALWAYS_RETRY` for idempotent operations.

### Step 3: Configure Flamingock to use the template file

To configure Flamingock to use the YAML template file, you need to define a stage that includes the path to the template file using the `@EnableFlamingock` annotation:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "resources/templates")
    }
)
public class MainApplication {
    // Configuration class
}
```

If you prefer to use a pipeline YAML file for configuration, refer to the [Setup & Stages guide](../flamingock-library-config/setup-and-stages.md) for more details.

### Step 4: Run Flamingock

At application startup, Flamingock will automatically detect the YAML file and process it as a standard change, following the same apply flow as code-based changes.

## Use case: MongoDB database changes

Let's compare how a MongoDB change is handled using a **template-based Change** vs. a **traditional code-based Change**.

### Approach 1: Using a traditional code-based Change

```java
@Change(id = "create-users-collection", order = "20250408_01", author = "developer")
public class CreateUsersCollectionChange {

    @Apply
    public void apply(MongoDatabase db) {
        // Create collection
        db.createCollection("users");

        // Create unique index on email
        db.getCollection("users").createIndex(
            new Document("email", 1),
            new IndexOptions().unique(true)
        );
    }
}
```

### Approach 2: Using a Flamingock MongoDB Template

With the **MongoDB Template**, users define the same change in **YAML** instead of Java:

```yaml
id: create-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
apply:
  - type: createCollection
    collection: users
  - type: createIndex
    collection: users
    parameters:
      keys:
        email: 1
      options:
        unique: true
```

### Key benefits of using a Template instead of code-based Changes:
- **Less code maintenance**: No need to write Java classes, inject MongoDatabase, or handle operations manually.
- **Faster onboarding**: YAML is easier for non-Java developers.
- **Standardized changes**: Ensures best practices and avoids custom implementation errors.
- **Improved readability**: Easier to review and version control.
- **Multiple operations**: Group related operations in a single change file.

## Next steps

Now that you understand the basics of using templates, explore these resources:

- **[MongoDB Template Reference](./mongodb-template.md)** - Complete documentation of all MongoDB operations, parameters, and advanced options including collation, array filters, and validation bypass
- **[Create your own Template](./create-your-own-template.md)** - Learn how to build custom templates for your specific use cases
