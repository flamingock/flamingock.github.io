---
title: MongoDB (Spring Data)
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This section explains how to use the **Flamingock Community Edition for MongoDB** in applications that rely on **Spring Data MongoDB**.

This edition is designed for teams that already use Spring Data to manage their database access, and wish to incorporate Flamingock as part of their change tracking and migration process. Flamingock integrates seamlessly with Spring Boot and Spring Data to manage changes, provide auditing, and ensure safe execution across multiple service instances.

---

## Editions

Flamingock provides three specific editions for Spring Data MongoDB, depending on the version of **Spring Data** used in your application. Each edition is aligned with the underlying MongoDB Java driver supported by that Spring Data version.

| Edition Name                           | Spring Data Version | MongoDB Driver Version | MongoDB Compatibility |
|----------------------------------------|----------------------|------------------------|------------------------|
| `flamingock-ce-mongodb-springdata-v2`  | 2.x                  | 3.x                    | MongoDB 3.x            |
| `flamingock-ce-mongodb-springdata-v3`  | 3.x                  | 4.x                    | MongoDB 4.x            |
| `flamingock-ce-mongodb-springdata-v4`  | 4.x                  | 4.x                    | MongoDB 4.x+           |

Select the edition that matches the version of Spring Data MongoDB used in your project.

:::info JDK compatibility
The `flamingock-ce-mongodb-springdata-v4` edition requires **JDK 17 or higher**, as it is aligned with the Spring Data 4.x and Spring Boot 3.x ecosystems.
:::


---

## Basic usage

To use the Flamingock Community Edition for MongoDB with Spring Data, the recommended and framework-agnostic setup is to configure Flamingock manually using the **builder API**.

This approach is compatible with any Spring-based application that uses **MongoTemplate**, including Spring Boot and non-Boot environments.

---

### 1. Add the required dependency

Add the Flamingock Spring Data edition corresponding to your Spring Data version:

<Tabs groupId="build">
<TabItem value="gradle" label="Gradle">

```kotlin
implementation("io.flamingock:flamingock-ce-mongodb-springdata-v4:$flamingockVersion")
```

</TabItem>
<TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-ce-mongodb-springdata-v4</artifactId>
  <version>${flamingock.version}</version>
</dependency>
```

</TabItem>
</Tabs>

---

### 2. Configure Flamingock using the builder

Use `MongoTemplate` and configure Flamingock manually:

```java
@Configuration
public class FlamingockConfig {

  @Bean
  public ApplicationRunner flamingockRunner(MongoTemplate mongoTemplate,
                                            ApplicationContext applicationContext,
                                            ApplicationEventPublisher applicationEventPublisher) {

    FlamingockBuilder builder = Flamingock.builder()
      .addDependency(mongoTemplate)
      .addDependency(applicationContext)
      .addDependency(applicationEventPublisher)
      // other configuration properties
      ;

    return SpringbootUtil.toApplicationRunner(builder.build());
  }
}
```

---

## Configuration overview

The following table lists the configuration properties supported by Flamingock Community Edition for MongoDB with Spring Data. These can be defined using `.setProperty(...)` or via external configuration if using Spring Boot.

| Property                        | Type      | Default Value           | Description                                                                 |
|---------------------------------|-----------|--------------------------|-----------------------------------------------------------------------------|
| `mongodb.auditRepositoryName`   | `String`  | `"flamingockEntries"`    | Name of the collection used to store applied changes                        |
| `mongodb.lockRepositoryName`    | `String`  | `"flamingockLock"`       | Name of the collection used for distributed locking                         |
| `mongodb.autoCreate`            | `boolean` | `true`                   | Whether Flamingock should auto-create collections and indexes               |
| `mongodb.readConcern`           | `String`  | `"MAJORITY"`             | Read isolation level                                                        |
| `mongodb.writeConcern.w`        | `String`  | `"MAJORITY"`             | Write acknowledgment level                                                  |
| `mongodb.writeConcern.journal`  | `boolean` | `true`                   | Whether writes must be journaled before acknowledgment                      |
| `mongodb.writeConcern.wTimeout` | `String`  |                          | Max wait time (ms) for the write concern to be fulfilled                    |
| `mongodb.readPreference`        | `String`  | `"PRIMARY"`              | Preferred MongoDB node for reading                                          |

---

## Transaction support

Flamingock supports transactional execution in Spring Data MongoDB when your MongoDB instance allows it.

```java
@Execution
public void change(MongoTemplate mongoTemplate) {
    // use template with transaction support (managed by Flamingock)
}
```

---

## Examples

You can find practical examples in the official GitHub repository:  
👉 [github.com/flamingock/flamingock-examples/mongodb](https://github.com/flamingock/flamingock-examples/mongodb)

