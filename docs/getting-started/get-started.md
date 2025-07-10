---
sidebar_position: 20
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Get started

This guide will walk you through the basics of using Flamingock with a step-by-step example, so you can get up and running quickly—whether you're using the **Cloud Edition** or one of the **Community Edition** variants.

## 1. Add Flamingock client dependency

To begin, add the Flamingock client library to your project. You can use either:

- Cloud Edition (compatible with all systems)
- Community Edition (you need to choose the specific storage: MongoDB, DynamoDB, etc.)

Example for **Cloud Edition**:
<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-cloud:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependency>
            <groupId>io.flamingock</groupId>
            <artifactId>flamingock-cloud</artifactId>
            <version>${flamingockVersion}</version>
        </dependency>
        ```
    </TabItem>
</Tabs>

Example for **Community Edition** using MongoDB Sync4:
<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-ce-mongodb-sync4:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependency>
        <groupId>io.flamingock</groupId>
        <artifactId>flamingock-ce-mongodb-sync4</artifactId>
        <version>${flamingockVersion}</version>
        </dependency>
        ```
    </TabItem>
</Tabs>


All Community Editions:

- **flamingock-ce-mongodb-sync**
- **flamingock-ce-mongodb-springdata**
- **flamingock-ce-mongodb-springdata-v3-legacy**
- **flamingock-ce-dynamodb**
- **flamingock-ce-couchbase**

:::note
For configuration details specific to the Community Edition, see the [community edition section](../community-edition/Introduction.md)
:::
---

## 2. Add Flamingock annotation processor

Flamingock uses an annotation processor to scan and collect metadata from your changes—whether defined through code or templates.

This is required at **build time** and supports:

- **Code-based** with`@ChangeUnit` 
- **Template-based** (declarative YAML)

