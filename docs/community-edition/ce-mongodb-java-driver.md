---
title: MongoDB (Java Driver)
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to configure and use the **Flamingock Community Edition for MongoDB** in applications that interact directly with MongoDB using the **official Java driver**.

This edition is designed for use cases where the application provides its own MongoDB connection via `MongoClient`, and Flamingock operates directly over that connection to manage changes. It does not rely on any external framework or abstraction layer.

Flamingock persists a minimal set of metadata in your MongoDB database to support its execution model:

- **Audit logs** – to track which changes have been executed  
- **Distributed locks** – to ensure safe and coordinated execution across multiple application instances

This edition supports the full Flamingock feature set, including:

- Ordered and versioned change execution
- Support for concurrent, distributed deployments
- Optional transactional execution (if supported by the MongoDB server)

It is particularly suited to teams working in **framework-agnostic** or low-level environments, where integration is done directly at the driver level, and fine-grained control over MongoDB configuration is required.

The following sections cover how to configure Flamingock using the Java driver, explain the available editions for MongoDB 3.x and 4.x, and provide practical examples and best practices.

---

## Editions

Flamingock provides two specific editions for MongoDB, depending on the version of the **Java driver** used in your application.

| Edition Name                   | Java Driver                          | MongoDB Compatibility |
|--------------------------------|--------------------------------------|------------------------|
| `flamingock-ce-mongodb-v3`     | `org.mongodb:mongo-java-driver`      | MongoDB 3.x            |
| `flamingock-ce-mongodb-sync4`  | `org.mongodb:mongodb-driver-sync`    | MongoDB 4.x            |

Select the edition that matches the MongoDB driver version used by your application.

---

## Basic usage

To get started with the Flamingock Community Edition for MongoDB, follow these basic steps:

---

### 1. Add the required dependencies

You must include both the **Flamingock MongoDB specific edition** and the corresponding **MongoDB Java driver** in your project. Use the appropriate coordinates depending on your build tool and MongoDB version.

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
// MongoDB v4
implementation("io.flamingock:flamingock-ce-mongodb-sync4:$flamingockVersion")
implementation("org.mongodb:mongodb-driver-sync:4.x.x")

// MongoDB v3
implementation("io.flamingock:flamingock-ce-mongodb-v3:$flamingockVersion")
implementation("org.mongodb:mongo-java-driver:3.x.x")
```

</TabItem> <TabItem value="maven" label="Maven">

```xml
<!-- MongoDB v4 -->
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-sync4</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-driver-sync</artifactId>
  <version>4.x.x</version>
</dependency>

<!-- MongoDB v3 -->
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-v3</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongo-java-driver</artifactId>
  <version>3.x.x</version>
</dependency>
```
</TabItem> </Tabs>

---

### 2. Configure Flamingock

Once the dependency is added, you must initialise Flamingock with a MongoDB client and the database name.

```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");

FlamingockBuilder builder = Flamingock.builder()
          .addDependency(mongoClient)
          .setProperty("databaseName", "flamingock-database")
          // other common configurations
          ;
```

---

This minimal setup is sufficient to execute changes and track progress. For advanced configuration options such as custom repository names, index creation control, or read/write behaviour, see the [Configuration Overview](#configuration-overview) section.

---

## Configuration overview

The following table lists all configuration properties supported by the Flamingock Community Edition for MongoDB when using the Java driver. These properties can be set programmatically via the `setProperty(...)` method of the `FlamingockBuilder`. Some properties are mandatory, such as `databaseName`, while others are optional and have default values.

<div class="responsive-table">

| Property                       | Type                     | Default Value                             | Description                                                           |
|--------------------------------|--------------------------|-------------------------------------------|-----------------------------------------------------------------------|
| `databaseName`                 | `String`                 |                                           | Name of the database ***(mandatory)***                                |
| `migrationRepositoryName`      | `String`                 | `"flamingockEntries"`                     | Name of the collection used to store applied changes                  |
| `lockRepositoryName`           | `String`                 | `"flamingockLock"`                        | Name of the collection used for distributed locking                   |
| `indexCreation`                | `boolean`                | `true`                                    | Whether Flamingock should automatically create required indexes       |
| `writeConcern`                 | `WriteConcern`           | `WriteConcern.MAJORITY.withJournal(true)` | Controls write durability and acknowledgement                         |
| `readConcern`                  | `ReadConcern`            | `ReadConcern.MAJORITY`                    | Controls the level of isolation for read operations                   |
| `readPreference`               | `ReadPreference`         | `ReadPreference.primary()`                | Specifies which MongoDB node to read from                             |

---

</div>

## Advanced configuration sample code

The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override defaults for collection names, index creation, and read/write behaviour. This level of configuration is useful when you need to customise Flamingock's behaviour to match the consistency and durability requirements of your deployment.


```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");

