---
title: Introduction
sidebar_position: 1
---

# Audit stores

The audit store is Flamingock's dedicated system for tracking execution history, preventing duplicate executions, and ensuring safe system evolution.

## What is the audit store?

The audit store tracks:
- **Execution history**: Which ChangeUnits ran, when, and with what outcome
- **Distributed locking**: Prevents concurrent executions across multiple instances  
- **Issue tracking**: Failed or uncertain executions requiring resolution

Unlike target systems (which your code modifies), the audit store is managed automatically by Flamingock and never modified by your ChangeUnits.

> **Conceptual overview**: For architectural understanding, see [Target systems vs audit store](../overview/audit-store-vs-target-system.md)

## Supported audit stores

Flamingock supports several databases as audit stores:

- [MongoDB audit store](./community/mongodb-audit-store.md)
- [MongoDB Spring Data audit store](./community/mongodb-springdata-audit-store.md)
- [DynamoDB audit store](./community/dynamodb-audit-store.md)  
- [Couchbase audit store](./community/couchbase-audit-store.md)

### Configuration pattern

Register the audit store with the Flamingock builder:

```java
// Generic example - audit store configuration
public class App {
  public static void main(String[] args) {
    // Create your audit store connection
    AuditStore auditStore = new MongoSyncAuditStore(mongoClient, mongoDatabase);
    
    // Register with Flamingock
    FlamingockStandalone
      .setAuditStore(auditStore)  // Set the audit store
      .addTargetSystems(myTargetSystem)
      .build()
      .run();
  }
}
```

### Spring Boot configuration
```java
@Bean
public AuditStore auditStore(MongoClient mongoClient) {
    return new MongoSyncAuditStore(mongoClient, "flamingock-audit");
}

// Flamingock Spring Boot auto-configuration will pick this up automatically
```



The audit store is critical for Flamingock's safety guarantees and must be configured before running migrations.