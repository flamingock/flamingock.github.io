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
| `flamingock-ce-couchbase` | `com.couchbase.client:java-client` | >= `3.4.3`              |

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

At minimum, you must provide a `Cluster` instance (as a **dependency**):

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");

Runner runner = Flamingock.builder()
    .addDependency(cluster)
    .build();
```

### 3. Execute Flamingock

Once the Flamingock runner is configured and built, you can trigger Flamingock’s execution:

```java
runner.execute();
```

---

## Configuration overview

Flamingock’s Couchbase Community Edition requires both:

- A `Cluster` dependency
- A set of configuration properties

### Dependencies

These must be registered using `.addDependency(...)`

| Type                                | Required | Description                                        |
|-------------------------------------|:--------:|----------------------------------------------------|
| `com.couchbase.client.java.Cluster` |   Yes    | Required to connect and execute against Couchbase. |

### Properties

These must be set using `.setProperty(...)`

| Property      | Type      | Required | Default Value | Description                                                              |
|---------------|-----------|:--------:|---------------|--------------------------------------------------------------------------|
| `autoCreate`  | `boolean` |    No    | `true`        | Whether Flamingock should auto-create required buckets and indexes.      |

:::warning
In production environments, we strongly recommend keeping the default configuration values unless you fully understand the implications.  
These defaults ensure consistency, safety, and compatibility with Flamingock’s locking and audit mechanisms.
:::

---

## Full configuration example

The following example shows how to configure Flamingock with both required and optional properties. It demonstrates how to override `autoCreate`, which can be useful in lower environments or when managing schema manually.

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");

FlamingockBuilder builder = Flamingock.builder()
    // mandatory dependency
    .addDependency(cluster)
    // optional configuration
    .setProperty("autoCreate", true);
```

> You can add additional dependencies and properties based on your custom setup (e.g., metrics, listeners, or cloud-specific settings).

---

## Transaction support

> ⚠️ Couchbase transactions are not currently managed automatically by Flamingock.  
> However, Flamingock guarantees safe, idempotent changes through internal locking, auditing, and execution guarantees.


You can find some practical examples in the official GitHub repository:  
👉 [Flamingock Couchbase example](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)