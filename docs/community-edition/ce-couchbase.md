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

Supported features include:

- Ordered, versioned change execution
- Safe operation across distributed environments
- Built-in lock management
- Minimal, dependency-free integration

---

## Edition

This edition supports Couchbase through a dedicated artifact:

| Edition Name              | Java SDK                     | Couchbase Compatibility |
|---------------------------|-------------------------------|--------------------------|
| `flamingock-ce-couchbase` | `com.couchbase.client:java-client` | Fully supported      |

---

## Basic usage

Follow these steps to use the Flamingock Community Edition for Couchbase.

---

### 1. Add the required dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation("io.flamingock:flamingock-ce-couchbase:$flamingockVersion")
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

### 2. Configure Flamingock

You must provide a Couchbase `Cluster` instance and connection string. Then configure Flamingock using the builder.

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");

FlamingockBuilder builder = Flamingock.builder()
    .addDependency(cluster)
    .setProperty("autoCreate", true)
    // other configurations
    ;
```

---

## Configuration overview

Below is the list of configuration properties available for this edition:

<div class="responsive-table">

| Property             | Type      | Required | Default Value | Description                                                              |
|----------------------|-----------|----------|----------------|--------------------------------------------------------------------------|
| `autoCreate`         | `boolean` | false    | `true`         | Whether Flamingock should auto-create required buckets and indexes       |

</div>


---

## Advanced configuration sample code

```java
Cluster cluster = Cluster.connect("localhost", "username", "password");

FlamingockBuilder builder = Flamingock.builder()
    .addDependency(cluster)
    .setProperty("autoCreate", true)
    // additional properties
    ;
```

---

## Transaction support

> ⚠️ Couchbase transactions are not currently managed automatically by Flamingock.  
> However, Flamingock guarantees safe, idempotent migrations through locking and auditing strategies.

---

---

## Spring Boot Integration

Flamingock for Couchbase also supports integration with Spring Boot applications. This makes it easy to configure the migration process using standard Spring configuration mechanisms and dependency injection.

### 1. Add dependencies

You will need to include the Flamingock Couchbase driver and the required Couchbase SDKs in your `build.gradle.kts` or `pom.xml`.

<Tabs groupId="build_tool">
<TabItem value="gradle" label="Gradle">

```kotlin
implementation("io.flamingock:flamingock-ce-couchbase:$flamingockVersion")
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

### 2. Configuration

Flamingock can be configured as a Spring bean. You can inject the `Cluster` and `Bucket` and pass them to the builder:

```java
@EnableMongock
@SpringBootApplication
public class CouchbaseApp {
    
  public static void main(String[] args) {
    SpringApplication.run(CouchbaseApp.class, args);
  }

@Configuration
public class FlamingockConfig {

    @Bean
    public Flamingock flamingock(Cluster cluster, Bucket bucket) {
        return Flamingock.builder()
                .addDependency(cluster)
                .setProperty("autoCreate", true)
                // other properties
                .build();
    }
}
```

---

### 3. Properties

You can also externalize configuration in your `application.yaml` or `application.properties` and load them dynamically to pass to Flamingock if needed.

