---
title: Target System Configuration
sidebar_position: 4
---

# Target System Configuration
*How to define and configure target systems for your ChangeUnits*

Target systems are where your business changes are applied. This guide covers how to properly configure them, define their characteristics, and work with different system types.

> **Conceptual Overview**: For architectural understanding of target systems vs audit store, see [Target Systems vs Audit Store Architecture](../overview/audit-store-vs-target-system.md).

---

## Basic Target System Definition

### Required: @TargetSystem Annotation
Every ChangeUnit must specify which target system it affects:

```java
@TargetSystem("user-database")  // Required: explicitly names the target
@ChangeUnit(id = "add-user-status", order = "0001", author = "dev-team")
public class _0001_AddUserStatus {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Your business logic modifies the target system
        database.getCollection("users")
                .updateMany(new Document(), 
                           new Document("$set", new Document("status", "active")));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(new Document(), 
                           new Document("$unset", new Document("status", "")));
    }
}
```

### Target System Naming Convention
- **Use descriptive names**: `"user-database"`, `"payment-api"`, `"inventory-cache"`
- **Be consistent**: Same target system name across related ChangeUnits
- **Avoid generic names**: Not `"database"` or `"api"` - be specific

---

## Transactional vs Non-Transactional Systems

### Transactional Target Systems
Systems that support ACID transactions and can coordinate with Flamingock's audit store:

```java
@TargetSystem("financial-database")
@ChangeUnit(id = "process-payments", order = "0001", author = "finance-team",
           transactional = true)  // Default behavior for transactional systems
public class ProcessPayments {
    
    @Execution
    public void execute(MongoDatabase financialDb) {
        // Runs within a transaction
        // Automatic rollback coordination with audit store
        financialDb.getCollection("payments")
                  .updateMany(eq("status", "pending"), 
                             combine(set("status", "processed"),
                                   set("processedAt", new Date())));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase financialDb) {
        financialDb.getCollection("payments")
                  .updateMany(eq("status", "processed"),
                             combine(set("status", "pending"),
                                   unset("processedAt")));
    }
}
```

**Supported Transactional Systems:**
- **MongoDB 4.0+**: With replica sets or sharded clusters
- **PostgreSQL**: All versions with transaction support
- **MySQL**: InnoDB engine with transaction support
- **SQL Server**: Standard transaction support

### Non-Transactional Target Systems
Systems that don't support transactions but still benefit from Flamingock's safety mechanisms:

```java
@TargetSystem("event-stream")
@ChangeUnit(id = "publish-user-events", order = "0002", author = "platform-team",
           transactional = false)  // Must be false for non-transactional systems
public class PublishUserEvents {
    
    @Execution
    public void execute(KafkaTemplate kafkaTemplate) {
        // No transaction support, but Flamingock provides safety through:
        // 1. Execution tracking in audit store
        // 2. Rollback compensation via @RollbackExecution
        List<UserEvent> events = prepareUserEvents();
        for (UserEvent event : events) {
            kafkaTemplate.send("user-events", event.getUserId(), event);
        }
    }
    
    @RollbackExecution
    public void rollback(KafkaTemplate kafkaTemplate) {
        // Manual compensation - publish rollback events
        List<UserEvent> rollbackEvents = prepareRollbackEvents();
        for (UserEvent event : rollbackEvents) {
            kafkaTemplate.send("user-events", event.getUserId(), event);
        }
    }
}
```

**Common Non-Transactional Systems:**
- **Apache Kafka**: Message streaming platform
- **Amazon S3**: Object storage service
- **REST APIs**: External service integrations
- **File Systems**: Local or network file operations
- **Redis** (when not using transactions)
- **Elasticsearch**: Search and analytics engine

---

## Dependency Injection for Target Systems

### MongoDB Example
```java
@TargetSystem("user-database")
@ChangeUnit(id = "update-user-schema", order = "0001", author = "dev-team")
public class UpdateUserSchema {
    
    @Execution
    public void execute(MongoDatabase userDatabase) {
        // MongoDatabase is injected based on target system configuration
        userDatabase.getCollection("users")
                   .createIndex(Indexes.ascending("email"));
    }
}
```

### Spring Data Example
```java
@TargetSystem("product-database")
@ChangeUnit(id = "migrate-products", order = "0002", author = "product-team")
public class MigrateProducts {
    
    @Execution
    public void execute(ProductRepository productRepository) {
        // Spring Data repository injected automatically
        List<Product> products = productRepository.findAll();
        products.forEach(product -> {
            product.setCategory(determineCategory(product));
            productRepository.save(product);
        });
    }
}
```

### Multiple Dependencies Example
```java
@TargetSystem("user-system")
@ChangeUnit(id = "sync-user-data", order = "0003", author = "platform-team")
public class SyncUserData {
    
    @Execution
    public void execute(MongoDatabase userDb, 
                       KafkaTemplate eventStream,
                       S3Client fileStorage,
                       UserService userService) {
        // Multiple dependencies injected for complex operations
        List<User> users = userService.findUsersToSync();
        
        for (User user : users) {
            // Update database
            updateUserInDatabase(userDb, user);
            
            // Publish event
            publishUserEvent(eventStream, user);
            
            // Sync files
            syncUserFiles(fileStorage, user);
        }
    }
}
```

---

## Target System Configuration in Flamingock

### Community Edition Configuration

