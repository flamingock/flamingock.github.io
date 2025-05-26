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

It is particularly suited to teams working in **framework-agnostic** or low-level environments, where integration is done directly at the driver level, and fine-grained control over MongoDB configuration is required.

The following sections cover how to configure Flamingock using the Java driver, explain the available editions for MongoDB 3.x and 4.x, and provide practical examples and best practices.

---

## Editions

Flamingock provides two specific editions for MongoDB, depending on the version of the **Java driver** used in your application.

| Edition Name                   | Java Driver                          | MongoDB Compatibility |
|--------------------------------|--------------------------------------|-----------------------|
| `flamingock-ce-mongodb-v3`     | `org.mongodb:mongo-java-driver`      | MongoDB 3.x           |
| `flamingock-ce-mongodb-sync4`  | `org.mongodb:mongodb-driver-sync`    | MongoDB 4.x           |

Select the edition that matches the MongoDB driver version used by your application.

---

## Get started

To get started with the Flamingock Community Edition for MongoDB, follow these basic steps:

### 1. Add the required dependencies

You must include both the **Flamingock MongoDB specific edition** and the corresponding **MongoDB Java driver** in your project. Use the appropriate coordinates depending on your build tool and MongoDB version.

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
// MongoDB v4
implementation("io.flamingock:flamingock-ce-mongodb-sync4:$flamingockVersion")
implementation("org.mongodb:mongodb-driver-sync:4.x.x")
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

```
</TabItem> </Tabs>


### 2. Set up MongoDB with Flamingock builder

At minimum, you must provide:
- A MongoClient instance (as a **dependency**)
- A mongodb.databaseName (as a **property**)
```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");

FlamingockBuilder builder = Flamingock.builder()
          .addDependency(mongoClient)
          .setProperty("mongodb.databaseName", "flamingock-database")
          // other common configurations
          ;
```

For production, we strongly recommend using the default MongoDB configuration values unless you fully understand the implications.

---

## Configuration overview

Flamingock’s MongoDB community edition requires both, dependencies  and configuration properties, provided via the flamingock builder.

### Dependencies
These must be registered using `.addDependency(...)`

| Type                             | Required | Description                     |
|----------------------------------|:--------:|---------------------------------|
| `com.mongodb.client.MongoClient` |   Yes    | Required to connect to MongoDB. |

### Properties


These must be set using `.setProperty(...)`

| Property                        | Type                  | Default Value                 | Required | Description                                                                                                           |
|---------------------------------|-----------------------|-------------------------------|:--------:|-----------------------------------------------------------------------------------------------------------------------|
| `mongodb.databaseName`          | `String`              | n/a                           |   Yes    | Name of the MongoDB database. This is required to store audit logs and acquire distributed locks.                     |
| `mongodb.autoCreate`            | `boolean`             | `true`                        |    No    | Whether Flamingock should automatically create required collections and indexes.                                      |
| `mongodb.readConcern`           | `String`              | `"MAJORITY"`                  |    No    | Controls the isolation level for read operations.                                                                     |
| `mongodb.writeConcern.w`        | `String or int`       | `"MAJORITY"`                  |    No    | Write acknowledgment level. Specifies how many MongoDB nodes must confirm the write for it to succeed.                |
| `mongodb.writeConcern.journal`  | `boolean`             | `true`                        |    No    | Whether the write must be committed to the journal before acknowledgment.                                             |
| `mongodb.writeConcern.wTimeout` | `Duration`            | `Duration.ofSeconds(1)`       |    No    | Maximum time to wait for the write concern to be fulfilled.                                                           |
| `mongodb.readPreference`        | `ReadPreferenceLevel` | `ReadPreferenceLevel.PRIMARY` |    No    | Defines which MongoDB node to read from.                                                                              |
| `mongodb.auditRepositoryName`   | `String`              | `"flamingockAuditLogs"`       |    No    | Name of the collection for storing the audit log. Overrides the default. Most users should keep the default value.    |
| `mongodb.lockRepositoryName`    | `String`              | `"flamingockLock"`            |    No    | Name of the collection used for distributed locking. Overrides the default. Most users should keep the default value. |


It's **strongly recommended keeping the default MongoDB configuration values provided by Flamingock** — especially in production environments. These defaults are carefully chosen to guarantee **maximum consistency, durability, and safety**, which are fundamental to Flamingock’s audit and rollback guarantees.

Overriding them is only appropriate in limited cases (e.g., testing or local development). If you choose to modify these settings, you assume full responsibility for maintaining the integrity and consistency of your system.

### Full configuration example

The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override defaults for collection names, index creation, and read/write behaviour. This level of configuration is useful when you need to customise Flamingock's behaviour to match the consistency and durability requirements of your deployment.


```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");

FlamingockBuilder builder = Flamingock.builder()
          // mandatory configuration
          .addDependency(mongoClient)
          .setProperty("mongodb.databaseName", "flamingock-database")
          // optional configuration
          .setProperty("mongodb.autoCreate", true)
          .setProperty("mongodb.readConcern", "MAJORITY")
          .setProperty("mongodb.writeConcern.w", "MAJORITY")
          .setProperty("mongodb.writeConcern.journal", true)
          .setProperty("mongodb.writeConcern.wTimeout", Duration.ofSeconds(1))
          .setProperty("mongodb.readPreference", ReadPreferenceLevel.PRIMARY)
          // other common configurations
          ;
```

---

## Transaction support

If your MongoDB deployment supports transactions, Flamingock allows you to work within a transactional session by declaring a `ClientSession` parameter in your changeUnit’s `@Execution` method:

```java
@Execution
public void execute(ClientSession session, MongoDatabase db) {
  db.getCollection("clients")
    .insertOne(session, new Document("name", "test"));
}
```
The session lifecycle is managed automatically by Flamingock.  If you omit the ClientSession parameter, the change will still execute, but it won't participate in a transaction.

> See the [Transactions](../transactions.md) page for general behavior and when to use `transactional = false`.

---

## Examples

You can find practical examples in the official GitHub repository:  
👉 [github.com/flamingock/flamingock-examples/mongodb](https://github.com/flamingock/flamingock-examples/mongodb)

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

- **Always match the edition to the MongoDB driver used in your project**  
  Use `flamingock-ce-mongodb-v3` for the legacy 3.x Java driver and `flamingock-ce-mongodb-sync4` for the 4.x sync driver.  
  This ensures proper transaction support and internal compatibility.
