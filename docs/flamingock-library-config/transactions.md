---
title: Transactions
sidebar_position: 90
---

# Change-Level Transactionality
*Smart defaults with expert control for enterprise safety*

Flamingock provides intelligent transactionality control that balances enterprise safety with operational flexibility. Understanding when and how to use transactional vs non-transactional changes is key to building reliable distributed system evolution.

---

## The Safety-First Approach

### Default Behavior: Transactional = True
Flamingock defaults to `transactional = true` for maximum safety:
- **Change execution** runs within a database transaction
- **Audit logging** happens in a separate transaction for architectural safety
- **Automatic rollback** of the change transaction if execution fails
- **Coordination mechanisms** ensure consistency between change and audit operations

### When You Need Non-Transactional
Some operations cannot or should not run in transactions:
- **DDL operations** (CREATE INDEX, ALTER TABLE) in many databases
- **Large bulk operations** that would exceed transaction limits
- **Cross-system changes** spanning multiple databases
- **Non-transactional targets** (Kafka, S3, REST APIs)

---

## Understanding Target System Types

### Transactional Target Systems
Systems that natively support ACID transactions:

```java
@TargetSystem("user-database")  // PostgreSQL, MySQL, MongoDB 4.0+
@ChangeUnit(id = "update-user-status", order = "001", author = "platform-team")
// transactional = true (default) - leverages database transaction capabilities
public class UpdateUserStatus {
    
    @Execution
    public void execute(MongoDatabase database) {
        // This runs inside a transaction
        // Automatic rollback on failure
        database.getCollection("users")
                .updateMany(eq("status", "pending"), set("status", "active"));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // For CLI undo operations - not called on failure (transaction handles it)
        database.getCollection("users")
                .updateMany(eq("status", "active"), set("status", "pending"));
    }
}
```

### Non-Transactional Target Systems  
Systems without native transaction support:

```java
@TargetSystem("event-stream")  // Kafka, S3, REST APIs
@ChangeUnit(id = "publish-user-events", order = "002", author = "platform-team", 
           transactional = false)  // Required for non-transactional systems
public class PublishUserEvents {
    
    @Execution
    public void execute(KafkaTemplate kafka) {
        // No transaction possible - manual safety required
        kafka.send("user-topic", "user-status-changed", eventData);
    }
    
    @RollbackExecution
    public void rollback(KafkaTemplate kafka) {
        // WILL be called on failure - provides manual safety
        // Publish compensating event or cleanup logic
        kafka.send("user-topic", "user-status-rollback", compensationData);
    }
}
```

---

## When to Use Transactional = False

Even in transactional systems, some operations require `transactional = false`:

### DDL Operations Example
```java
@TargetSystem("user-database")  // MongoDB (transactional system)
@ChangeUnit(id = "create-user-indexes", order = "003", author = "dba-team", 
           transactional = false)  // DDL operations can't be in transactions
public class CreateUserIndexes {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Index creation isn't transactional even in MongoDB
        MongoCollection<Document> users = database.getCollection("users");
        users.createIndex(ascending("email"));
        users.createIndex(compound(ascending("status"), descending("createdAt")));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // WILL be called on failure - cleanup partial index creation
        MongoCollection<Document> users = database.getCollection("users");
        try {
            users.dropIndex("email_1");
            users.dropIndex("status_1_createdAt_-1");
        } catch (Exception e) {
            // Handle rollback errors appropriately
        }
    }
}
```

### Large Bulk Operations
```java
@TargetSystem("analytics-database")
@ChangeUnit(id = "bulk-user-analysis", order = "004", author = "analytics-team",
           transactional = false)  // Bulk operations for performance
public class BulkUserAnalysis {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Process millions of records - transaction would timeout/lock
        MongoCollection<Document> users = database.getCollection("users");
        MongoCollection<Document> analytics = database.getCollection("user_analytics");
        
        // Batch processing for performance
        users.find().forEach(user -> {
            Document analyticsDoc = generateAnalytics(user);
            analytics.insertOne(analyticsDoc);
        });
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // Clean up partial bulk operation
        database.getCollection("user_analytics").deleteMany(new Document());
    }
}
```

---

## Recovery Strategy Integration

