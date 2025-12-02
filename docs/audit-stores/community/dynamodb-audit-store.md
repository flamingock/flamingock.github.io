---
title: DynamoDB
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoDB Audit Store

The DynamoDB audit store (`DynamoSyncAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using Amazon DynamoDB as the storage backend.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../get-started/audit-store-vs-target-system.md).

## Version compatibility

| Component                 | Version Requirement |
|---------------------------|---------------------|
| AWS SDK DynamoDB Enhanced | 2.25.0+             |

AWS SDK DynamoDB Enhanced 2.25.0+ is required and must be included in your project dependencies.

## Installation

Add the AWS SDK DynamoDB Enhanced dependency to your project:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("software.amazon.awssdk:dynamodb-enhanced:2.28.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb-enhanced</artifactId>
    <version>2.28.0</version> <!-- 2.25.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the audit store using a DynamoDB Target System to get the connection configuration:

```java
var auditStore = DynamoDBAuditStore.from(dynamoDBTargetSystem);
```

Creating a DynamoDB Audit Store requires a valid `DynamoDBTargetSystem`.

This is because the Audit Store **reuses the DynamoClient** defined in the Target System to establish its connection. By building from the Target System, Flamingock avoids duplicate configuration and ensures the Audit Store resides in the same physical environment as your data.

However, while they share the connection resources, their roles remain distinct:
- The **Target System** is used to apply your business changes.
- The **Audit Store** uses the connection exclusively to read and write execution history.

For a deeper explanation of this relationship, see [Target Systems vs Audit Store](../../get-started/audit-store-vs-target-system.md).
For specific configuration details, see [DynamoDB Target Systems](../../target-systems/dynamodb-target-system.md).

Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration           | Method                           | Default              | Description                                  |
|-------------------------|----------------------------------|----------------------|----------------------------------------------|
| `Auto Create`           | `.withAutoCreate(enabled)`       | `true`               | Auto-create table                            |
| `Read Capacity Units`   | `.withReadCapacityUnits(units)`  | `5`                  | Read capacity units (PROVISIONED mode only)  |
| `Write Capacity Units`  | `.withWriteCapacityUnits(units)` | `5`                  | Write capacity units (PROVISIONED mode only) |
| `Audit Repository Name` | `.withAuditRepositoryName(name)` | `flamingockAuditLog` | Table name for audit entries                 |
| `Lock Repository Name`  | `.withLockRepositoryName(name)`  | `flamingockLock`     | Table name for distributed locks             |

⚠️ **Warning**: Adjust capacity units based on your workload. Under-provisioning may cause throttling.
Consider using **ON_DEMAND** billing mode for unpredictable workloads.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Create a DynamodDB Target System
DynamodDBTargetSystem dynamoDBTargetSystem = new DynamodDBTargetSystem("dynamodb", dynamoDbClient);
// Audit store configuration (mandatory via constructor)
var auditStore = DynamoSyncAuditStore.from(dynamoDBTargetSystem)
    .withReadCapacityUnits(10)     // Optional configuration
    .withWriteCapacityUnits(10);   // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **DynamoDBTargetSystem**: Must be provided via `from()` method. Gets `DynamoClient` from the target system.
- **Capacity settings**: Uses explicit configuration via properties

This architecture ensures explicit audit store configuration with no fallback dependencies.

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)
