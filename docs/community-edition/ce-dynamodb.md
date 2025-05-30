---
title: DynamoDB
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to configure and use the **Flamingock Community Edition for DynamoDB** in applications that interact with Amazon DynamoDB using the **official AWS SDK for Java**.

This edition is designed for use cases where the application provides its own DynamoDB client via `DynamoDbClient`, and Flamingock operates directly over that connection to manage changes. It does not require any framework-level integration.

Flamingock persists a minimal set of metadata in your DynamoDB tables to support its execution model:

- **Audit records** – to track which changes have been applied  
- **Distributed locks** – to coordinate executions across multiple instances

---

## Edition

This is a single edition for DynamoDB, provided as a standalone artifact.

| Edition Name             | Java Client                       |  DynamoDB Compatibility  |
|--------------------------|-----------------------------------|:------------------------:|
| `flamingock-ce-dynamodb` | `software.amazon.awssdk:dynamodb` |          `2.x`           |

---

## Get started

To get started with the Flamingock Community Edition for DynamoDB, follow these steps:

---

### 1. Add the required dependencies

You must include both the **Flamingock DynamoDB edition** and the **AWS SDK v2 for DynamoDB** in your project.

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation("io.flamingock:flamingock-ce-dynamodb:$flamingockVersion")
implementation("software.amazon.awssdk:dynamodb-enhanced:2.x.x")
implementation("software.amazon.awssdk:url-connection-client:2.x.x")
```

</TabItem> <TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-dynamodb</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>dynamodb-enhanced</artifactId>
  <version>2.x.x</version>
</dependency>
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>url-connection-client</artifactId>
  <version>2.x.x</version>
</dependency>
```

</TabItem> </Tabs>

---

### 2. Enable Flamingock runner

At minimum, you must provide a `DynamoDbClient` instance (as a **dependency**)
```java 
DynamoDbClient dynamoClient = DynamoDbClient.builder()
        .region(Region.US_EAST_1)
        .build();

Runner runner = Flamingock.builder()
        .addDependency(dynamoClient)
        .build();

```

### 3. Execute Flamingock
Once the Flamingock runner is configured and built, you can trigger Flamingock’s execution:

```java
runner.execute();
```


---
## Configuration overview

Flamingock’s DynamoDB Community Edition requires both:
- A `DynamoDbClient` dependency
- A set of configuration properties

### Dependencies

These must be registered using `.addDependency(...)`

| Type                                                      | Required | Description                                    |
|-----------------------------------------------------------|:--------:|------------------------------------------------|
| `software.amazon.awssdk.services.dynamodb.DynamoDbClient` |   Yes    | Required to access and modify DynamoDB tables. |

### Properties

These must be set using `.setProperty(...)`

| Property              | Type      | Required | Default Value         | Description                                                                  |
|-----------------------|-----------|:--------:|-----------------------|------------------------------------------------------------------------------|
| `readCapacityUnits`   | `Long`    |    No    | `5L`                  | Read capacity units (for **PROVISIONED** billing mode only).                 |
| `writeCapacityUnits`  | `Long`    |    No    | `5L`                  | Write capacity units (for **PROVISIONED** billing mode only).                |
| `autoCreate`          | `Boolean` |    No    | `true`                | Automatically creates the required tables if they do not exist.              |
| `auditRepositoryName` | `String`  |    No    | `flamingockAuditLogs` | Table used to store audit records. Most users should keep the default name.  |
| `lockRepositoryName`  | `String`  |    No    | `flamingockLock`      | Table used for distributed locking. Most users should keep the default name. |

:::warning
In production environments, we strongly recommend keeping the default configuration values unless you fully understand the implications.  
These defaults ensure consistency, safety, and compatibility with Flamingock’s locking and audit mechanisms.
:::




---


## Full configuration example
The following example shows how to configure Flamingock with both required and optional properties. 
It demonstrates how to override index creation, and read/write behaviour. 
This level of configuration is useful when you need to customise Flamingock's behaviour to match the consistency and 
durability requirements of your deployment.
```java
DynamoDbClient dynamoClient = DynamoDbClient.builder()
        .region(Region.US_EAST_1)
        .build();

FlamingockBuilder builder = Flamingock.builder()
        .addDependency(dynamoClient)
        .setProperty("autoCreate", true)
        .setProperty("readCapacityUnits", 5L)
        .setProperty("writeCapacityUnits", 5L);

```


---

## Transaction support


Flamingock supports transactional execution on DynamoDB using the enhanced client’s `TransactWriteItemsEnhancedRequest.Builder`.

If a change unit is marked as transactional (which is the default), Flamingock will:

- Create a **fresh transactional builder** (`TransactWriteItemsEnhancedRequest.Builder`) for that change
- Inject it into the `@Execution` method
- Execute the transaction **only if the change completes successfully** — including Flamingock’s internal audit write as part of the same transaction

This ensures **atomicity**: either all operations defined in the change unit — including the audit log — are applied together, or none are.

### Example
```java
@Execution
public void execute(@NonLockGuarded DynamoDbClient client,
                    TransactWriteItemsEnhancedRequest.Builder builder) {

  DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
      .dynamoDbClient(client)
      .build();

  DynamoDbTable<UserEntity> table = enhancedClient.table("users", TableSchema.fromBean(UserEntity.class));

  builder.addPutItem(table, new UserEntity("Alice", "Anderson"));
  builder.addPutItem(table, new UserEntity("Bob", "Bennett"));
}

```

:::tip
You can add as many operations as needed to the builder: `putItem`, `updateItem`, `deleteItem`, etc.  
These operations will be executed **in a single atomic transaction**, together with Flamingock’s internal audit log update.
:::

:::warning
If you mark a change unit as transactional but do **not** add any operations to the builder, Flamingock will still execute the transaction — but it will contain **only the audit log entry**.

Make sure your change unit populates the `TransactWriteItemsEnhancedRequest.Builder` appropriately.
:::

> See the [Transactions](../transactions.md) page for general guidance and best practices around transactional vs non-transactional change units.



---