### Transactional Changes + MANUAL_INTERVENTION
```java
@TargetSystem("financial-database")
@ChangeUnit(id = "update-account-balances", order = "005", author = "finance-team")
// transactional = true (default) + MANUAL_INTERVENTION (default)
// = Maximum safety for critical data
public class UpdateAccountBalances {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Critical financial data - automatic transaction rollback on failure
        // Manual intervention required to investigate any issues
    }
}
```

### Non-Transactional Changes + ALWAYS_RETRY
```java
@TargetSystem("cache-service")
@ChangeUnit(id = "warm-user-cache", order = "006", author = "platform-team",
           transactional = false)  // Cache operations aren't transactional
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)  // Safe to retry
public class WarmUserCache {
    
    @Execution
    public void execute(RedisTemplate redis) {
        // Idempotent cache warming - safe to retry automatically
        // No transaction needed, automatic retry on failure
    }
}
```

---

## Configuration Options

### Per-Change Configuration (Recommended)
```java
// Explicit control per change
@ChangeUnit(id = "my-change", transactional = false, /* other params */)
```

### Global Configuration (Less Common)
```java
// Disable transactions globally
Flamingock.builder()
    .disableTransaction()  // All changes become non-transactional
    .build()
```

---

## Decision Matrix

| Change Type | Target System | Operation | Transactional Setting |
|------------|---------------|-----------|---------------------|
| Data updates | MongoDB, PostgreSQL | DML operations | `true` (default) |
| Schema changes | MongoDB, PostgreSQL | DDL operations | `false` |
| Cache updates | Redis, Memcached | Cache operations | `false` |
| Event publishing | Kafka, RabbitMQ | Message sending | `false` |
| API calls | REST services | HTTP requests | `false` |
| File operations | File system, S3 | File manipulation | `false` |
| Bulk processing | Any database | Large datasets | `false` |

---

## Best Practices

### **Always Provide @RollbackExecution**
Regardless of transactionality, always implement rollback methods:

```java
@RollbackExecution
public void rollback(/* dependencies */) {
    // For transactional changes: Used in CLI undo operations
    // For non-transactional changes: Used in automatic failure recovery
}
```

### **Match Recovery Strategy to Operation**
- **Transactional + Critical data** → MANUAL_INTERVENTION (default)
- **Non-transactional + Idempotent** → ALWAYS_RETRY
- **Non-transactional + Critical** → MANUAL_INTERVENTION

### **Keep Changes Focused**
Don't mix transactional and non-transactional operations in one change:

```java
// ❌ Bad - mixing concerns
@ChangeUnit(id = "mixed-operations")
public class MixedOperations {
    @Execution
    public void execute(MongoDatabase db, KafkaTemplate kafka) {
        // Database update (transactional) + Kafka publish (non-transactional)
    }
}

// ✅ Good - separate concerns
@ChangeUnit(id = "database-update", transactional = true)
@ChangeUnit(id = "kafka-publish", transactional = false)
```

### **Use Explicit Annotations**
Be explicit about transactionality for clarity:

```java
// ✅ Clear intent
@ChangeUnit(id = "user-update", transactional = true)   // Explicit
@ChangeUnit(id = "index-creation", transactional = false) // Explicit
```

---

## Troubleshooting

### "Operation Not Supported In Transaction" Errors
```java
// Error: "Cannot create index in transaction"
@ChangeUnit(transactional = true)  // ❌ Wrong
public class CreateIndexes { }

// Fix: Disable transactions for DDL
@ChangeUnit(transactional = false)  // ✅ Correct
public class CreateIndexes { }
```

### Partial Failure Recovery
```java
@ChangeUnit(transactional = false)
public class NonTransactionalChange {
    
    @Execution
    public void execute() {
        // Step 1: succeeds
        // Step 2: fails <- Partial completion
        // @RollbackExecution will be called automatically
    }
    
    @RollbackExecution  
    public void rollback() {
        // Must handle cleanup of Step 1
        // Flamingock calls this automatically on failure
    }
}
```

---

**Key Takeaway**: Flamingock's transactionality control provides enterprise safety through intelligent defaults while giving you expert control when needed. Use transactions when possible, disable them when necessary, and always provide rollback logic for governance and recovery.