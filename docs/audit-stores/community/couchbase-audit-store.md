---
title: Couchbase
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Couchbase Audit Store

This page explains how to configure **Couchbase** as Flamingock's audit store in the **Community Edition**.  
The audit store is where Flamingock records execution history and ensures safe coordination across distributed deployments.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../overview/audit-store-vs-target-system.md).


## Minimum setup

To use Couchbase as your audit store you need to provide:  
- A **Cluster**
- A **Bucket**

That's all. Flamingock will take care of collections, indexes, and scope defaults.

Example:

```java
public class App {
  public static void main(String[] args) {
    Cluster cluster = Cluster.connect("localhost", "username", "password");
    Bucket bucket = cluster.bucket("audit-bucket");
    
    Flamingock.builder()
      .setAuditStore(new CouchbaseSyncAuditStore()
          .withCluster(cluster)
          .withBucket(bucket))
      .build()
      .run();
  }
}
```

## Dependencies

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `Cluster` | `.withCluster(cluster)` | Couchbase cluster connection - **required** |
| `Bucket` | `.withBucket(bucket)` | Target bucket instance - **required** |

## Reusing target system dependencies

If you're already using a Couchbase target system, you can reuse its dependencies to avoid duplicating connection configuration:

```java
// Reuse dependencies from existing target system
CouchbaseTargetSystem couchbaseTargetSystem = new CouchbaseTargetSystem("user-database")
    .withCluster(cluster)
    .withBucket(bucket);

// Create audit store reusing the same dependencies
CouchbaseSyncAuditStore auditStore = CouchbaseSyncAuditStore
    .reusingDependenciesFrom(couchbaseTargetSystem);

Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(couchbaseTargetSystem)
    .build()
    .run();
```


## Supported versions

| Couchbase SDK                  | Couchbase Server | Support level   |
|--------------------------------|------------------|-----------------|
| `java-client` 3.6.0+           | 7.0+             | Full support    |


## Dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community")

// Couchbase SDK (if not already present)
implementation("com.couchbase.client:java-client:3.7.0")
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

<!-- Couchbase SDK (if not already present) -->
<dependency>
  <groupId>com.couchbase.client</groupId>
  <artifactId>java-client</artifactId>
  <version>3.7.0</version>
</dependency>
```

</TabItem>

</Tabs>


## Configuration options

Couchbase audit store works out of the box with production-ready defaults.  
Optional properties let you tune behavior if needed:

| Property                        | Default                | Description                                           |
|---------------------------------|------------------------|-------------------------------------------------------|
| `couchbase.autoCreate`          | `true`                 | Auto-create collections and indexes.                  |
| `couchbase.scopeName`           | `_default`             | Scope where audit collections will be created.        |
| `couchbase.auditRepositoryName` | `flamingockAuditLogs`  | Collection name for audit entries.                    |
| `couchbase.lockRepositoryName`  | `flamingockLocks`      | Collection name for distributed locks.                |

Example overriding defaults:

```java
Flamingock.builder()
  .setAuditStore(new CouchbaseSyncAuditStore()
      .withCluster(cluster)
      .withBucket(bucket)
      .withProperty("couchbase.scopeName", "custom-scope")
      .withProperty("couchbase.autoCreate", true))
  .build()
  .run();
```

⚠️ **Warning**: Ensure your Couchbase user has permissions to create collections if `autoCreate` is enabled.


## Next steps

- Learn about [Target systems](../flamingock-library-config/target-system-configuration.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)