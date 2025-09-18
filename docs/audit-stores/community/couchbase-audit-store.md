---
title: Couchbase
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Couchbase Audit Store

The Couchbase audit store (`CouchbaseSyncAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using Couchbase as the storage backend.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../overview/audit-store-vs-target-system.md).

## Version Compatibility

| Component | Version Requirement |
|-----------|-------------------|
| Couchbase Java Client | 3.6.0+ |

Couchbase Java Client 3.6.0+ is required and must be included in your project dependencies.

## Installation

Add the Couchbase Java Client dependency to your project:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("com.couchbase.client:java-client:3.7.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>com.couchbase.client</groupId>
    <artifactId>java-client</artifactId>
    <version>3.7.0</version> <!-- 3.6.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the audit store:

```java
var auditStore = new CouchbaseSyncAuditStore("audit-store-id", cluster, bucket);
```

The constructor requires the audit store name, Couchbase cluster, and bucket. Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock using `.setAuditStore(auditStore)` in the builder.
:::

## Audit Store Configuration

The Couchbase audit store uses explicit configuration with no global context fallback.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at audit store creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `Cluster` | `cluster` | Couchbase cluster connection - **required** for audit store configuration |
| `Bucket` | `bucket` | Target bucket instance - **required** for storing audit data |

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Audit store configuration (mandatory via constructor)
var auditStore = new CouchbaseSyncAuditStore("audit-store-id", cluster, bucket)
    .withProperty("couchbase.scopeName", "custom-scope")     // Optional configuration
    .withProperty("couchbase.autoCreate", true);             // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **Cluster**: Must be provided via constructor
- **Bucket**: Must be provided via constructor
- **Scope settings**: Uses explicit configuration via properties

This architecture ensures explicit audit store configuration with no fallback dependencies.


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

- Learn about [Target systems](../../target-systems/introduction.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/couchbase)