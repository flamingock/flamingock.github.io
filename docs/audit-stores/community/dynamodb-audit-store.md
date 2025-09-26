---
title: DynamoDB
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoDB Audit Store

The DynamoDB audit store (`DynamoSyncAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using Amazon DynamoDB as the storage backend.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../overview/audit-store-vs-target-system.md).

## Version Compatibility

| Component | Version Requirement |
|-----------|-------------------|
| AWS SDK DynamoDB Enhanced | 2.25.0+ |

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

Configure the audit store:

```java
var auditStore = new DynamoSyncAuditStore(dynamoDbClient);
```

The constructor requires the DynamoDB client. Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Audit Store Configuration

The DynamoDB audit store uses explicit configuration with no global context fallback.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at audit store creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `DynamoDbClient` | `dynamoDbClient` | AWS DynamoDB client - **required** for audit store configuration and data access |

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Audit store configuration (mandatory via constructor)
var auditStore = new DynamoSyncAuditStore(dynamoDbClient)
    .withReadCapacityUnits(10)     // Optional configuration
    .withWriteCapacityUnits(10);   // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **DynamoDbClient**: Must be provided via constructor
- **Capacity settings**: Uses explicit configuration via properties

This architecture ensures explicit audit store configuration with no fallback dependencies.


### Optional Configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `Read Capacity Units` | `.withReadCapacityUnits(units)` | `5` | Read capacity units (PROVISIONED mode only) |
| `Write Capacity Units` | `.withWriteCapacityUnits(units)` | `5` | Write capacity units (PROVISIONED mode only) |
| `Audit Repository Name` | `.withAuditRepositoryName(name)` | `flamingockAuditLogs` | Table name for audit entries |
| `Lock Repository Name` | `.withLockRepositoryName(name)` | `flamingockLock` | Table name for distributed locks |

⚠️ **Warning**: Adjust capacity units based on your workload. Under-provisioning may cause throttling.
Consider using **ON_DEMAND** billing mode for unpredictable workloads.


## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/dynamodb)