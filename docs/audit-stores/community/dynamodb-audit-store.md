---
title: DynamoDB
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoDB Audit Store

The DynamoDB audit store (`DynamoDBAuditStore`) provides Flamingock's required local state and coordination resources across distributed deployments using Amazon DynamoDB as the storage backend.

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

A `DynamoDBAuditStore` must be created from an existing `DynamoDBTargetSystem`.

This ensures that both components point to the **same external DynamoDB instance**:

- The **Target System** applies your business changes.
- The **Audit Store** retains the latest state Flamingock recorded per Change, including a latest failure or uncertain state.

Internally, the Audit Store reuses the `DynamoDbClient` supplied by the Target System while retaining responsibility for Flamingock audit operations.

> For a full conceptual explanation of this relationship, see
> **[Target Systems vs Audit Store](../../get-started/audit-store-vs-target-system.md)**.

## Required resources

This DynamoDB Audit Store requires three provider-local tables:

- an audit table for the latest Flamingock-recorded state per Change;
- a lock table for distributed coordination; and
- a journal table for required internal Journal Events.

Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration             | Method                             | Default                   | Description                                  |
|---------------------------|------------------------------------|---------------------------|----------------------------------------------|
| `Auto Create`             | `.withAutoCreate(enabled)`         | `true`                    | Auto-create table                            |
| `Read Capacity Units`     | `.withReadCapacityUnits(units)`    | `5`                       | Read capacity units (PROVISIONED mode only)  |
| `Write Capacity Units`    | `.withWriteCapacityUnits(units)`   | `5`                       | Write capacity units (PROVISIONED mode only) |
| `Audit Repository Name`   | `.withAuditRepositoryName(name)`   | `flamingockAuditLog`      | Table name for audit entries                 |
| `Lock Repository Name`    | `.withLockRepositoryName(name)`    | `flamingockLock`          | Table name for distributed locks             |
| `Journal Repository Name` | `.withJournalRepositoryName(name)` | `flamingockJournalEvents` | Table for required internal Journal Events   |

The default names are suitable only when the DynamoDB backend is dedicated to one application. When applications share an AWS account or DynamoDB service, configure unique audit, lock, and journal table names for each application. Separate AWS accounts, services, and connections are not required.

⚠️ **Warning**: Adjust capacity units based on your workload. Under-provisioning may cause throttling.
Consider using **ON_DEMAND** billing mode for unpredictable workloads.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Create a DynamoDB Target System
DynamoDBTargetSystem dynamoDBTargetSystem = new DynamoDBTargetSystem("dynamodb", dynamoDbClient);
// Audit store configuration (mandatory via constructor)
var auditStore = DynamoDBAuditStore.from(dynamoDBTargetSystem)
    .withAuditRepositoryName("ordersServiceAuditLog")
    .withLockRepositoryName("ordersServiceLock")
    .withJournalRepositoryName("ordersServiceJournal")
    .withReadCapacityUnits(10)     // Optional configuration
    .withWriteCapacityUnits(10);   // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **DynamoDBTargetSystem**: Must be provided via `from()` method. Gets `DynamoDbClient` from the target system.
- **Capacity settings**: Uses explicit configuration via properties

This architecture ensures explicit audit store configuration with no fallback dependencies.

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)