FlamingockBuilder builder = Flamingock.builder()
          // mandatory configuration
          .addDependency(mongoClient)
          .setProperty("databaseName", "flamingock-database")
          // optional configuration (with default values)
          .setProperty("migrationRepositoryName", "flamingockEntries")
          .setProperty("lockRepositoryName", "flamingockLock")
          .setProperty("indexCreation", true)
          .setProperty("writeConcern", WriteConcern.MAJORITY.withJournal(true))
          .setProperty("readConcern", ReadConcern.MAJORITY)
          .setProperty("readPreference", ReadPreference.primary())
          // other common configurations
          ;
```

---

## Transaction support

If your MongoDB deployment supports transactions, Flamingock allows you to work within a `ClientSession` by simply declaring it as a method parameter in your ChangeUnit:

```java
@Execution
public void execute(ClientSession session, MongoDatabase db) {
  db.getCollection("clients")
    .insertOne(session, new Document("name", "test"));
}
```

> The session lifecycle is managed automatically by Flamingock.

---

## Spring Boot integration

Flamingock Community Edition for MongoDB can be seamlessly integrated into Spring Boot applications, even when using the Java Driver directly (without Spring Data).

Spring Boot support is provided through Flamingock’s general Spring Boot integration module, which automatically wires required components and supports configuration through standard Spring properties.

If your application uses the Java driver (`MongoClient`) to connect to MongoDB and runs within a Spring Boot context, you can take advantage of this integration to simplify setup and lifecycle management.

---

### 1. Add required dependencies

You’ll need to include the **Flamingock MongoDB specific edition** with the corresponding **MongoDB Java driver**, and the **Spring Boot integration** module for your Spring Boot version.

<Tabs groupId="build">
<TabItem value="gradle" label="Gradle">

```kotlin
// MongoDB v4 edition (Java driver)
implementation("io.flamingock:flamingock-ce-mongodb-sync4:$flamingockVersion")
implementation("org.mongodb:mongodb-driver-sync:4.x.x")

// Spring Boot integration
implementation("io.flamingock:springboot-integration-v3:$flamingockVersion") // or -v2
```

</TabItem>
<TabItem value="maven" label="Maven">

```xml
<!-- MongoDB v4 edition -->
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-sync4</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-driver-sync</artifactId>
  <version>4.x.x</version>
</dependency>

<!-- Spring Boot integration -->
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>springboot-integration-v3</artifactId> <!-- or v2 -->
  <version>${flamingock.version}</version>
</dependency>
```

</TabItem>
</Tabs>

---

### 2. Enable Flamingock

Use the automatic integration with `@EnableFlamingock` in your main application class:

```java
@EnableFlamingock
@SpringBootApplication
public class MyApp {
  public static void main(String[] args) {
    SpringApplication.run(MyApp.class, args);
  }
}
```

---

### 3. Provide configuration

In your `application.yml` or `application.properties`, define the MongoDB connection and Flamingock properties:

```yaml
flamingock:
  databaseName: flamingock-database
  # other properties
```

> The `MongoClient` must be declared as a Spring bean in your application context. Flamingock will automatically detect and use it.

---

### 4. For advanced setups

If you need more control (e.g. setting properties programmatically or registering dependencies manually), you can use the [builder-based Spring Boot integration](/docs/springboot-integration/builder-based-setup) instead of `@EnableFlamingock`.

---

## Examples

You can find practical examples in the official GitHub repository:  
👉 [github.com/flamingock/flamingock-examples/mongodb](https://github.com/flamingock/flamingock-examples/mongodb)

---

## :white_check_mark: Best practices

- Use the default repository names with the `flamingock` prefix to avoid naming collisions.
- Only disable `indexCreation` if you manage indexes explicitly.
- Configure `writeConcern`, `readConcern`, and `readPreference` based on your durability and consistency requirements.
- Ensure you are using the appropriate edition matching the MongoDB driver version in your project.
