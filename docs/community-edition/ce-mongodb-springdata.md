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

Flamingock Community Edition for MongoDB with Spring Data supports two ways to integrate with your application:

- **Autoconfigured (recommended)** using `@EnableFlamingock` — the easiest and most common option in **Spring Boot** projects
- **Manual builder-based setup** — for **non-Spring Boot** applications or when you need full programmatic control

---

### Option 1: EnableFlamingock (Spring Boot)

If you are using Spring Boot, the recommended approach is to use `@EnableFlamingock`, which enables Flamingock through autoconfiguration.

#### 1. Add the required dependencies

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

#### 2. Enable Flamingock

```java
@EnableFlamingock
@SpringBootApplication
public class MyApp {
  public static void main(String[] args) {
    SpringApplication.run(MyApp.class, args);
  }
}
```

#### 3. Configure Flamingock

In your `application.yml`:

```yaml
flamingock:
  mongodb:
    auditRepositoryName: flamingockAuditLogs
    lockRepositoryName: flamingockLock
    autoCreate: true
    readConcern: MAJORITY
    writeConcern:
      w: MAJORITY
      journal: true
      wTimeout: 1s
    readPreference: PRIMARY
```

---

### Option 2: Manual builder (non-Spring Boot or advanced setups)

If you're not using Spring Boot, or need full control over the configuration, use the builder API.

#### 1. Add the required dependency

<Tabs groupId="build_builder">
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

#### 2. Configure Flamingock with MongoTemplate

```java
@Configuration
public class FlamingockConfig {

  @Bean
  public ApplicationRunner flamingockRunner(MongoTemplate mongoTemplate,
                                            ApplicationContext applicationContext,
                                            ApplicationEventPublisher applicationEventPublisher) {

    FlamingockBuilder builder = Flamingock.builder()
      // mandatory configuration
      .addDependency(mongoTemplate)
      .addDependency(applicationContext)
      .addDependency(applicationEventPublisher)
      // optional configuration (with default values)
      .setProperty("mongodb.auditRepositoryName", "flamingockAuditLogs")
      .setProperty("mongodb.lockRepositoryName", "flamingockLock")
      .setProperty("mongodb.autoCreate", true)
      .setProperty("mongodb.readConcern", "MAJORITY")
      .setProperty("mongodb.writeConcern.w", "MAJORITY")
      .setProperty("mongodb.writeConcern.journal", true)
      .setProperty("mongodb.writeConcern.wTimeout", Duration.ofSeconds(1))
      .setProperty("mongodb.readPreference", ReadPreferenceLevel.PRIMARY)
      // other common configurations
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
| `mongodb.auditRepositoryName`  | `String`                 | `"flamingockAuditLogs"`                   | Name of the collection used to store applied changes                  |
| `mongodb.lockRepositoryName`   | `String`                 | `"flamingockLock"`                        | Name of the collection used for distributed locking                   |
| `mongodb.autoCreate`           | `boolean`                | `true`                                    | Whether Flamingock should automatically create required collections and indexes       |
| `mongodb.readConcern`          | `String`                 | `"MAJORITY"`                              | Controls the level of isolation for read operations                   |
| `mongodb.writeConcern.w`       | `String or int`          | `"MAJORITY"`                              | Write acknowledgement. Specifies the number of nodes that must acknowledge the write before it's considered successful.|
| `mongodb.writeConcern.journal` | `boolean`                | `true`                                    | Specifies whether the write must be written to the on-disk journal before acknowledgment.|
| `mongodb.writeConcern.wTimeout`| `Duration`               | `Duration.ofSeconds(1)`                   | Sets the maximum time (in milliseconds) to wait for the write concern to be fulfilled.|
| `mongodb.readPreference`       | `ReadPreferenceLevel`    | `ReadPreferenceLevel.PRIMARY`             | Specifies which MongoDB node to read from                             |

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

