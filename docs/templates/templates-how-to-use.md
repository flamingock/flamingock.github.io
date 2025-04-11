---
sidebar_position: 2
title: How to use
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# How to use Flamingock Templates

Using a Flamingock Template is straightforward. Here’s how you can apply an SQL-based migration using the **SQL Template**.

### Step 1: Add the Template Dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `sql-template`:

<Tabs>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock.template</groupId>
    <artifactId>sql-template</artifactId>
    <version>1.0.0</version>
</dependency>
```
  </TabItem>
  <TabItem value="gradle" label="Gradle">
```gradle
implementation 'io.flamingock.template:sql-template:1.0.0'
```
  </TabItem>
</Tabs>

### Step 2: Define a Template-Based Change

In Flamingock, a **Change** (formerly known as *ChangeUnit*) represents a single unit of work that needs to be applied to your system — for example, creating a table, updating a configuration, or setting up a cloud resource.

When using Template-Based changes, instead of implementing a Code-Based file to define the logic of the change, you describe the change in a declarative format (e.g., **YAML** file). The structure you use will depend on the template you’re leveraging.

Create a **YAML file** (e.g., `_0001__create_persons_table.yaml`) inside your application’s resources directory:

```yaml
id: create-persons-table-from-template
order: 1
templateName: sql-template
templateConfiguration:
  executionSql: |
    CREATE TABLE Persons (
      PersonID int,
      LastName varchar(255),
      FirstName varchar(255),
      Address varchar(255),
      City varchar(255)
    )
```

:::info
Note that your application must provide a `java.sql.Connection` instance as a dependency to Flamingock. Please see the [Dependencies](https://docs.flamingock.io) section for more details.
:::

#### 🔍 Understanding the Fields

- **`id`**: Unique identifier for the change, used for tracking (same as in code-based changes).
- **`order`**: Execution order relative to other changes (also shared with code-based).
- **`templateName`**: Indicates which template should be used to handle the change logic. This is **required** for all template-based changes.
- **`templateConfiguration`**: Section where you define the input parameters for the selected template. These parameters vary depending on the template.
  - In this example, the template expects an `executionSql` field.
- **Other fields**: Some templates may define additional, custom configuration fields (e.g., `rollbackSql` for SQL template).

Template-based changes provide both **structure and flexibility**. They share the core concepts of change tracking with code-based ChangeUnits, but introduce a flexible configuration model where each template defines its own behavior through external parameters.

### Step 3: Config Flamingock to use the template file

:::warning
TODO: FLAMINGOCK CONFIGURATION (BUILDER / SPRINGBOOT) AND STAGE WITH YAML TEMPLATE PATH.
:::

### Step 4: Run Flamingock

At application startup, Flamingock will automatically detect the YAML file and process it as a standard change, following the same execution flow as code-based changes.

---

## Real-World Use Case: SQL Database Migration

Let’s compare how an SQL migration is handled using a **Template-Based ChangeUnit** vs. a **traditional Code-Based ChangeUnit**.

### Approach 1: Using a Traditional Code-Based ChangeUnit

```java
import io.flamingock.api.annotations.ChangeUnit;
import io.flamingock.api.annotations.Execution;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;

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
templateName: sql-template
templateConfiguration:
    executionSql: |
        CREATE TABLE Persons (
            PersonID int,
            LastName varchar(255),
            FirstName varchar(255),
            Address varchar(255),
            City varchar(255)
        )
```

### Key Benefits of Using a Template Instead of Code-Based ChangeUnits:
- **Less code maintenance**: No need to write Java classes, inject DataSource, manage connections, or handle SQL execution manually.
- **Faster onboarding**: YAML is easier for non-Java developers.
- **Standardised migrations**: Ensures best practices and avoids custom implementation errors.
- **Improved readability**: Easier to review and version control.
