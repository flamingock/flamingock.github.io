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

This edition supports key Flamingock features, including:

- Ordered and versioned change execution
- Support for distributed and concurrent deployments
- Built-in lock management for safe multi-instance operation
- Flamingock ensures consistency through its internal locking and idempotency mechanisms.

---

## Edition

This is a single edition for DynamoDB, provided as a standalone artifact.

| Edition Name              | Java Client                       | DynamoDB Compatibility |
|---------------------------|------------------------------------|------------------------|
| `flamingock-ce-dynamodb`  | `software.amazon.awssdk:dynamodb` | Fully supported        |

---

## Basic usage

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

### 2. Configure Flamingock

Once dependencies are added, initialize Flamingock with a `DynamoDbClient` and the required table names:

```java
DynamoDbClient dynamoClient = DynamoDbClient.builder()
    .region(Region.US_EAST_1)
    .build();

FlamingockBuilder builder = Flamingock.builder()
    .addDependency(dynamoClient)
    .setProperty("auditRepositoryName", "flamingockEntries")
    .setProperty("lockRepositoryName", "flamingockLock")
    // other common configurations
    ;
```

---

## Configuration overview

The following table lists all configuration properties supported by this edition. These can be set via `.setProperty(...)` on the `FlamingockBuilder`.

<div class="responsive-table">

| Property                        | Type              | Default Value            | Description                                                                 |
|---------------------------------|-------------------|--------------------------|-----------------------------------------------------------------------------|
| `autoCreate`                   | `Boolean`         | `true`                   | Automatically create required tables if they do not exist                   |
| `auditRepositoryName`          | `String`          | `"flamingockAuditLogs"`  | Table name used to store audit records                                      |
| `lockRepositoryName`           | `String`          | `"flamingockLock"`       | Table name used for distributed locking                                     |
| `readCapacityUnits`            | `Long`            | `5L`                     | Read capacity units (only relevant for **PROVISIONED** billing mode)        |
| `writeCapacityUnits`           | `Long`            | `5L`                     | Write capacity units (only relevant for **PROVISIONED** billing mode)       |

</div>

---

## Advanced configuration sample code

```java
DynamoDbClient dynamoClient = DynamoDbClient.builder()
    .region(Region.US_EAST_1)
    .build();

FlamingockBuilder builder = Flamingock.builder()
    .addDependency(dynamoClient)
    .setProperty("auditRepositoryName", "flamingockAuditLogs")
    .setProperty("lockRepositoryName", "flamingockLock")
    .setProperty("autoCreate", true)
    .setProperty("readCapacityUnits", 5L)
    .setProperty("writeCapacityUnits", 5L)
    // other common configurations
    ;
```

---

## Transaction support

> ⚠️ DynamoDB does not currently support multi-operation transactions that Flamingock can hook into across multiple ChangeUnits.  
> However, Flamingock ensures **safe, idempotent migrations** using its internal lock and audit mechanisms.

---