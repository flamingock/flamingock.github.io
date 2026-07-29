---
title: MongoDB Reactive
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Reactive Audit Store

The MongoDB reactive audit store (`MongoDBReactiveAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using MongoDB as the storage backend, through the official MongoDB reactive streams driver.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../get-started/audit-store-vs-target-system.md).

## Version compatibility

| Component                       | Version Requirement |
|----------------------------------|---------------------|
| MongoDB Reactive Streams Driver | 4.0.0+              |

MongoDB 4.0+ is recommended for optimal performance and feature support.

## Installation

Add the MongoDB reactive streams driver dependency to your project:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.mongodb:mongodb-driver-reactivestreams:4.0.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-reactivestreams</artifactId>
    <version>4.0.0</version> <!-- 4.0.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the audit store from a MongoDB reactive target system to get the connection configuration:

```java
var auditStore = MongoDBReactiveAuditStore.from(mongoDbReactiveTargetSystem);
```

A `MongoDBReactiveAuditStore` must be created from an existing target system that implements `MongoDBReactiveExternalSystem` - such as `MongoDBReactiveTargetSystem` or `MongoDBSpringDataReactiveTargetSystem`.

This ensures that both components point to the **same external MongoDB database**:

- The **Target System** applies your business changes.
- The **Audit Store** stores the execution history associated with those changes.

Internally, the Audit Store takes the Target System's underlying MongoDB database and creates its **own dedicated access handle**, keeping audit operations isolated while still referring to the same physical system.

> For a full conceptual explanation of this relationship, see
> **[Target Systems vs Audit Store](../../get-started/audit-store-vs-target-system.md)**.

Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration           | Method                           | Default                 | Description                           |
|--------------------------|-----------------------------------|--------------------------|-----------------------------------------|
| `Auto Create`           | `.withAutoCreate(enabled)`       | `true`                  | Auto-create collections and indexes   |
| `WriteConcern`          | `.withWriteConcern(concern)`     | `MAJORITY` with journal | Write acknowledgment level            |
| `ReadConcern`           | `.withReadConcern(concern)`      | `MAJORITY`              | Read isolation level                  |
| `ReadPreference`        | `.withReadPreference(pref)`      | `PRIMARY`               | Server selection for reads            |
| `Audit Repository Name` | `.withAuditRepositoryName(name)` | `flamingockAuditLog`    | Collection name for audit entries     |
| `Lock Repository Name`  | `.withLockRepositoryName(name)`  | `flamingockLock`        | Collection name for distributed locks |

**Important**: These default values are optimized for maximum consistency and should ideally be left unchanged. Override them only for testing purposes or exceptional cases.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Create a MongoDB Reactive Target System
MongoDBReactiveTargetSystem mongoDbReactiveTargetSystem = new MongoDBReactiveTargetSystem("mongodb", mongoReactiveClient, auditDatabase);
// Audit store configuration (mandatory via constructor)
var auditStore = MongoDBReactiveAuditStore.from(mongoDbReactiveTargetSystem)
    .withWriteConcern(WriteConcern.W1)         // Optional configuration
    .withReadPreference(ReadPreference.secondary());  // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **MongoDB reactive target system**: Must be provided via `from()` method. Gets the reactive `MongoDatabase` from the target system.
- **WriteConcern**: Uses explicit configuration instead of default
- **ReadPreference**: Uses explicit configuration instead of default

This architecture ensures explicit audit store configuration with no fallback dependencies.

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)
