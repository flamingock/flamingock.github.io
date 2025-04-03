---
sidebar_position: 5
---

# Templates

## Introduction

Flamingock Templates are pre-built modules designed to streamline the integration of common third-party services, databases, and configurations into the **Flamingock change management system**. These templates provide a structured way to define configuration changes in **YAML files**, reducing the need for custom Java-based ChangeUnit classes while ensuring seamless execution and versioning of changes.

## Why Flamingock Templates?

While **Flamingock’s core approach** relies on Java-based ChangeUnits to manage database and system changes, Flamingock Templates provide a **low-code alternative** that simplifies the process for common integration scenarios. Instead of writing Java classes for each migration, users can leverage existing templates by defining changes in a **declarative YAML format**. This approach offers:

- **Faster adoption**: Developers can use ready-made templates without writing custom code.
- **Consistency**: Standardised integrations reduce errors and ensure best practices.
- **Flexibility**: Users can extend Flamingock with their own templates.
- **Reduced maintenance**: Instead of implementing logic for third-party integrations, developers can rely on tested and maintained templates.

## Key Features

- **Pre-built, reusable modules**: Each template provides a well-defined structure for managing migrations and configurations.
- **Declarative Change Units**: Users define changes in YAML, avoiding Java boilerplate.
- **Support for third-party integrations**: Includes databases, messaging systems, and cloud configurations.
- **Automatic execution and versioning**: Templates are applied and tracked as part of Flamingock’s change management process.
- **Built-in best practices**: Ensures correctness and reliability for each integration.
- **Extensible by the community**: Developers can contribute new templates to expand Flamingock’s ecosystem.

## When to Use Flamingock Templates vs. Java-Based ChangeUnits

| **Use Case** | **Flamingock Templates (YAML)** | **Java-Based ChangeUnits** |
|-------------|--------------------------------|-------------------------|
| Simple database migrations (e.g., SQL schema updates) | ✅ | ✅ |
| Integration with third-party services (e.g., Kafka, Twilio) | ✅ | ✅ |
| Custom logic and advanced migrations | ❌ | ✅ |
| Complex, dynamic change sequences | ❌ | ✅ |
| Low-code, configuration-driven changes | ✅ | ❌ |

## List of Current Flamingock Templates

| Template Name | Description |
|--------------|-------------|
| **SQL Template** | Enables SQL-based migrations using YAML-defined Change Units. |
| **Kafka Template** (Upcoming) | Manages Kafka topics and configurations using YAML definitions. |
| **Twilio Template** (Upcoming) | Simplifies Twilio messaging configurations via YAML. |
| **Redis Template** (Upcoming) | Allows structured updates to Redis configurations. |

## How to Use Flamingock Templates

Using a Flamingock Template is straightforward. Here’s how you can apply an SQL-based migration using the **SQL Template**.

### Step 1: Add the Template Dependency

Ensure your **Flamingock Template** dependency is included in your project. Example of using `sql-template`:

