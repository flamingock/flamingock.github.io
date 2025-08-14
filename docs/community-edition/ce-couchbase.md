---
title: Couchbase
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to configure and use the **Flamingock Community Edition for Couchbase** in applications that interact directly with Couchbase using the **official Couchbase Java SDK**.

This edition is intended for scenarios where your application provides a `Cluster` instance and its associated connection. Flamingock will work directly on this connection to track and execute database changes. It does not rely on any framework abstraction or integration.

Flamingock persists a small set of metadata documents in Couchbase to support its execution model:

- **Audit logs** – to track the execution history of each change
- **Distributed locks** – to coordinate execution across multiple application nodes

---

## Edition

This edition supports Couchbase through a dedicated artifact:

| Edition Name              | Java SDK                           | Couchbase Compatibility |
|---------------------------|------------------------------------|-------------------------|
| `flamingock-ce-couchbase` | `com.couchbase.client:java-client` (>= `3.6.0`) | >= `7.0`              |

---

## Get started

To get started with the Flamingock Community Edition for Couchbase, follow these steps:

### 1. Add the required dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation(platform("io.flamingock:flamingock-ce-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-ce-couchbase")
implementation("com.couchbase.client:java-client:3.x.x")
```

</TabItem> <TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-couchbase</artifactId>
  <version>${flamingock.version}</version>
</dependency>
<dependency>
  <groupId>com.couchbase.client</groupId>
  <artifactId>java-client</artifactId>
  <version>3.x.x</version>
</dependency>
```

</TabItem> </Tabs>

---

### 2. Enable Flamingock runner

At minimum, you must provide:
- A Cluster instance (as a **dependency**)
- A Bucket instance (as a **dependency**)

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");
Bucket bucket = cluster.bucket("YOUR_BUCKET");

Runner runner = Flamingock.builder()
    .addDependency(cluster)
    .addDependency(bucket)
    .build();
```

### 3. Execute Flamingock

Once the Flamingock runner is configured and built, you can trigger Flamingock’s execution:

```java
runner.execute();
```

---

## Configuration overview

Flamingock requires both dependencies and configuration properties, set via the builder.

### Dependencies

These must be registered using `.addDependency(...)`

| Type                                | Required | Description                                        |
|-------------------------------------|:--------:|----------------------------------------------------|
| `com.couchbase.client.java.Cluster` |   Yes    | Required to connect and execute against Couchbase cluster. |
| `com.couchbase.client.java.Bucket` |   Yes    | Required to connect and execute against Couchbase bucket. |

### Properties

These must be set using `.setProperty(...)`

| Property      | Type      | Required | Default Value | Description                                                              |
|---------------|-----------|:--------:|---------------|--------------------------------------------------------------------------|
| `couchbase.autoCreate`  | `boolean` |    No    | `true`        | Whether Flamingock should auto-create required collections and indexes.      |
| `couchbase.scopeName`  | `String` |    No    | `"_default"`        | Name of the Couchbase scope where the collections exist or will be created.       |
| `couchbase.auditRepositoryName`   | `String`               |   No    | `"flamingockAuditLogs"`        | Name of the collection for storing the audit log. Overrides the default. Most users should keep the default value.    |
| `couchbase.lockRepositoryName`    | `String`               |    No    | `"flamingockLocks"`             | Name of the collection used for distributed locking. Overrides the default. Most users should keep the default value. |

:::warning
In production environments, we strongly recommend keeping the default configuration values unless you fully understand the implications.  
These defaults ensure consistency, safety, and compatibility with Flamingock’s locking and audit mechanisms.
:::

---

## Full configuration example

The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override `autoCreate`, which can be useful in lower environments or when managing schema manually.

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");
Bucket bucket = cluster.bucket("YOUR_BUCKET");

FlamingockBuilder builder = Flamingock.builder()
    // mandatory dependency
    .addDependency(cluster)
    .addDependency(bucket)
    // optional configuration
    .setProperty("autoCreate", true)
    .setProperty("couchbase.scopeName", "YOUR_SCOPE");
```

> You can add additional dependencies and properties based on your custom setup (e.g., metrics, listeners, or cloud-specific settings).

---

## Transaction support

> ⚠️ Couchbase transactions are not currently managed automatically by Flamingock.  
> However, Flamingock guarantees safe, idempotent changes through internal locking, auditing, and execution guarantees.


You can find some practical examples in the official GitHub repository:  
👉 [Flamingock Couchbase example](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)