---
sidebar_position: 20
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Get started

This guide shows you the minimum setup required to get Flamingock running. In just a few steps you will have it integrated in your application.

Let's walk through a simple scenario: evolving your inventory service with a few typical changes:

- Add a new column to a MySQL database  
- Provision a new S3 bucket for product images  
- Create a Kafka topic for stock updates  

Even in this basic example, Flamingock ensures all these changes are applied **safely, consistently, and audibly** at your application startup.  
This guide walks you through the process in 5 simple steps.


## 1. Set up Flamingock in your project

Add Flamingock to your build:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community")

annotationProcessor("io.flamingock:flamingock-processor:$flamingockVersion")
```

  </TabItem>
  <TabItem value="maven" label="Maven">

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>io.flamingock</groupId>
      <artifactId>flamingock-community-bom</artifactId>
      <version>${flamingockVersion}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-community</artifactId>
</dependency>

<!-- Annotation processor -->
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



## 2. Define your first ChangeUnits

Each ChangeUnit represents a single change.  
For our example, we'll define three:

- **MySQL**: Add a column `category` to products
- **S3**: Create a `product-images` bucket  
- **Kafka**: Create a `stock-updates` topic

ChangeUnits can be:
- **Code-based**: Java classes with annotations
- **Template-based**: YAML files using reusable templates

<Tabs groupId="change">
  <TabItem value="template_based" label="Template based" default>

```yaml
id: add-product-category
author: team
order: "001"
targetSystem: mysql-inventory
template: sql-template
execution: |
  ALTER TABLE products ADD COLUMN category VARCHAR(255)
rollback: |
  ALTER TABLE products DROP COLUMN category
```

  </TabItem>
  <TabItem value="code_based" label="Code based">

```java
@TargetSystem("aws-s3")
@ChangeUnit(id = "create-s3-bucket", order = "002", author = "team")
public class _002_CreateS3Bucket {

  @Execution
  public void execute(S3Client s3Client) {
    s3Client.createBucket(CreateBucketRequest.builder()
        .bucket("product-images")
        .createBucketConfiguration(
            CreateBucketConfiguration.builder()
                .locationConstraint(BucketLocationConstraint.EU_WEST_1)
                .build())
        .build());
  }

  @RollbackExecution
  public void rollback(S3Client s3Client) {
    s3Client.deleteBucket(DeleteBucketRequest.builder()
        .bucket("product-images")
        .build());
  }
}
```

  </TabItem>
</Tabs>

For more details, see [Concepts → ChangeUnits](../overview/core-concepts.md).


## 3. Create target systems

Target systems represent the external systems Flamingock will apply your changes to.  
They are configured in the builder and shared across ChangeUnits.

For our example:
- A MySQL database (`mysql-inventory`)
- An S3 bucket service (`aws-s3`)  
- A Kafka cluster (`kafka`)

```java
SqlTargetSystem sql = new SqlTargetSystem("mysql-inventory").withDatasource(ds);
DefaultTargetSystem s3 = new DefaultTargetSystem("aws-s3");
DefaultTargetSystem kafka = new DefaultTargetSystem("kafka");
```

See [Target systems](../flamingock-library-config/target-system-configuration.md) for more details.


## 4. Configure stages

Flamingock organizes your changes in stages.  
Most applications only need one stage:

```java
@EnableFlamingock(
  stages = {
    @Stage(location = "com.company.inventory.changes")
  }
)
public class App {}
```

- **location**: Where Flamingock should look for changes (package or resources)
- **name**: Optional — defaults to the location name

See [Stages](../flamingock-library-config/setup-and-stages.md) for more details and advanced setups.


## 5. Configure Flamingock runtime

Finally, configure Flamingock before running your application.

- **Community Audit Stores**: Set your audit store (MongoDB, DynamoDB, Couchbase, etc.) in the builder

- **Cloud Edition** (coming soon): Provide your API token, service name, and environment

<Tabs groupId="edition">
  <TabItem value="community" label="Community" default>

```java
FlamingockStandalone
  .setAuditStore(new MongoSyncAuditStore(mongoClient, mongoDatabase))
  .addTargetSystems(sql, s3, kafka)
  .build()
  .run();
```

  </TabItem>
  <TabItem value="cloud" label="Cloud (coming soon)">

```java
FlamingockStandalone
  .setApiToken("your-flamingock-api-token") 
  .setEnvironment("dev")
  .setService("inventory-service")
  .addTargetSystems(sql, s3, kafka)
  .build()
  .run();
```

  </TabItem>
</Tabs>


## 6. Run your application

When your service starts, Flamingock automatically:

1. Discovers your ChangeUnits
2. Checks pending changes  
3. Executes them safely in order
4. Records everything in the audit store

**If Flamingock cannot guarantee a safe outcome, it stops and alerts you. Safety first.**

### Example output

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


## Next steps

- [Spring Boot integration](../frameworks/springboot-integration/introduction.md)
- [Configuration options](../flamingock-library-config/setup-and-stages.md)
- [Recovery and safety](../recovery-and-safety/recovery-strategies.md)