---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Get Started

This guide will walk you through the basics of using Flamingock with a step-by-step example, so you can get up and running quickly—whether you're using the **Cloud Edition** or one of the **Community Edition** variants.

## 1. Add Flamingock Client Dependency

To begin, add the Flamingock client library to your project. You can use either:

- Cloud Edition (compatible with all systems)
- Community Edition (you need to choose the specific driver)

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


All Community Edition drivers:

- **flamingock-ce-mongodb-v3**
- **flamingock-ce-mongodb-sync4**
- **flamingock-ce-mongodb-springdata-v2**
- **flamingock-ce-mongodb-springdata-v3**
- **flamingock-ce-mongodb-springdata-v4**
- **flamingock-ce-dynamodb**
- **flamingock-ce-couchbase**

---

## 2. Add Flamingock Annotation Processor

Flamingock uses an annotation processor to scan and collect metadata from your changes—whether defined through code or templates.

This is required at **build time** and supports:

- `@Change` (Flamingock-native, recommended)
- `@ChangeUnit` (legacy support for Mongock users)
- Template-based (declarative YAML)

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

## 3. Define a Change

A **Change** is a unit of logic that Flamingock will execute during your application's startup.

Changes can be defined in a **code-based** or **template-based** style, depending on your preferred approach.
For a deeper understanding of how changes work and **when to choose one approach over the other**, check out the [Concepts → Changes](/docs/concepts#changes) section.

 
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

> 🔁 You can combine both styles in the same project. See our [Best Practices](/docs/best-practices)  for guidance on when and how to do it effectively.

---

## 4. Define the Pipeline

The **pipeline** defines how Flamingock organizes and executes your changes across one or more **stages**.

Each stage groups a set of changes and executes them sequentially (parallel execution is coming soon).
Stages are processed in the order they appear in the pipeline.

By default, Flamingock expects the pipeline file to be located at `resources/flamingock/pipeline.yaml`

Here’s a basic structure:

```yaml
pipeline:
  stages:
    - name: mysql_stage
      description: Initial stage for MySQL setup
      sourcesPackage: com.yourcompany.flamingock.mysql
      resourcesDir: flamingock/stages/mysql
```

###  Changes resolution:
- `sourcesPackage`: Path to Java packages that may contain both code-based and template-based changes.
- `resourcesDir`: Directory inside `resources/` that holds only template-based changes.
- You can use either or both, depending on how you organize your changes.

Recommended patterns:
- Use `sourcesPackage` alone for co-located code and templates.
- Use both `sourcesPackage` and `resourcesDir` if you want to separate templates.
- It’s valid to have template files in both places.

---

## 5. Configure Flamingock

Before running your application, make sure Flamingock is properly configured, depending on the edition and setup you are using:
(More information about Flamingock editions [here](/overview/editions))

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

> ⚙️ If you're using some frameworks, like Spring Boot, Flamingock may run automatically on application startup (if properly configured).
---

## 6. Compile the Project

Now that you’ve defined your changes and configured Flamingock, it’s time to compile your project.

If everything is correctly set up, Flamingock’s annotation processor will kick in and you’ll see diagnostic messages during compilation:

```bash
Note:    [Flamingock] Starting Flamingock annotation processor initialization
warning: [Flamingock] 'resources' parameter NOT passed. Using default 'src/main/resources'
warning: [Flamingock] 'sources' parameter NOT passed. Searching in: '[src/main/java, src/main/kotlin, src/main/scala, src/main/groovy]'
Note:    [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
Note:    [Flamingock] Initialization completed. Processed templated-based changes
Note:    [Flamingock] Searching for code-based changes (Java classes annotated with @Change or legacy @ChangeUnit annotations)
Note:    [Flamingock] Reading flamingock pipeline from file: 'src/main/resources/flamingock/pipeline.yaml'
Note:    [Flamingock] Finished processing annotated classes and generating metadata
```
> 🔍 The exact output may vary depending on your compiler settings, project layout, and whether you've customized the sources or resources paths using compiler options.

These logs confirm that:
- Flamingock found your pipeline
- Template and code-based changes were processed
- Metadata was generated for execution
-
> 💡 If you don’t see this output, ensure the annotation processor is correctly included in your dependencies and that your pipeline file is reachable.

---

## 7. Run Your Application — Flamingock Handles the Changes!
Once your project is compiled and Flamingock is configured, you're ready to run the application.

When your application starts, Flamingock will be executed as part of the startup process:
- Load the pipeline file(actually the metadata generated from the pipeline file  during the compilation)
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
## ✅ Next Steps

- Dive into [Spring Boot Integration](/docs/springboot-integration)
- Learn more about [Configuration Options](/docs/configuration)
- Understand [Rollback & Auditing](/docs/concepts#rollback)
