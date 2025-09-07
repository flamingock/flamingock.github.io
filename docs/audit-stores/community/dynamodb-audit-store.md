---
title: DynamoDB
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoDB Audit Store

This page explains how to configure **Amazon DynamoDB** as Flamingock's audit store in the **Community Edition**.  
The audit store is where Flamingock records execution history and ensures safe coordination across distributed deployments.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../overview/audit-store-vs-target-system.md).

---

## Minimum setup

To use DynamoDB as your audit store you need to provide:  
- A **DynamoDbClient**

That's all. Flamingock will take care of tables, indexes, and capacity defaults.

Example:

```java
public class App {
  public static void main(String[] args) {
    DynamoDbClient client = DynamoDbClient.builder()
        .region(Region.US_EAST_1)
        .build();

    Flamingock.builder()
      .setAuditStore(new DynamoSyncAuditStore()
          .withClient(client))
      .build()
      .run();
  }
}
```

## Dependencies

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `DynamoDbClient` | `.withClient(client)` | AWS DynamoDB client - **required** |

## Reusing target system dependencies

If you're already using a DynamoDB target system, you can reuse its dependencies to avoid duplicating connection configuration:

```java
// Reuse dependencies from existing target system
DynamoDBTargetSystem dynamoTargetSystem = new DynamoDBTargetSystem("inventory-database")
    .withDynamoDBClient(dynamoDbClient);

// Create audit store reusing the same dependencies
DynamoSyncAuditStore auditStore = DynamoSyncAuditStore
    .reusingDependenciesFrom(dynamoTargetSystem);

Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(dynamoTargetSystem)
    .build()
    .run();
```

---

## Supported versions

| AWS SDK                        | DynamoDB       | Support level   |
|--------------------------------|----------------|-----------------|
| `dynamodb` 2.25.29+            | All versions   | Full support    |

---

## Dependencies

<Tabs groupId="build_tool">

<TabItem value="gradle" label="Gradle">

```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-community")

// AWS SDK (if not already present)
implementation("software.amazon.awssdk:dynamodb:2.28.0")
implementation("software.amazon.awssdk:dynamodb-enhanced:2.28.0")
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

<!-- AWS SDK (if not already present) -->
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>dynamodb</artifactId>
  <version>2.28.0</version>
</dependency>
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>dynamodb-enhanced</artifactId>
  <version>2.28.0</version>
</dependency>
```

</TabItem>

</Tabs>

---

## Configuration options

DynamoDB audit store works out of the box with production-ready defaults.  
Optional properties let you tune behavior if needed:

| Property                        | Default                | Description                                                     |
|---------------------------------|------------------------|------------------------------------------------------------------|
| `dynamodb.autoCreate`           | `true`                 | Auto-create tables if they don't exist.                         |
| `dynamodb.readCapacityUnits`   | `5`                    | Read capacity units (PROVISIONED mode only).                    |
| `dynamodb.writeCapacityUnits`  | `5`                    | Write capacity units (PROVISIONED mode only).                   |
| `dynamodb.auditRepositoryName` | `flamingockAuditLogs`  | Table name for audit entries.                                   |
| `dynamodb.lockRepositoryName`  | `flamingockLocks`      | Table name for distributed locks.                               |

Example overriding defaults:

```java
Flamingock.builder()
  .setAuditStore(new DynamoSyncAuditStore()
      .withClient(client)
      .withProperty("dynamodb.readCapacityUnits", 10)
      .withProperty("dynamodb.writeCapacityUnits", 10))
  .build()
  .run();
```

⚠️ **Warning**: Adjust capacity units based on your workload. Under-provisioning may cause throttling.  
Consider using **ON_DEMAND** billing mode for unpredictable workloads.

---

## Next steps

- Learn about [Target systems](../flamingock-library-config/target-system-configuration.md)  
- 👉 See a [full example project](https://github.com/flamingock/flamingock-examples/tree/master/dynamodb)