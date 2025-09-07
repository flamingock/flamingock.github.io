---
title: Transactions
sidebar_position: 40
---

# Transactions

Flamingock provides intelligent transaction management that adapts to your target systems' capabilities. Understanding when and how changes are executed transactionally is key to building reliable system evolution.

---

## How Flamingock handles transactions

### Default behavior
All ChangeUnits default to `transactional = true` for maximum safety. Flamingock automatically adapts based on your target system:

**For transactional target systems** (PostgreSQL, MongoDB, SQL databases):
- Change execution runs within a native database transaction
- Automatic rollback on failure
- Session/connection managed automatically

**For non-transactional target systems** (Kafka, S3, REST APIs):
- No native transaction support
- Safety through compensation logic (`@RollbackExecution`)
- Idempotent operations recommended

### When to use non-transactional
Override the default with `transactional = false` when:
- DDL operations (CREATE INDEX, ALTER TABLE) that don't support transactions
- Large bulk operations that exceed transaction limits
- Operations that must complete regardless of other failures

---

## Examples

### Transactional ChangeUnit (default)
```java
@TargetSystem("user-database")
@ChangeUnit(id = "update-user-status", order = "001")
// transactional = true (default)
public class UpdateUserStatus {
    
    @Execution
    public void execute(MongoDatabase database, ClientSession session) {
        // Runs inside a transaction, session provided automatically
        database.getCollection("users")
                .updateMany(session, eq("status", "pending"), set("status", "active"));
    }
    
    @RollbackExecution  
    public void rollback(MongoDatabase database, ClientSession session) {
        // For manual rollback operations (CLI undo)
        database.getCollection("users")
                .updateMany(session, eq("status", "active"), set("status", "pending"));
    }
}
```

### Non-transactional ChangeUnit
```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-indexes", order = "002", transactional = false)
public class CreateIndexes {
    
    @Execution
    public void execute(MongoDatabase database) {
        // No transaction - DDL operations
        database.getCollection("users").createIndex(ascending("email"));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // Called automatically on failure for cleanup
        try {
            database.getCollection("users").dropIndex("email_1");
        } catch (Exception e) {
            // Handle cleanup errors
        }
    }
}
```

### Non-transactional target system
```java
@TargetSystem("event-stream") 
@ChangeUnit(id = "publish-events", order = "003", transactional = false)
// Must be false for non-transactional systems
public class PublishEvents {
    
    @Execution
    public void execute(KafkaTemplate kafka) {
        kafka.send("user-topic", "status-changed", eventData);
    }
    
    @RollbackExecution
    public void rollback(KafkaTemplate kafka) {
        // Compensation logic - publish rollback event
        kafka.send("user-topic", "status-rollback", compensationData);
    }
}
```

---

## Best practices

### Always provide @RollbackExecution
- **Transactional systems**: Used for manual rollback operations (CLI undo)
- **Non-transactional systems**: Called automatically on failure for cleanup
- **Both cases**: Essential for complete change management

### Use appropriate transactionality
- **Keep default `transactional = true`** for data changes
- **Use `transactional = false`** only when necessary (DDL, bulk operations)
- **Design idempotent operations** for non-transactional systems

### Handle rollback gracefully
```java
@RollbackExecution
public void rollback(MongoDatabase database) {
    try {
        // Attempt cleanup
        database.getCollection("temp_data").drop();
    } catch (Exception e) {
        // Log but don't fail - rollback should be best effort
        logger.warn("Rollback cleanup failed", e);
    }
}
```

---

**Key takeaway**: Flamingock's transaction management adapts to your target systems while maintaining safety. Use the defaults unless you have specific requirements for non-transactional execution.