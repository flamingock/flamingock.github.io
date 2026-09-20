---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Audit stores

The Audit Store keeps one mutable current-state record per Change, updated with the latest state Flamingock recorded. This helps Flamingock prevent duplicate executions and evolve systems safely.

## Architecture from `<VERSION>`

| Resource         | Role                                                                           |
|------------------|--------------------------------------------------------------------------------|
| Audit resource   | Keeps one mutable current-state record per Change.                             |
| Lock resource    | Coordinates distributed execution.                                             |
| Journal resource | Captures internal transition events for synchronization with Flamingock Cloud. |

This architecture applies from `<VERSION>`.

### Relationship with Target Systems
Although they serve different purposes, the Audit Store is **built directly from a Target System**.

This means it **reuses the same underlying connection and driver** (e.g., the same MongoDB client or Couchbase cluster) to store its metadata. However, it uses a separate internal handle to ensure that audit data remains logically isolated from your business data.

Unlike target systems (which your code modifies), the audit store is managed automatically by Flamingock and never modified by your Changes.

> **Conceptual overview**: For architectural understanding, see [Target systems vs audit store](../get-started/audit-store-vs-target-system.md)


## Required local Audit Store resources
Every edition retains local Audit, lock, and journal resources. Community users configure those resources with one of the supported databases:

- [MongoDB audit store](./community/mongodb-audit-store.md)
- [DynamoDB audit store](./community/dynamodb-audit-store.md)
- [Couchbase audit store](./community/couchbase-audit-store.md)
- [SQL audit store](./community/sql-audit-store.md)

### Repository isolation

Multiple applications can share the same physical Community Audit Store backend, such as a database, cluster, or service. Each application **must** use its own audit, lock, and journal resources so its Flamingock state and coordination remain isolated.

A repository is provider-specific metadata storage: tables for SQL and DynamoDB, and collections for MongoDB and Couchbase. It does not require separate databases, clusters, or connections. The default repository names are appropriate only when the backend is dedicated to one application; configure unique application-specific names for all three resources when the backend is shared.

Flamingock Cloud is coming soon. It provides a complete historical audit and event view while the local Audit Store, lock, and journal resources remain in place.


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

    // Create the Audit Store from the Target System. Configure its audit,
    // lock, and journal resources with the verified provider guidance.
    var auditStore = MongoDBSyncAuditStore.from(targetSystem)
        .withAuditRepositoryName("ordersServiceAuditLog")
        .withLockRepositoryName("ordersServiceLock")
        .withJournalRepositoryName("ordersServiceJournal");

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
        .withLockRepositoryName("ordersServiceLock")
        .withJournalRepositoryName("ordersServiceJournal");
}

// Flamingock Spring Boot auto-configuration will pick this up automatically
```

Spring Boot's auto-configuration will automatically register these audit stores with Flamingock.

For more details, see [Spring Boot Integration](../frameworks/springboot-integration/introduction.md).

  </TabItem>
</Tabs>
