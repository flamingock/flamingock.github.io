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
- Our **official templates** (SQL, MongoDB, etc.) are **experimental** and not yet recommended for production.  
- Expect API and behavior changes before GA.  

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of ChangeUnits.
:::

Using a Flamingock Template is straightforward. Here's an example of how you can apply an SQL-based migration using the **SQL Template**.

:::note
This example uses the **SQL Template**, which is experimental. It is intended for testing and feedback, not yet production use.
:::

### Step 1: Add the Template dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `sql-template`:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community-sql-template")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-community-sql-template</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

### Step 2: define a Template-based change

In Flamingock, a **ChangeUnit** represents a single unit of work that needs to be applied to your system — for example, creating a table, updating a configuration, or setting up a cloud resource.

When using template-based changes, instead of implementing a code-based file to define the logic of the change, you describe the change in a declarative format (e.g., **YAML** file). The structure you use will depend on the template you’re leveraging.

Create a **YAML file** (e.g., `_0001_create_persons_table.yaml`) inside your application’s resources directory:

```yaml
id: create-persons-table-from-template
order: 1
targetSystem: "database-system"
templateName: sql-template
execution: |
  CREATE TABLE Persons (
    PersonID int,
    LastName varchar(255),
    FirstName varchar(255),
    Address varchar(255),
    City varchar(255)
  )
rollback: "DROP TABLE Persons;"
```

:::info
Note that your application must provide a `java.sql.Connection` instance as a dependency to Flamingock.
:::

#### 🔍 Understanding the configuration attributes

- **`id`**: Unique identifier for the change, used for tracking (same as in code-based changes).
- **`order`**: Execution order relative to other changes (also shared with code-based).
- **`targetSystem`**: Specifies which target system this change applies to - **required** for all template-based changes, just like code-based ChangeUnits.
- **`templateName`**: Indicates which template should be used to handle the change logic. This is **required** for all template-based changes.
- **`execution`**: Direct execution logic for the change. The format depends on the template type (string for SQL, map for MongoDB, etc.).
- **`rollback`**: Direct rollback logic for the change. The format depends on the template type (string for SQL, map for MongoDB, etc.).
- **Other fields**: Templates may define additional configuration fields as needed.

Template-based changes provide both **structure and flexibility**. They share the core concepts of change tracking with code-based ChangeUnits, but use a standardized format with `execution` and `rollback` sections that each template interprets according to its specific requirements.

### Step 3: Configure Flamingock to use the template file

To configure Flamingock to use the YAML template file, you need to define a stage that includes the path to the template file using the `@EnableFlamingock` annotation:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "src/main/resources/templates")
    }
)
public class MainApplication {
    // Configuration class
}
```

If you prefer to use a pipeline YAML file for configuration, refer to the [Setup & Stages guide](../flamingock-library-config/setup-and-stages.md) for more details.

### Step 4: Run Flamingock

At application startup, Flamingock will automatically detect the YAML file and process it as a standard change, following the same execution flow as code-based changes.

---

## Use case: SQL database migration

Let’s compare how an SQL migration is handled using a **template-based ChangeUnit** vs. a **traditional code-based ChangeUnit**.

### Approach 1: Using a Traditional Code-Based ChangeUnit

```java
@ChangeUnit(id = "create-persons-table", order = 1, author = "developer")
public class CreatePersonsTableChangeUnit {

    private final DataSource dataSource;

    public CreatePersonsTableChangeUnit(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Execution
    public void execute() throws SQLException {
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

With the **SQL Template**, users define the same migration in **YAML** instead of Java:

```yaml
id: create-persons-table-from-template
order: 1
targetSystem: "database-system"
templateName: sql-template
execution: |
    CREATE TABLE Persons (
        PersonID int,
        LastName varchar(255),
        FirstName varchar(255),
        Address varchar(255),
        City varchar(255)
    )
rollback: "DROP TABLE Persons;"
```

### Key Benefits of Using a Template Instead of Code-Based ChangeUnits:
- **Less code maintenance**: No need to write Java classes, inject DataSource, manage connections, or handle SQL execution manually.
- **Faster onboarding**: YAML is easier for non-Java developers.
- **Standardised migrations**: Ensures best practices and avoids custom implementation errors.
- **Improved readability**: Easier to review and version control.
