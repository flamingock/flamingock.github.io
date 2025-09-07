---
title: MongoDB Spring Data
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Spring Data Audit Store

This page explains how to configure **MongoDB with Spring Data** as Flamingock's audit store in the **Community Edition**.  
The audit store is where Flamingock records execution history and ensures safe coordination across distributed deployments.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../overview/audit-store-vs-target-system.md).

---

## Minimum setup

To use MongoDB Spring Data as your audit store you need to provide:  
- A **MongoTemplate**

That's all. Flamingock will take care of collections, indexes, and consistency defaults.

Example:

```java
public class App {
  public static void main(String[] args) {
    // Assuming MongoTemplate is configured via Spring
    MongoTemplate mongoTemplate = // ... from Spring context
    
    Flamingock.builder()
      .setAuditStore(new MongoSpringDataAuditStore()
          .withMongoTemplate(mongoTemplate))
      .build()
      .run();
  }
}
```

## Dependencies

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoTemplate` | `.withMongoTemplate(template)` | Spring Data MongoDB template - **required** |

### Optional configurations

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |

## Reusing target system dependencies

If you're already using a MongoDB Spring Data target system, you can reuse its dependencies to avoid duplicating connection configuration:

```java
// Reuse dependencies from existing target system
MongoSpringDataTargetSystem mongoTargetSystem = new MongoSpringDataTargetSystem("user-database")
    .withMongoTemplate(mongoTemplate);

// Create audit store reusing the same dependencies
MongoSpringDataAuditStore auditStore = MongoSpringDataAuditStore
    .reusingDependenciesFrom(mongoTargetSystem);

Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(mongoTargetSystem)
    .build()
    .run();
```

You can still override specific settings if needed:

```java
MongoSpringDataAuditStore auditStore = MongoSpringDataAuditStore
    .reusingDependenciesFrom(mongoTargetSystem)
    .withReadConcern(ReadConcern.LOCAL);
```

---

## Supported versions

Flamingock provides two editions for different Spring Data MongoDB versions:

| Edition                                       | Spring Data MongoDB | JDK Required | Support level  |
|-----------------------------------------------|---------------------|--------------|----------------|
| `flamingock-community` (standard)            | 4.0.0 - 5.x         | 17+          | Full support   |
| `flamingock-community` (with legacy flag)    | 3.1.4 - 3.x         | 8-11         | Legacy support |

Choose the edition that matches your Spring Data MongoDB and JDK version.

---

## Dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community")

// Spring Data MongoDB (if not already present)
implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
```

</TabItem>

<TabItem value="maven" label="Maven">

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>io.flamingock</groupId>
      <artifactId>flamingock-community-bom</artifactId>
      <version>${flamingock.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-community</artifactId>
</dependency>

<!-- Spring Data MongoDB (if not already present) -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

</TabItem>

</Tabs>

---

## Configuration options

MongoDB Spring Data audit store works out of the box with production-ready defaults.  
Optional properties let you tune behavior if needed:

| Property                        | Default                | Description                                               |
|---------------------------------|------------------------|-----------------------------------------------------------|
| `mongodb.autoCreate`            | `true`                 | Auto-create collections and indexes.                      |
| `mongodb.readConcern`           | `MAJORITY`             | Read isolation level.                                     |
| `mongodb.writeConcern.w`        | `MAJORITY`             | Write acknowledgment level.                               |
| `mongodb.writeConcern.journal`  | `true`                 | Requires journal commit for durability.                   |
| `mongodb.writeConcern.wTimeout` | `1s`                   | Max wait time for write concern fulfillment.              |
| `mongodb.readPreference`        | `PRIMARY`              | Node selection for reads.                                 |
| `mongodb.auditRepositoryName`   | `flamingockAuditLogs`  | Collection name for audit entries.                        |
| `mongodb.lockRepositoryName`    | `flamingockLocks`      | Collection name for distributed locks.                    |

Example with Spring Boot configuration:

```yaml
# application.yml
flamingock:
  mongodb:
    autoCreate: true
    readConcern: MAJORITY
    writeConcern:
      w: MAJORITY
      journal: true
      wTimeout: 1s
```

Or programmatically:

```java
Flamingock.builder()
  .setAuditStore(new MongoSpringDataAuditStore()
      .withMongoTemplate(mongoTemplate)
      .withProperty("mongodb.readConcern", "LOCAL")
      .withProperty("mongodb.writeConcern.w", 1))
  .build()
  .run();
```

⚠️ **Warning**: lowering concerns (e.g. `LOCAL`, `w=1`) increases performance but reduces safety.  
Recommended only for dev/test environments.

---

## Spring Boot integration

For Spring Boot applications, use `@EnableFlamingock` for automatic configuration:

```java
@EnableFlamingock
@SpringBootApplication
public class MyApp {
  public static void main(String[] args) {
    SpringApplication.run(MyApp.class, args);
  }
}
```

Spring Boot will automatically:
- Detect and use your configured `MongoTemplate`
- Apply configuration from `application.yml`
- Set up the audit store

---

## Next steps

- Learn about [Target systems](../flamingock-library-config/target-system-configuration.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/mongodb-springdata)