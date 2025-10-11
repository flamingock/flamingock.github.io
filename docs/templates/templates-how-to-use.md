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

Using a Flamingock Template is straightforward. Here's an example of how you can apply an SQL-based change using the **SQL Template**.

:::danger
This example uses the **SQL Template**, which is experimental. It is intended for testing and feedback, not yet production use.
:::

### Step 1: Add the Template dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `SqlTemplate`:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-sql-template")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-sql-template</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

### Step 2: define a Template-based change

In Flamingock, a **Change** represents a single unit of work that needs to be applied to your system — for example, creating a table, updating a configuration, or setting up a cloud resource.

When using template-based changes, instead of implementing a code-based file to define the logic of the change, you describe the change in a declarative format (e.g., **YAML** file). The structure you use will depend on the template you’re leveraging.

Create a **YAML file** (e.g., `_0001__CreatePersonsTable.yaml`) inside your application’s resources directory:

```yaml
id: CreatePersonsTableFromTemplate
targetSystem: "database-system"
template: SqlTemplate
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

#### 🔍 Understanding the configuration attributes

- **`id`**: Unique identifier for the change, used for tracking (same as in code-based changes).
- **`order`**: Execution order relative to other changes (also shared with code-based).
- **`targetSystem`**: Specifies which target system this change applies to - **required** for all template-based changes, just like code-based Changes.
- **`template`**: Indicates which template should be used to handle the change logic. This is **required** for all template-based changes.
- **`apply`**: Direct apply logic for the change. The format depends on the template type (string for SQL, map for MongoDB, etc.).
- **`rollback`**: Direct rollback logic for the change. The format depends on the template type (string for SQL, map for MongoDB, etc.).
- **`recovery`**: Optional failure handling configuration. Contains:
  - `strategy`: Can be `MANUAL_INTERVENTION` (default if not specified) or `ALWAYS_RETRY`. Use `ALWAYS_RETRY` for idempotent operations that can be safely retried.
- **`configuration`**: Optional configuration parameters accessible within the `apply` and `rollback` sections. The structure and available parameters are defined by the specific template being used.
  ```yaml
  configuration:
    timeout: 30
    retryCount: 3
  ```
- **Other fields**: Templates may define additional configuration fields as needed.

Template-based changes provide both **structure and flexibility**. They share the core concepts of change tracking with code-based Changes, but use a standardized format with `apply` and `rollback` sections that each template interprets according to its specific requirements. Templates can also accept optional `configuration` parameters to customize their behavior.

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

## Use case: SQL database changes

Let's compare how an SQL change is handled using a **template-based Change** vs. a **traditional code-based Change**.

### Approach 1: Using a traditional code-based Change

```java
@Change(id = "create-persons-table", order = "20250408_01", author = "developer")
public class CreatePersonsTableChange {

    private final DataSource dataSource;

    public CreatePersonsTableChange(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Apply
    public void apply() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {

            statement.executeUpdate("""
                CREATE TABLE Persons (
                    PersonID int PRIMARY KEY,
                    LastName varchar(255),
                    FirstName varchar(255),
                    Address varchar(255),
                    City varchar(255)
                )
            """);
        }
    }
}

```

### Approach 2: Using a Flamingock SQL Template

With the **SQL Template**, users define the same change in **YAML** instead of Java:

```yaml
id: createPersonsTableFromTemplate
targetSystem: "database-system"
template: SqlTemplate
recovery:
  strategy: MANUAL_INTERVENTION  # Critical DDL operation - requires manual review on failure
apply: |
    CREATE TABLE Persons (
        PersonID int PRIMARY KEY,
        LastName varchar(255),
        FirstName varchar(255),
        Address varchar(255),
        City varchar(255)
    )
rollback: "DROP TABLE Persons;"
```

### Key benefits of using a Template instead of code-based Changes:
- **Less code maintenance**: No need to write Java classes, inject DataSource, manage connections, or handle SQL apply manually.
- **Faster onboarding**: YAML is easier for non-Java developers.
- **Standardised changes**: Ensures best practices and avoids custom implementation errors.
- **Improved readability**: Easier to review and version control.
- **Configurable flexibility**: Templates can be customized through configuration parameters without code changes.