#### MongoDB Target System
```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(MongoTemplate mongoTemplate) {
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(mongoTemplate))
            .addMigrationClass(UserDatabaseChanges.class)
            // Target system "user-database" maps to MongoDatabase from MongoTemplate
            .build();
    }
}
```

#### Multiple Target Systems
```java
@Configuration
public class FlamingockConfig {
    
    @Bean 
    public Flamingock flamingock(MongoTemplate mongoTemplate,
                                KafkaTemplate kafkaTemplate,
                                S3Client s3Client) {
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(mongoTemplate))
            // Register target system dependencies
            .addDependency("userDatabase", mongoTemplate.getCollection("users"))
            .addDependency("eventStream", kafkaTemplate)
            .addDependency("fileStorage", s3Client)
            .addMigrationClass(MultiSystemChanges.class)
            .build();
    }
}
```

---

## When to Use transactional = false

### DDL Operations
Even in transactional databases, some operations require non-transactional execution:

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-user-indexes", order = "0004", author = "dba-team",
           transactional = false)  // DDL can't be in transactions
public class CreateUserIndexes {
    
    @Execution
    public void execute(MongoDatabase userDb) {
        MongoCollection<Document> users = userDb.getCollection("users");
        // Index creation operations
        users.createIndex(Indexes.ascending("email"));
        users.createIndex(Indexes.compound(
            Indexes.ascending("status"), 
            Indexes.descending("createdAt")
        ));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase userDb) {
        MongoCollection<Document> users = userDb.getCollection("users");
        users.dropIndex("email_1");
        users.dropIndex("status_1_createdAt_-1");
    }
}
```

### Large Bulk Operations
Operations that might exceed transaction limits:

```java
@TargetSystem("analytics-database")  
@ChangeUnit(id = "migrate-analytics-data", order = "0005", author = "data-team",
           transactional = false)  // Large dataset migration
public class MigrateAnalyticsData {
    
    @Execution
    public void execute(MongoDatabase analyticsDb) {
        MongoCollection<Document> events = analyticsDb.getCollection("events");
        
        // Process in batches to avoid transaction timeouts
        int batchSize = 10000;
        int skip = 0;
        
        while (true) {
            List<Document> batch = events.find()
                                        .skip(skip)
                                        .limit(batchSize)
                                        .into(new ArrayList<>());
            
            if (batch.isEmpty()) break;
            
            // Transform and update batch
            transformEventBatch(events, batch);
            skip += batchSize;
        }
    }
}
```

---

## Target System Best Practices

### Naming and Organization
```java
// ✅ Good: Descriptive and specific
@TargetSystem("user-profile-database")
@TargetSystem("payment-gateway-api")  
@TargetSystem("inventory-cache-redis")

// ❌ Avoid: Generic and ambiguous
@TargetSystem("database")
@TargetSystem("api")
@TargetSystem("cache")
```

### Dependency Scoping
```java
@TargetSystem("user-database")
@ChangeUnit(id = "update-user-profiles", order = "0006", author = "dev-team")
public class UpdateUserProfiles {
    
    @Execution
    public void execute(MongoDatabase userDb,           // ✅ Specific database
                       UserValidationService validator, // ✅ Specific service
                       EmailService emailService) {     // ✅ Related service
        // Good: Inject only what you need for this specific change
    }
    
    // ❌ Avoid: Injecting entire application context or unrelated services
}
```

### Error Handling and Safety
```java
@TargetSystem("external-payment-api")
@ChangeUnit(id = "update-payment-config", order = "0007", author = "finance-team")
public class UpdatePaymentConfig {
    
    @Execution
    public void execute(PaymentApiClient paymentClient) {
        try {
            // Make change idempotent when possible
            PaymentConfig currentConfig = paymentClient.getConfig();
            if (!currentConfig.hasNewFeature()) {
                paymentClient.updateConfig(newConfigWithFeature());
            }
        } catch (PaymentApiException e) {
            // Log detailed context for troubleshooting
            log.error("Failed to update payment config. Current state unknown. " +
                     "Manual verification required at payment provider.", e);
            throw e; // Re-throw to trigger Flamingock's safety mechanisms
        }
    }
    
    @RollbackExecution
    public void rollback(PaymentApiClient paymentClient) {
        // Always provide rollback, even for external APIs
        try {
            paymentClient.updateConfig(previousConfig());
        } catch (PaymentApiException e) {
            log.error("Payment API rollback failed. Manual intervention required.", e);
            throw e;
        }
    }
}
```

---

## Troubleshooting Target System Issues

### Common Configuration Problems

#### Missing @TargetSystem Annotation
```
Error: ChangeUnit must specify a target system
Solution: Add @TargetSystem("system-name") annotation to your ChangeUnit class
```

#### Dependency Injection Failures  
```
Error: No bean of type 'MongoDatabase' available
Solution: Ensure target system dependencies are properly configured in your Flamingock setup
```

#### Transactional Setting Mismatch
```
Error: Transaction not supported by target system
Solution: Set transactional = false for non-transactional systems like Kafka, S3, APIs
```

### Verification Commands
```bash
# Check which target systems are configured
flamingock audit list --group-by target-system

# Verify target system connectivity
flamingock test-connection --target-system user-database

# List changes for specific target system  
flamingock audit list --target-system user-database --since "1 week ago"
```

---

**Key Takeaway**: Proper target system configuration ensures your ChangeUnits can safely and reliably apply business changes while maintaining Flamingock's safety guarantees and audit capabilities.