---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Audit stores

The audit store is Flamingock's dedicated system for tracking execution history, preventing duplicate executions, and ensuring safe system evolution.

## What is the audit store?

The audit store tracks:
- **Execution history**: Which Changes ran, when, and with what outcome
- **Distributed locking**: Prevents concurrent executions across multiple instances
- **Issue tracking**: Failed or uncertain executions requiring resolution

### Relationship with Target Systems
Although they serve different purposes, the Audit Store is **built directly from a Target System**.

This means it **reuses the same underlying connection and driver** (e.g., the same MongoDB client or Couchbase cluster) to store its metadata. However, it uses a separate internal handle to ensure that audit data remains logically isolated from your business data.

Unlike target systems (which your code modifies), the audit store is managed automatically by Flamingock and never modified by your Changes.

> **Conceptual overview**: For architectural understanding, see [Target systems vs audit store](../get-started/audit-store-vs-target-system.md)


## Cloud audit store
The audit store is **automatically provided and managed** by Flamingock Cloud. No configuration needed - just focus on your changes while Flamingock handles the audit infrastructure.

## Community audit store
Alternatively, you can configure your own audit store using one of the supported databases:

- [MongoDB audit store](./community/mongodb-audit-store.md)
- [DynamoDB audit store](./community/dynamodb-audit-store.md)
- [Couchbase audit store](./community/couchbase-audit-store.md)
- [SQL audit store](./community/sql-audit-store.md)

### Repository isolation

Multiple applications can share the same physical Community Audit Store backend, such as a database, cluster, or service. Each application **must** use its own audit and lock repositories so its execution history and distributed locks remain isolated.

A repository is provider-specific metadata storage: tables for SQL and DynamoDB, and collections for MongoDB and Couchbase. It does not require separate databases, clusters, or connections. The default repository names are appropriate only when the backend is dedicated to one application; configure unique application-specific names when the backend is shared.

This configuration applies only to Community Audit Stores. Flamingock Cloud manages its audit store and repositories for you.


### Registering the Community audit store

<Tabs groupId="registration">
  <TabItem value="builder" label="Flamingock Builder" default>
Register the audit store with the Flamingock builder:

```java
// Generic example - audit store configuration
public class App {
  public static void main(String[] args) {

    // TargetSystem
    var targetSystem = new MongoDBSyncTargetSystem("mongodb-ts", mongoClient, "dbName");

    // Create your audit store connection
    var auditStore = MongoDBSyncAuditStore.from(targetSystem)
        .withAuditRepositoryName("ordersServiceAuditLog")
        .withLockRepositoryName("ordersServiceLock");

    // Register with Flamingock
    Flamingock.builder()
      .setAuditStore(auditStore)  // Set the audit store
      .addTargetSystems(targetSystem)
      .build()
      .run();
  }
}
```
  </TabItem>
  <TabItem value="springboot" label="Spring Boot">

For Spring Boot applications, register audit stores as beans:

```java
@Bean
public AuditStore auditStore(MongoDBSyncTargetSystem mongoDBSyncTargetSystem) {
    return MongoDBSyncAuditStore.from(mongoDBSyncTargetSystem)
        .withAuditRepositoryName("ordersServiceAuditLog")
        .withLockRepositoryName("ordersServiceLock");
}

// Flamingock Spring Boot auto-configuration will pick this up automatically
```

Spring Boot's auto-configuration will automatically register these audit stores with Flamingock.

For more details, see [Spring Boot Integration](../frameworks/springboot-integration/introduction.md).

  </TabItem>
</Tabs>
