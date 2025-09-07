---
title: MongoDB
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Audit Store

This page explains how to configure **MongoDB** as Flamingock’s audit store in the **Community Edition**.  
The audit store is where Flamingock records execution history and ensures safe coordination across distributed deployments.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../overview/audit-store-vs-target-system.md).

---

## Minimum setup

To use MongoDB as your audit store you need to provide:  
- A **MongoClient**  
- A **MongoDatabase**

That's all. Flamingock will take care of collections, indexes, and consistency defaults.  

Example:

```java
public class App {
  public static void main(String[] args) {
    MongoClient client = MongoClients.create("mongodb://localhost:27017");
    MongoDatabase db = client.getDatabase("flamingock_audit");

    Flamingock.builder()
      .setAuditStore(new MongoSyncAuditStore()
          .withMongoClient(client)
          .withDatabase(db))
      .build()
      .run();
  }
}
```

## Dependencies

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoClient` | `.withMongoClient(client)` | MongoDB connection client - **required** |
| `MongoDatabase` | `.withDatabase(database)` | Target database instance - **required** |

### Optional configurations

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |

## Reusing target system dependencies

If you're already using a MongoDB target system, you can reuse its dependencies to avoid duplicating connection configuration:

```java
// Reuse dependencies from existing target system
MongoSyncTargetSystem mongoTargetSystem = new MongoSyncTargetSystem("user-database")
    .withMongoClient(client)
    .withDatabase(userDatabase);

// Create audit store reusing the same dependencies
MongoSyncAuditStore auditStore = MongoSyncAuditStore
    .reusingDependenciesFrom(mongoTargetSystem);

Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(mongoTargetSystem)
    .build()
    .run();
```

You can still override specific settings if needed:

```java
MongoSyncAuditStore auditStore = MongoSyncAuditStore
    .reusingDependenciesFrom(mongoTargetSystem)
    .withReadConcern(ReadConcern.LOCAL);
```

---

## Supported versions

| MongoDB Driver                 | MongoDB Server | Support level   |
|--------------------------------|----------------|-----------------|
| `mongodb-driver-sync` 4.0–5.x | 3.6 – 7.0      | Full support    |
| `mongodb-driver-sync` 3.12.x  | 3.4 – 4.4      | Legacy support  |

---

## Dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community")

// MongoDB driver (if not already present)
implementation("org.mongodb:mongodb-driver-sync:5.2.0")
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

<!-- MongoDB driver (if not already present) -->
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-driver-sync</artifactId>
  <version>5.2.0</version>
</dependency>
```

</TabItem>

</Tabs>

---

## Configuration options

MongoDB audit store works out of the box with production-ready defaults.  
Optional properties let you tune behavior if needed:

| Property                        | Default        | Description                                                                 |
|---------------------------------|----------------|-----------------------------------------------------------------------------|
| `mongodb.autoCreate`            | `true`         | Auto-create collections and indexes.                                        |
| `mongodb.readConcern`           | `MAJORITY`     | Read isolation level.                                                       |
| `mongodb.writeConcern.w`        | `MAJORITY`     | Write acknowledgment level.                                                 |
| `mongodb.writeConcern.journal`  | `true`         | Requires journal commit for durability.                                     |
| `mongodb.writeConcern.wTimeout` | `1s`           | Max wait time for write concern fulfillment.                                |
| `mongodb.readPreference`        | `PRIMARY`      | Node selection for reads.                                                   |
| `mongodb.auditRepositoryName`   | `flamingockAuditLogs` | Collection name for audit entries.                                   |
| `mongodb.lockRepositoryName`    | `flamingockLocks`     | Collection name for distributed locks.                               |

Example overriding defaults:

```java
Flamingock.builder()
  .setAuditStore(new MongoSyncAuditStore()
      .withClient(client)
      .withDatabase(db)
      .withProperty("mongodb.readConcern", "LOCAL")
      .withProperty("mongodb.writeConcern.w", 1))
  .build()
  .run();
```

⚠️ **Warning**: lowering concerns (e.g. `LOCAL`, `w=1`) increases performance but reduces safety.  
Recommended only for dev/test environments.

---

## Next steps

- Learn about [Target systems](../targetsystems/configuration.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)  
