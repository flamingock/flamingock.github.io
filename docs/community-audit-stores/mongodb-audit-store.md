---
title: MongoDB
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to configure and use the **Flamingock Community Audit Stores for MongoDB** in applications that interact directly with MongoDB using the **official Java driver** (`mongodb-driver-sync`).

This edition is designed for use cases where the application provides its own MongoDB connection via `MongoClient`, and Flamingock operates directly over that connection to manage changes. It does not rely on any external framework or abstraction layer.

Flamingock persists a minimal set of metadata in your MongoDB database to support its execution model:

- **Audit logs** – to track which changes have been executed  
- **Distributed locks** – to ensure safe and coordinated execution across multiple application instances

It is particularly suited to teams working in **framework-agnostic** or low-level environments, where integration is done directly at the driver level, and fine-grained control over MongoDB configuration is required.

Flamingock supports `mongodb-driver-sync` versions from **4.0.0 up to 5.x.x**.

---

## Supported versions

| Flamingock Module                 | MongoDB Driver                   | MongoDB Compatibility       |
|----------------------------------|----------------------------------|-----------------------------|
| `flamingock-ce-mongodb-sync`     | `org.mongodb:mongodb-driver-sync` (4.0.0 - 5.x.x) | MongoDB 3.x to 5.x           |

---

## Get started

To get started with the Flamingock Community Audit Stores for MongoDB, follow these basic steps:

### 1. Add the required dependencies

You must include the **Flamingock MongoDB sync edition** and a compatible **MongoDB Java driver** in your project.

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
// MongoDB v4
implementation(platform("io.flamingock:flamingock-ce-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-ce-mongodb-sync")
implementation("org.mongodb:mongodb-driver-sync:4.x.x")
```

</TabItem> <TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-sync</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-driver-sync</artifactId>
  <version>5.5.1</version> <!-- or any version between 4.0.0 and 5.x.x -->
</dependency>
```

</TabItem> </Tabs>

### 2. Enable Flamingock runner

At minimum, you must provide:
- A MongoDatabase (as a **dependency**)
- A MongoClient instance (as a **dependency**)

```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
MongoDatabase mongoDatabase = mongoClient.getDatabase("YOUR_DATABASE");

Runner runner = Flamingock.builder()
          .addDependency(mongoDatabase)
          .addDependency(mongoClient)
          // other optional configurations
          .build();
```
For production, we strongly recommend using the default MongoDB configuration values unless you fully understand the implications.
### 3. Execute Flamingock
Once the Flamingock runner is configured and built, you can trigger Flamingock’s execution:
```java
runner.execute();
```

---

## Configuration overview

Flamingock requires both dependencies and configuration properties, set via the builder.

### Dependencies

| Type                               | Required | Description                                   |
|------------------------------------|:--------:|-----------------------------------------------|
| `com.mongodb.client.MongoDatabase` |   Yes    | Required to connect to your MongoDB database. |
| `com.mongodb.client.MongoClient`   |   Yes    | Required for transactional support.           |

### Properties

These must be set using `.setProperty(...)`

| Property                         | Type                   | Default Value                  | Required | Description                                                                                                           |
|----------------------------------|------------------------|--------------------------------|:--------:|-----------------------------------------------------------------------------------------------------------------------|
| `mongodb.autoCreate`             | `boolean`              | `true`                         |    No    | Whether Flamingock should automatically create required collections and indexes.                                      |
| `mongodb.readConcern`            | `String`               | `"MAJORITY"`                   |    No    | Controls the isolation level for read operations.                                                                     |
| `mongodb. writeConcern.w`        | `String or int`        | `"MAJORITY"`                   |    No    | Write acknowledgment level. Specifies how many MongoDB nodes must confirm the write for it to succeed.                |
| `mongodb. writeConcern.journal`  | `boolean`              | `true`                         |    No    | Whether the write must be committed to the journal before acknowledgment.                                             |
| `mongodb. writeConcern.wTimeout` | `Duration`             | `Duration .ofSeconds(1)`       |    No    | Maximum time to wait for the write concern to be fulfilled.                                                           |
| `mongodb. readPreference`        | `ReadPreference Level` | `ReadPreferenceLevel .PRIMARY` |    No    | Defines which MongoDB node to read from.                                                                              |
| `mongodb. auditRepositoryName`   | `String`               | `"flamingockAuditLogs"`        |    No    | Name of the collection for storing the audit log. Overrides the default. Most users should keep the default value.    |
| `mongodb. lockRepositoryName`    | `String`               | `"flamingockLocks"`             |    No    | Name of the collection used for distributed locking. Overrides the default. Most users should keep the default value. |

:::warning
We strongly recommend keeping the default configuration values in production environments. They are optimized for **consistency, durability, and safety**, ensuring Flamingock’s audit and rollback guarantees.
:::
Overriding them is only appropriate in limited cases (e.g., testing or local development). If you choose to modify these settings, you assume full responsibility for maintaining the integrity and consistency of your system.

### Full configuration example
The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override  index creation, and read/write behaviour. This level of configuration is useful when you need to customise Flamingock's behaviour to match the consistency and durability requirements of your deployment.

```java
MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
MongoDatabase mongoDatabase = mongoClient.getDatabase("YOUR_DATABASE");

FlamingockBuilder builder = Flamingock.builder()
          .addDependency(mongoDatabase)
          .addDependency(mongoClient)
          .setProperty("mongodb.autoCreate", true)
          .setProperty("mongodb.readConcern", "MAJORITY")
          .setProperty("mongodb.writeConcern.w", "MAJORITY")
          .setProperty("mongodb.writeConcern.journal", true)
          .setProperty("mongodb.writeConcern.wTimeout", Duration.ofSeconds(1))
          .setProperty("mongodb.readPreference", ReadPreferenceLevel.PRIMARY");
```

---

## Transaction support

Flamingock supports transactions via `ClientSession` when used with a compatible MongoDB deployment. Simply include it as a parameter in your change unit:

```java
@Execution
public void execute(ClientSession session, MongoDatabase db) {
  db.getCollection("clients")
    .insertOne(session, new Document("name", "test"));
}
```
The session lifecycle is managed automatically by Flamingock.  If you omit the ClientSession parameter, the change will still execute, but it won't participate in a transaction.

> See the [Transactions](../flamingock-library-config/transactions.md) page for guidance on when and how to disable transactions (e.g., `transactional = false`).

---

## Examples

You can find practical examples in the official GitHub repository:  
👉 [Flamingock MongoDB example](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)

---

## ✅ Best practices

- **Use Flamingock’s default consistency settings (`writeConcern`, `readConcern`, `readPreference`) in production**  
  These values guarantee strong consistency, durability, and fault tolerance. Overriding them is discouraged unless absolutely necessary.

- **Use the default collection names (`flamingockAuditLogs`, `flamingockLocks`)**  
  These help avoid collisions and simplify debugging.

- **Enable automatic index creation unless your environment prohibits it**  
  This ensures that Flamingock can enforce audit and locking guarantees. If disabled, manage indexes manually.

- **Ensure your MongoDB Java driver version is between 4.0.0 and 5.x.x**  
  This range is tested and supported by Flamingock.
