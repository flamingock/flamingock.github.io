---
title: Couchbase
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Couchbase Audit Store

The Couchbase audit store (`CouchbaseAuditStore`) provides Flamingock's required local state and coordination resources across distributed deployments using Couchbase as the storage backend.

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

A `CouchbaseAuditStore` must be created from an existing `CouchbaseTargetSystem`.

This ensures that both components point to the **same external Couchbase bucket**:

- The **Target System** applies your business changes.
- The **Audit Store** retains the latest state Flamingock recorded per Change, including a latest failure or uncertain state.

Internally, the Audit Store takes the Target System’s connection settings (cluster + bucket name) and creates its **own dedicated access handle**, keeping audit operations isolated while still referring to the same physical system.

> For a full conceptual explanation of this relationship, see
> **[Target Systems vs Audit Store](../../get-started/audit-store-vs-target-system.md)**.

## Required resources

This Couchbase Audit Store requires three provider-local collections:

- an audit collection for the latest Flamingock-recorded state per Change;
- a lock collection for distributed coordination; and
- a journal collection for required internal Journal Events.

Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration             | Method                             | Default                   | Description                                   |
|---------------------------|------------------------------------|---------------------------|-----------------------------------------------|
| `Auto Create`             | `.withAutoCreate(enabled)`         | `true`                    | Auto-create collections and indexes           |
| `Scope Name`              | `.withScopeName(name)`             | `_default`                | Scope where audit collections will be created |
| `Audit Repository Name`   | `.withAuditRepositoryName(name)`   | `flamingockAuditLog`      | Collection name for audit entries             |
| `Lock Repository Name`    | `.withLockRepositoryName(name)`    | `flamingockLock`          | Collection name for distributed locks         |
| `Journal Repository Name` | `.withJournalRepositoryName(name)` | `flamingockJournalEvents` | Collection name for required Journal Events   |

The default names are suitable only when the Couchbase bucket is dedicated to one application. When applications share a bucket or cluster, configure unique audit, lock, and journal collection names for each application. Separate buckets, clusters, and connections are not required.

⚠️ **Warning**: Ensure your Couchbase user has permissions to create collections if `autoCreate` is enabled.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Create a Couchbase Target System
CouchbaseTargetSystem couchbaseTargetSystem = new CouchbaseTargetSystem("couchbase", cluster, "bucketName");
// Audit store configuration (mandatory via constructor)
var auditStore = CouchbaseAuditStore.from(couchbaseTargetSystem)
    .withScopeName("custom-scope")                 // Optional configuration
    .withAuditRepositoryName("ordersServiceAuditLog")
    .withLockRepositoryName("ordersServiceLock")
    .withJournalRepositoryName("ordersServiceJournalEvents")
    .withAutoCreate(true);                          // Optional configuration

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


## Collection management

When `autoCreate` is enabled (default), Flamingock creates the required collections and indexes, including the journal collection. When it is disabled, the required indexes are validated. Use unique collection names for every application when the bucket or cluster is shared.

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)
