---
title: Audit store configuration  
sidebar_position: 30
---

# Audit store configuration

The audit store is Flamingock's dedicated system for tracking execution history, preventing duplicate executions, and ensuring safe system evolution.

## What is the audit store?

The audit store tracks:
- **Execution history**: Which ChangeUnits ran, when, and with what outcome
- **Distributed locking**: Prevents concurrent executions across multiple instances  
- **Issue tracking**: Failed or uncertain executions requiring resolution

Unlike target systems (which your code modifies), the audit store is managed automatically by Flamingock and never modified by your ChangeUnits.

> **Conceptual overview**: For architectural understanding, see [Target systems vs audit store](../overview/audit-store-vs-target-system.md)

## Configuration requirements

### Cloud Edition
**No configuration needed** - Flamingock Cloud provides a fully managed audit store with superior synchronization, recovery mechanisms, real-time dashboards, and multi-environment governance.

### Community Audit Stores  
You must provide and configure your own audit store. Flamingock supports MongoDB, DynamoDB, and Couchbase as audit stores.

## Community Audit Stores configuration

In Community Audit Stores, you register the audit store with the Flamingock builder:

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

## Available Community audit stores

For specific configuration details of each supported audit store, see:

- [MongoDB audit store](../community-audit-stores/mongodb-audit-store.md)
- [MongoDB Spring Data audit store](../community-audit-stores/mongodb-springdata-audit-store.md)
- [DynamoDB audit store](../community-audit-stores/dynamodb-audit-store.md)  
- [Couchbase audit store](../community-audit-stores/couchbase-audit-store.md)

Each implementation provides:
- Complete execution tracking
- Distributed locking mechanisms
- Issue management capabilities
- Configuration options specific to the database

## Best practices

1. **Separation of concerns**: Consider using a dedicated database/collection for the audit store, separate from your business data
2. **Durability settings**: Configure strong consistency settings for your audit store to ensure reliable tracking
3. **Access control**: Limit write access to the audit store to only the Flamingock framework
4. **Backup strategy**: Include the audit store in your backup procedures for compliance and recovery

---

**Key takeaway**: The audit store is critical for Flamingock's safety guarantees. Cloud Edition provides this fully managed, while Community Audit Stores requires you to configure one of the supported databases.