<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        annotationProcessor("io.flamingock:flamingock-processor:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <build>
          <plugins>
            <plugin>
              <groupId>org.apache.maven.plugins</groupId>
              <artifactId>maven-compiler-plugin</artifactId>
              <version>3.11.0</version>
              <configuration>
                <annotationProcessorPaths>
                  <path>
                    <groupId>io.flamingock</groupId>
                    <artifactId>flamingock-processor</artifactId>
                    <version>${flamingockVersion}</version>
                  </path>
                </annotationProcessorPaths>
              </configuration>
            </plugin>
          </plugins>
        </build>
        ```
    </TabItem>
</Tabs>

---

## 3. Define a ChangeUnit

A **ChangeUnit** is a unit of logic that Flamingock will execute during your application's startup.

Changes can be defined in a **code-based** or **template-based** style, depending on your preferred approach.
For a deeper understanding of how changes work and **when to choose one approach over the other**, check out the [Concepts → ChangeUnits](../overview/core-concepts.md#-changeunits) section.

 
<Tabs groupId="change">
    <TabItem value="code_based" label="Code Based" default>
```java
@Change(id = "create-table", order = "1", author = "antonio", transactional = false)
public class CreateTableChange {
    @Execution
    public void execute(Connection connection) throws SQLException {
        connection.createStatement().executeUpdate("CREATE TABLE clients (id INT, name VARCHAR(255))");
    }

    @RollbackExecution
    public void rollback(Connection connection) throws SQLException {
        connection.createStatement().executeUpdate("DROP TABLE clients");
    }
}
```
    </TabItem>
    <TabItem value="template_based" label="Template Based">
        ```yaml
            id: create-table
            author: antonio
            order: 1
            transactional: false #DDL are not transactional in Mysql, so it won't be rolled back
            template: sql-template
            templateConfiguration:
                executionSql: CREATE TABLE clients (id INT, name VARCHAR(255))
                rollbackSql: DROP TABLE IF EXISTS clients
        ```
    </TabItem>
</Tabs>

:::info
You can combine both styles in the same project. See our [Examples](../resources/examples.md)  to see these in action.
:::

---

## 4. Configure the Setup

Flamingock organizes and executes your changes using **stages**. By default, you'll use a single stage that groups all your changes and executes them sequentially.

Configure Flamingock using the `@EnableFlamingock` annotation on any class in your application:

Here’s a basic structure:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourcompany.changes")
    }
)
public class App {
}
```

### Stage configuration:
- `location`: Location where changes are found (mandatory)
  - **Package**: `"com.yourcompany.changes"` - scans for code and templates
  - **Resource directory**: `"flamingock/templates"` - scans for templates only(in the resources folder by default)
- `name`: (Optional) Stage name - auto-derived from location if not provided

:::tip Default approach:
Most applications use a single stage: `@Stage(location = "com.yourcompany.changes")`. The name is auto-derived ("changes") and this is the recommended default setup.
- It’s valid to have template files in both places.
:::

:::info Advanced options:
- **Multiple stages**: For complex scenarios requiring independent change sets
- **File-based configuration**: Use `pipelineFile` parameter for YAML configuration
- **Explicit naming**: Use `@Stage(name = "custom", location = "com.yourcompany.changes")`
:::

---

## 5. Configure Flamingock

Before running your application, make sure Flamingock is properly configured, depending on the [edition](../overview/Editions.md) and setup you are using:

- **Cloud Edition**: Set your API token, service name, and environment.
- **Community Edition**: Provide connection details for your storage system (e.g., connection for MongoDB, DynamoDB, CouchBase, etc.).

This configuration is applied through the Flamingock builder.

```java
public class App {
  public static void main(String[] args) {
    FlamingockStandalone
      .setApiToken("your-flamingock-api-token") 
      .setEnvironment("dev")
      .setService("inventory-service")
      .build()
      .run();
  }
}
```

:::info 
If you're using some frameworks, like Spring Boot, Flamingock may run automatically on application startup (if properly configured).
:::
---

## 6. Compile the project

Now that you’ve defined your changes and configured Flamingock, it’s time to compile your project.

If everything is correctly set up, Flamingock’s annotation processor will kick in and you’ll see diagnostic messages during compilation:

<details>
<summary>Click to see the expected logs</summary>
<Tabs groupId="gradle_maven">
<TabItem value="gradle" label="Gradle" default>

```bash
> Task :compileJava
Note:    [Flamingock] Starting Flamingock annotation processor initialization.
Note:    [Flamingock] 'resources' parameter NOT passed. Using default 'src/main/resources'
Note:    [Flamingock] 'sources' parameter NOT passed. Searching in: '[src/main/java, src/main/kotlin, src/main/scala, src/main/groovy]'
Note:    [Flamingock] Reading flamingock setup from annotation configuration
Note:    [Flamingock] Initialization completed. Processed templated-based changes.
Note:    [Flamingock] Searching for code-based changes (Java classes annotated with @Change or legacy @ChangeUnit annotations)
Note:    [Flamingock] Reading flamingock setup from annotation configuration
Note:    [Flamingock] Finished processing annotated classes and generating metadata.
Note:    [Flamingock] Final processing round detected - skipping execution.
```

</TabItem>
<TabItem value="maven" label="Maven">

```bash
[INFO]   [Flamingock] Starting Flamingock annotation processor initialization.
[INFO]   [Flamingock] 'resources' parameter NOT passed. Using default 'src/main/resources'
[INFO]   [Flamingock] 'sources' parameter NOT passed. Searching in: '[src/main/java, src/main/kotlin, src/main/scala, src/main/groovy]'
[INFO]   [Flamingock] Reading flamingock setup from annotation configuration
[INFO]   [Flamingock] Initialization completed. Processed templated-based changes.
[INFO]   [Flamingock] Searching for code-based changes (Java classes annotated with @Change or legacy @ChangeUnit annotations)
[INFO]   [Flamingock] Reading flamingock setup from annotation configuration
[INFO]   [Flamingock] Finished processing annotated classes and generating metadata.
[INFO]   [Flamingock] Final processing round detected - skipping execution.
```

</TabItem>
</Tabs>
</details>

:::note 
The exact output may vary depending on your compiler settings, project layout, and whether you've customized the sources or resources paths using compiler options.
:::

These logs confirm that:
- Flamingock found your pipeline
- Template and code-based changes were processed
- Metadata was generated for execution

:::tip
If you don’t see this output, ensure the annotation processor is correctly included in your dependencies and that your @Flamingock annotation is properly configured.
:::

---

## 7. Run your Application — Flamingock handles the changes!
Once your project is compiled and Flamingock is configured, you're ready to run the application.

When your application starts, Flamingock will be executed as part of the startup process:
- Load the setup configuration (actually the metadata generated from the annotation configuration during the compilation)
- Evaluate pending changes
- Execute the changes
- Audit the execution status

### Example Output

You should see logs like the following:
```bash
[main] INFO io.flamingock.core.runner.PipelineRunner - Starting Flamingock migration
Stage: mysql_stage
  1) id: create-table
     Started              ✅ - OK
     Executed             ✅ - OK
     Audited[execution]   ✅ - OK
[main] INFO io.flamingock.core.runner.PipelineRunner - Finished Flamingock process successfully

```
---
## Next Steps

- Dive into [Spring Boot Integration](../frameworks/springboot-integration/introduction.md)
- Learn more about [Configuration Options](../flamingock-library-config/introduction.md)
- Understand [Rollback & Auditing](../overview/core-concepts.md#-rollbacks)