#### Maven
```xml
<dependency>
    <groupId>io.flamingock.template</groupId>
    <artifactId>sql-template</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Gradle
```gradle
implementation 'io.flamingock.template:sql-template:1.0.0'
```

### Step 2: Define a YAML Change Unit

Create a **YAML file** (e.g., `0001__create_persons_table.yaml`) inside your application’s resources directory:

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

Note that your application must provide a `java.sql.Connection` instance.

### Step 3: Config Flamingock to use the template file

`TODO: FLAMINGOCK CONFIGURATION (BUILDER / SPRINGBOOT) AND STAGE WITH YAML TEMPLATE PATH.`

### Step 4: Run Flamingock

At application startup, Flamingock will detect the YAML file and execute the SQL migration accordingly.

---

## Real-World Use Case: SQL Database Migration

Let’s compare how an SQL migration is handled using a **Flamingock Template** vs. a **traditional Java-based ChangeUnit**.

### Approach 1: Using a Traditional Java-Based ChangeUnit

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

### **Key Benefits of Using a Template Instead of Java-Based ChangeUnits:**
- **Less code maintenance**: No need to write Java classes, inject DataSource, manage connections, or handle SQL execution manually.
- **Faster onboarding**: YAML is easier for non-Java developers.
- **Standardised migrations**: Ensures best practices and avoids custom implementation errors.
- **Improved readability**: Easier to review and version control.


## **How to Collaborate and Add New Flamingock Templates**  

Flamingock is an **open-source project**, and we encourage the community to contribute new templates to expand its capabilities. Whether you want to support additional databases, messaging systems, or cloud services, you can create a **Flamingock Template module** and share it with the community.  

### **How to Create a New Flamingock Template**  

To create and contribute a new **Flamingock Template**, follow these steps using the **SQL Template** as a reference:  

### **1. Create a New Module in the Flamingock Repository**  
- Navigate to the **Flamingock repository** and create a new folder under `templates/`.  
- Follow the naming convention: `templates/{your-template-name}` (e.g., `templates/kafka-template`).  

### **2. Define the Template’s Core Java Classes**  
Each template must define the logic for handling ChangeUnits. Using the **SQL Template** as a reference, your module should include:  

- **A Template Definition Class**
  - Defines how the template should execute change units.  

  - Example (`SqlTemplate.java` in SQL Template):  
    ```java
    package io.flamingock.template.sql;

    import io.flamingock.template.annotations.TemplateConfigSetter;
    import io.flamingock.template.annotations.TemplateConfigValidator;
    import io.flamingock.template.annotations.TemplateExecution;
    import io.flamingock.template.annotations.TemplateRollbackExecution;

    import java.sql.Connection;
    import java.sql.SQLException;

    public class SqlTemplate {

        private SqlTemplateConfiguration configuration;

        @TemplateConfigSetter
        public void setConfiguration(SqlTemplateConfiguration configuration) {
            this.configuration = configuration;
        }

        @TemplateConfigValidator
        public boolean validateConfiguration() {
            return configuration.getExecutionSql() != null;
        }

        @TemplateExecution
        public void execution(Connection connection) {
            execute(connection, configuration.getExecutionSql());
        }

        @TemplateRollbackExecution(conditionalOnAllConfigurationPropertiesNotNull = {"rollbackSql"})
        public void rollback(Connection connection) {
            execute(connection, configuration.getRollbackSql());
        }

        private static void execute(Connection connection, String sql) {
            try {
                connection.createStatement().executeUpdate(sql);
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        }
    }
    ```


- **A Configuration Class**  
  - Defines the structure of the YAML configuration.  

  - Example (`SqlTemplateConfiguration.java` in SQL Template):  
    ```java
    package io.flamingock.template.sql;

    import io.flamingock.core.api.annotations.NonLockGuarded;
    import io.flamingock.core.api.annotations.NonLockGuardedType;

    @NonLockGuarded(NonLockGuardedType.NONE)
    public class SqlTemplateConfiguration {

        private String executionSql;
        private String rollbackSql;

        public String getExecutionSql() {
            return executionSql;
        }

        public void setExecutionSql(String executionSql) {
            this.executionSql = executionSql;
        }

        public String getRollbackSql() {
            return rollbackSql;
        }

        public void setRollbackSql(String rollbackSql) {
            this.rollbackSql = rollbackSql;
        }
    }
    ```  

- **A Template Module Class**  
  - Implements `TemplateModule` interface, providing to Flamingock the template definition information (name, definition class, etc).

  - Example (`SqlTemplateModule.java` in SQL Template):  
    ```java
    package io.flamingock.template.sql;

    import io.flamingock.template.TemplateModule;
    import io.flamingock.template.TemplateSpec;
    import io.flamingock.template.TransactionalTemplateSpec;

    import java.util.Collections;
    import java.util.HashSet;
    import java.util.Set;

    public class SqlTemplateModule implements TemplateModule {

        private static final Set<TransactionalTemplateSpec> templates;

        static {
            HashSet<TransactionalTemplateSpec> templatesSet = new HashSet<>();
            templatesSet.add(new TransactionalTemplateSpec("sql-template", SqlTemplate.class));
            templates = Collections.unmodifiableSet(templatesSet);
        }

        @Override
        public Set<TransactionalTemplateSpec> getTemplates() {
            return templates;
        }

    }
    ```  

### **3. Write Documentation and Provide Examples**  
- Create a **README.md** explaining how the template works.  
- Provide example **YAML Change Units** that developers can use.  

### **4. Submit a Pull Request to GitHub**  
- Fork the **Flamingock repository** and push your changes.  
- Open a **Pull Request (PR)** with:  
  - The new module code.  
  - The documentation (README + YAML examples).  
  - A brief explanation of how it works.  

### **Future: A Flamingock Template Marketplace**  
Currently, new templates are shared via **GitHub PRs**, but in the future, Flamingock will introduce a **Template Marketplace** where developers can **publish, discover, and install** templates easily.


### Example GitHub Path
To see a working example, explore the **SQL Template module**:  
[GitHub - Flamingock SQL Template](https://github.com/mongock/flamingock-project/tree/master/templates/sql-template/src/main/java/io/flamingock/template/sql)

By contributing new templates, you help expand Flamingock’s capabilities and enable the broader developer community to adopt **Change-as-Code** best practices.

---

Flamingock Templates unlock new possibilities for seamless application evolution. Whether you’re managing **databases, configurations, or third-party services**, templates simplify the process, ensuring **faster, safer, and more standardised migrations**. Join the **Flamingock community** and start building your own templates today! 🚀
