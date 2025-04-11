---
sidebar_position: 3
title: How to contribute
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# How to contribute

Flamingock is an **open-source project**, and we encourage the community to contribute new templates to expand its capabilities. Whether you want to support additional databases, messaging systems, or cloud services, you can create a **Flamingock Template module** and share it with the community.  

### How to create a new Flamingock Template

To create and contribute a new **Flamingock Template**, follow these steps using the **SQL Template** as a reference:  

### 1. Create a New Module in the Flamingock Repository
- Navigate to the **Flamingock repository** and create a new folder under `templates/`.  
- Follow the naming convention: `templates/{your-template-name}` (e.g., `templates/kafka-template`).  

### 2. Define the Template’s Core Java Classes
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

### 3. Write Documentation and Provide Examples
- Create a **README.md** explaining how the template works.  
- Provide example **YAML Change Units** that developers can use.  

### 4. Submit a Pull Request to GitHub
- Fork the **Flamingock repository** and push your changes.  
- Open a **Pull Request (PR)** with:  
  - The new module code.  
  - The documentation (README + YAML examples).  
  - A brief explanation of how it works.  

### Future: A Flamingock Template Marketplace
Currently, new templates are shared via **GitHub PRs**, but in the future, Flamingock will introduce a **Template Marketplace** where developers can **publish, discover, and install** templates easily.


### Example GitHub Path
To see a working example, explore the **SQL Template module**:  
[GitHub - Flamingock SQL Template](https://github.com/mongock/flamingock-project/tree/master/templates/sql-template/src/main/java/io/flamingock/template/sql)

By contributing new templates, you help expand Flamingock’s capabilities and enable the broader developer community to adopt **Change-as-Code** best practices.
