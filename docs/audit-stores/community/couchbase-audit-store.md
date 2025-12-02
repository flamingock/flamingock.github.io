---
title: Couchbase
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Couchbase Audit Store

The Couchbase audit store (`CouchbaseSyncAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using Couchbase as the storage backend.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../get-started/audit-store-vs-target-system.md).

## Version compatibility

| Component             | Version Requirement |
|-----------------------|---------------------|
| Couchbase Java Client | 3.6.0+              |

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

Configure the audit store using a Couchbase Target System to get the connection configuration:

```java
var auditStore = CouchbaseAuditStore.from(couchbaseTargetSystem);
```

Creating an Audit Store requires a valid CouchbaseTargetSystem to get Couchbase cluster and bucket. For more info about Couchbase Target Systems, see [Couchbase Target Systems](../../target-systems/couchbase-target-system.md).

Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration           | Method                           | Default              | Description                                   |
|-------------------------|----------------------------------|----------------------|-----------------------------------------------|
| `Auto Create`           | `.withAutoCreate(enabled)`       | `true`               | Auto-create collections and indexes           |
| `Scope Name`            | `.withScopeName(name)`           | `_default`           | Scope where audit collections will be created |
| `Audit Repository Name` | `.withAuditRepositoryName(name)` | `flamingockAuditLog` | Collection name for audit entries             |
| `Lock Repository Name`  | `.withLockRepositoryName(name)`  | `flamingockLock`     | Collection name for distributed locks         |

⚠️ **Warning**: Ensure your Couchbase user has permissions to create collections if `autoCreate` is enabled.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Create a Couchbase Target System
CouchbaseTargetSystem couchbaseTargetSystem = new CouchbaseTargetSystem("couchbase", cluster, bucket);
// Audit store configuration (mandatory via constructor)
var auditStore = CouchbaseSyncAuditStore.from(couchbaseTargetSystem)
    .withScopeName("custom-scope")     // Optional configuration
    .withAutoCreate(true);             // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **CouchbaseTargetSystem**: Must be provided via `from()` method. Gets `Cluster` and `BucketName` from the target system.
- **Scope settings**: Uses explicit configuration via properties

This architecture ensures explicit audit store configuration with no fallback dependencies.

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)
