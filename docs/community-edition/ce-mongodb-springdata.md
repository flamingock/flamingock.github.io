---
title: MongoDB (Spring Data)
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to use the **Flamingock Community Edition for MongoDB** in applications that rely on **Spring Data MongoDB**.

This edition is designed for teams that already use Spring Data to manage their database access and want to include Flamingock as part of their change tracking and execution model. It integrates with **Spring Boot** and **MongoTemplate**, handling auditing, distributed locking, and transactional coordination.

Flamingock persists a minimal set of metadata in your MongoDB database:

- **Audit logs** — track which changes have been applied
- **Distributed locks** — prevent concurrent modifications in distributed deployments


---

## Editions

Flamingock provides three specific editions for Spring Data MongoDB, depending on the version of **Spring Data** used in your application. Each edition is aligned with the underlying MongoDB Java driver supported by that Spring Data version.

| Edition Name                          | Spring Data Version | MongoDB Driver Version | MongoDB Compatibility |
|---------------------------------------|---------------------|------------------------|-----------------------|
| `flamingock-ce-mongodb-springdata-v2` | 2.x                 | 3.x                    | MongoDB 3.x           |
| `flamingock-ce-mongodb-springdata-v3` | 3.x                 | 4.x                    | MongoDB 4.x           |
| `flamingock-ce-mongodb-springdata-v4` | 4.x                 | 4.x                    | MongoDB 4.x+          |

Select the edition that matches the version of Spring Data MongoDB used in your project.

:::info JDK compatibility
The `flamingock-ce-mongodb-springdata-v4` edition requires **JDK 17 or higher**, as it is aligned with the Spring Data 4.x and Spring Boot 3.x ecosystems.
:::

---

## Get Started
If you're using **Spring Boot**, the recommended approach is the **automatic setup** with `@EnableFlamingock`.

By annotating your main class with `@EnableFlamingock`, Flamingock will:
- Automatically detect and inject Spring components (`ApplicationContext`, `ApplicationEventPublisher`, etc.)
- Pick up configuration from the native Spring Boot config file
- Create and register a runner bean (either `ApplicationRunner` or `InitializingBean`)

### 1. Add the required dependencies

<Tabs groupId="build_enable">
<TabItem value="gradle" label="Gradle">

```kotlin
implementation("io.flamingock:flamingock-ce-mongodb-springdata-v4:$flamingockVersion")
implementation("io.flamingock:springboot-integration-v3:$flamingockVersion")
```

</TabItem>
<TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-springdata-v4</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>springboot-integration-v3</artifactId>
  <version>${flamingock.version}</version>
</dependency>
```

</TabItem>
</Tabs>

### 2. Enable Flamingock runner

Choose one of the following options based on your preferred integration style:
- **Automatic setup** (recommended): Just annotate your main class with `@EnableFlamingock`
- **Manual builder-based setup**: Manually register the Flamingock runner bean

<Tabs groupId="automatic_builder">
<TabItem value="automatic" label="Automatic">

```java
@EnableFlamingock
@SpringBootApplication
public class MyApp {
  public static void main(String[] args) {
    SpringApplication.run(MyApp.class, args);
  }
}
```

</TabItem>
<TabItem value="builder" label="Builder">

```java
@Bean
public ApplicationRunner flamingockRunner(ApplicationContext context,
                                           ApplicationEventPublisher publisher,
                                           MongoTemplate template) {
  FlamingockBuilder builder = Flamingock.builder()
      .addDependency(context)
      .addDependency(publisher)
      .addDependency(template)
      .setProperty("mongodb.databaseName", "flamingock-db");
  return SpringbootUtil.toApplicationRunner(builder.build());
}

```

</TabItem>
</Tabs>


---

## Configuration overview

Flamingock’s MongoDB Spring Data edition requires two types of inputs:

- **Dependencies**: These are required runtime components, such as `MongoTemplate`
- **Properties**: These configure Flamingock’s internal behavior and are typically declared in the Spring configuration file or via the builder.

### Dependencies

These must be available in the Spring context (when using `@EnableFlamingock`) or registered via `.addDependency(...)` when using the builder.

| Type                                                    | Required | Notes                                                                                                              |
|---------------------------------------------------------|:--------:|--------------------------------------------------------------------------------------------------------------------|
| `org.springframework.data.mongodb.core.MongoTemplate`   |   Yes    | Must be declared as a Spring bean. If you're using Spring Boot with MongoDB, Spring will auto-configure this bean. |
| `org.springframework.context.ApplicationContext`        |   Yes    | Auto-injected by Spring Boot (no manual configuration needed).                                                     |
| `org.springframework.context.ApplicationEventPublisher` |   Yes    | Auto-injected by Spring Boot (no manual configuration needed).                                                     |

:::info
In most cases, **Spring Boot will automatically configure `MongoTemplate`** based on your database connection settings.
:::

### Properties

These can be set using `.setProperty(...)` with the builder or via the Spring Boot configuration file.

| Property                         | Type                   | Default Value                  | Required | Description                                                                                     |
|----------------------------------|------------------------|--------------------------------|:--------:|-------------------------------------------------------------------------------------------------|
| `mongodb.autoCreate`             | `boolean`              | `true`                         |    No    | Whether Flamingock should automatically create required collections and indexes.                |
| `mongodb.readConcern`            | `String`               | `"MAJORITY"`                   |    No    | Controls the level of isolation for read operations.                                            |
| `mongodb. writeConcern.w`        | `String or int`        | `"MAJORITY"`                   |    No    | Write acknowledgment. Specifies how many MongoDB nodes must confirm the write.                  |
| `mongodb. writeConcern.journal`  | `boolean`              | `true`                         |    No    | Whether the write must be written to the on-disk journal before acknowledgment.                 |
| `mongodb. writeConcern.wTimeout` | `Duration`             | `Duration. ofSeconds(1)`       |    No    | Maximum time to wait for the write concern to be fulfilled.                                     |
| `mongodb. readPreference`        | `ReadPreference Level` | `ReadPreferenceLevel. PRIMARY` |    No    | Specifies which MongoDB node to read from.                                                      |
| `mongodb. auditRepositoryName`   | `String`               | `"flamingockAuditLogs"`        |    No    | Name of the collection used to store applied changes. Most users should keep the default value. |
| `mongodb. lockRepositoryName`    | `String`               | `"flamingockLock"`             |    No    | Name of the collection used for distributed locking. Most users should keep the default value.  |

:::warning
It's **strongly recommended keeping the default MongoDB configuration values provided by Flamingock** — especially in production environments. These defaults are carefully chosen to guarantee **maximum consistency, durability, and safety**, which are fundamental to Flamingock’s audit and rollback guarantees.
:::
Overriding them is only appropriate in limited cases (e.g., testing or local development). If you choose to modify these settings, you assume full responsibility for maintaining the integrity and consistency of your system.


### Full configuration example
The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override index creation, and read/write behaviour. This level of configuration is useful when you need to customise Flamingock's behaviour to match the consistency and durability requirements of your deployment.

<Tabs groupId="automatic_builder">
<TabItem value="automatic" label="Automatic">

```yaml
flamingock:
  mongodb:
    databaseName: flamingock-db
    autoCreate: true
    readConcern: MAJORITY
    writeConcern:
      w: MAJORITY
      journal: true
      wTimeout: 1s
    readPreference: PRIMARY
```

</TabItem>
<TabItem value="builder" label="Builder">

```java
FlamingockBuilder builder = Flamingock.builder()
        .addDependency(applicationContext)
        .addDependency(applicationEventPublisher)
        .addDependency(mongoTemplate)
        .setProperty("mongodb.databaseName", "flamingock-db")
        .setProperty("mongodb.autoCreate", true)
        .setProperty("mongodb.readConcern", "MAJORITY")
        .setProperty("mongodb.writeConcern.w", "MAJORITY")
        .setProperty("mongodb.writeConcern.journal", true)
        .setProperty("mongodb.writeConcern.wTimeout", Duration.ofSeconds(1))
        .setProperty("mongodb.readPreference", ReadPreferenceLevel.PRIMARY);


```

</TabItem>
</Tabs>

---

## Transaction support

If your MongoDB deployment supports transactions, Flamingock can execute Spring Data operations within a transactional session — **as long as the underlying MongoDB driver and Spring Data version allow it**.

To benefit from transactional execution, simply declare your `@Execution` method to receive a `MongoTemplate`:

```java
@Execution
public void change(MongoTemplate mongoTemplate) {
    // use template with transaction support (managed by Flamingock)
}
```

Internally, Flamingock will manage the transaction lifecycle and ensure all operations performed through `MongoTemplate` are part of a single, atomic transaction. If anything fails, the changes and the audit log will be rolled back.

There is no need to manually manage a `ClientSession` when using Spring Data.
Flamingock integrates with Spring’s transaction management infrastructure to coordinate the session for you.

> See the [Transactions](../flamingock-library-config/transactions.md) page for general behavior and when to use `transactional = false`.

---

## Examples

You can find practical examples in the official GitHub repository:  
👉 [Flamingock MongoDB example](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)

---

## :white_check_mark: Best practices

- **Use Flamingock’s default consistency settings (`writeConcern`, `readConcern`, `readPreference`) in production**  
  These defaults are **strictly selected to guarantee strong consistency, durability, and fault-tolerance**, which are fundamental to Flamingock’s execution guarantees.  
  Overriding them is **strongly discouraged in production environments**, as it can compromise the integrity of audit logs and distributed coordination.

- **Use the default repository names (`flamingockAuditLogs`, `flamingockLock`) unless you have a strong reason to change them**  
  The default names are chosen to avoid collisions and clearly identify Flamingock-managed collections. Overriding them is supported but rarely necessary.

- **Keep `indexCreation` enabled unless your deployment restricts index creation at runtime**  
  This setting ensures that Flamingock creates and maintains the required indexes to enforce audit integrity and locking guarantees.  
  Disable this only if your application does not have the necessary permissions to create indexes — and only if you manage the required indexes manually.

- **Always use the edition that matches your Spring Data and MongoDB driver version**  
  For example, Spring Data 4.x → `flamingock-ce-mongodb-springdata-v4`.