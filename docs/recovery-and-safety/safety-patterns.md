---
title: Safety Patterns
sidebar_position: 3
---

# Safety Patterns
*Proven approaches for enterprise-grade distributed system evolution*

This guide presents battle-tested patterns that ensure safe, reliable system evolution in production environments. These patterns have been refined through real-world enterprise deployments and operational experience.

---

## Core Safety Principles

### 1. **Explicit is Better Than Implicit**
Always be explicit about your intentions and system boundaries.

```java
// ✅ Explicit and clear
@TargetSystem("user-database")  // Clear target
@ChangeUnit(id = "user-status-update", transactional = true)  // Explicit transaction control
@Recovery(strategy = RecoveryStrategy.MANUAL_INTERVENTION)  // Explicit strategy
public class UserStatusUpdate { }

// ❌ Implicit and unclear  
@ChangeUnit(id = "update")  // Unclear intent
public class Update { }  // No target, relies on defaults
```

### 2. **Design for Failure**
Every change should anticipate and handle failure scenarios.

```java
@TargetSystem("payment-system")
@ChangeUnit(id = "process-payment-batch", order = "001", author = "finance-team")
public class ProcessPaymentBatch {
    
    @Execution
    public void execute(PaymentService paymentService) {
        List<Payment> pendingPayments = paymentService.getPendingPayments();
        
        for (Payment payment : pendingPayments) {
            try {
                paymentService.processPayment(payment);
                // Mark individual payment as processed for granular tracking
                paymentService.markAsProcessed(payment.getId());
            } catch (PaymentException e) {
                // Log failure but continue with other payments
                logger.error("Failed to process payment {}: {}", payment.getId(), e.getMessage());
                paymentService.markAsFailed(payment.getId(), e.getMessage());
            }
        }
    }
    
    @RollbackExecution
    public void rollback(PaymentService paymentService) {
        // Rollback only successfully processed payments
        List<Payment> processedPayments = paymentService.getProcessedPayments();
        for (Payment payment : processedPayments) {
            paymentService.revertPayment(payment);
        }
    }
}
```

### 3. **Idempotency by Design**
When possible, design operations to be naturally idempotent.

```java
// ✅ Idempotent by design
@TargetSystem("user-database")
@ChangeUnit(id = "set-user-preferences", author = "product-team")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)  // Safe because idempotent
public class SetUserPreferences {
    
    @Execution
    public void execute(MongoDatabase userDb) {
        // SET operations are naturally idempotent
        userDb.getCollection("users")
              .updateMany(
                  new Document(), // All users
                  new Document("$set", new Document("preferences", defaultPreferences()))
              );
    }
}

// ❌ Non-idempotent design
public class IncrementUserScores {
    @Execution
    public void execute(MongoDatabase userDb) {
        // INCREMENT is not idempotent - each run changes the result
        userDb.getCollection("users")
              .updateMany(new Document(), new Document("$inc", new Document("score", 10)));
    }
}
```

---

## Enterprise Safety Patterns

### Pattern 1: Critical Path Protection
**Use Case**: Financial operations, user authentication, compliance-sensitive changes

```java
@TargetSystem("financial-database")
@ChangeUnit(id = "update-account-balances", order = "001", author = "finance-team",
           transactional = true)  // Leverage database transactions
// MANUAL_INTERVENTION default - explicit safety
public class UpdateAccountBalances {
    
    @Execution
    public void execute(MongoDatabase financialDb, AuditLogger auditLogger) {
        MongoCollection<Document> accounts = financialDb.getCollection("accounts");
        
        // Pre-execution validation
        long totalBefore = calculateTotalBalance(accounts);
        auditLogger.logBalanceSnapshot("before", totalBefore);
        
        // Critical financial operation
        accounts.updateMany(
            eq("status", "pending_interest"), 
            combine(
                set("status", "interest_applied"),
                inc("balance", calculateInterest()),
                set("lastInterestDate", new Date())
            )
        );
        
        // Post-execution validation
        long totalAfter = calculateTotalBalance(accounts);
        auditLogger.logBalanceSnapshot("after", totalAfter);
        
        // Invariant check
        if (Math.abs(totalAfter - totalBefore - expectedInterestTotal()) > 0.01) {
            throw new BalanceInconsistencyException("Total balance invariant violated");
        }
    }
    
    @RollbackExecution  
    public void rollback(MongoDatabase financialDb, AuditLogger auditLogger) {
        auditLogger.logRollbackStart("update-account-balances");
        
        MongoCollection<Document> accounts = financialDb.getCollection("accounts");
        accounts.updateMany(
            eq("status", "interest_applied"),
            combine(
                set("status", "pending_interest"),
                inc("balance", -calculateInterest()),
                unset("lastInterestDate")
            )
        );
        
        auditLogger.logRollbackComplete("update-account-balances");
    }
}
```

### Pattern 2: Idempotent Operations with Retry
**Use Case**: Cache warming, event publishing, infrastructure setup

```java
@TargetSystem("messaging-infrastructure")
@ChangeUnit(id = "setup-kafka-topics", order = "002", author = "platform-team",
           transactional = false)  // External system calls
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)  // Safe to retry
public class SetupKafkaTopics {
    
    @Execution
    public void execute(KafkaAdminClient kafkaAdmin) {
        List<NewTopic> requiredTopics = Arrays.asList(
            new NewTopic("user-events", 10, (short) 3),
            new NewTopic("order-events", 15, (short) 3),
            new NewTopic("notification-events", 5, (short) 3)
        );
        
        // Get existing topics to avoid creating duplicates
        Set<String> existingTopics = kafkaAdmin.listTopics().names().get();
        
        List<NewTopic> topicsToCreate = requiredTopics.stream()
            .filter(topic -> !existingTopics.contains(topic.name()))
            .collect(Collectors.toList());
        
        if (!topicsToCreate.isEmpty()) {
            // Topic creation is idempotent - safe to retry
            kafkaAdmin.createTopics(topicsToCreate).all().get();
            logger.info("Created {} new topics: {}", 
                       topicsToCreate.size(), 
                       topicsToCreate.stream().map(NewTopic::name).collect(Collectors.toList()));
        } else {
            logger.info("All required topics already exist");
        }
    }
    
    @RollbackExecution
    public void rollback(KafkaAdminClient kafkaAdmin) {
        // For infrastructure setup, rollback usually means cleanup
        List<String> topicNames = Arrays.asList("user-events", "order-events", "notification-events");
        kafkaAdmin.deleteTopics(topicNames);
    }
}
```

### Pattern 3: Progressive Migration  
**Use Case**: Large-scale data transformations, phased rollouts

```java
@TargetSystem("user-database")
@ChangeUnit(id = "migrate-user-profiles-batch-1", order = "003", author = "data-team",
           transactional = false)  // Large operation, process in batches
public class MigrateUserProfilesBatch1 {
    
    private static final int BATCH_SIZE = 1000;
    private static final String MIGRATION_MARKER = "profile_v2_migration";
    
    @Execution
    public void execute(MongoDatabase userDb) {
        MongoCollection<Document> users = userDb.getCollection("users");
        
        // Process only users without migration marker (idempotent)
        FindIterable<Document> unmigrated = users.find(
            and(
                exists("profileVersion", false),  // Old schema
                exists(MIGRATION_MARKER, false)   // Not yet processed
            )
        ).limit(BATCH_SIZE);
        
        int processed = 0;
        for (Document user : unmigrated) {
            try {
                // Transform user profile to new schema
                Document newProfile = transformProfile(user);
                
                users.updateOne(
                    eq("_id", user.getObjectId("_id")),
                    combine(
                        set("profile", newProfile),
                        set("profileVersion", 2),
                        set(MIGRATION_MARKER, new Date())  // Mark as processed
                    )
                );
                processed++;
                
            } catch (Exception e) {
                logger.error("Failed to migrate user {}: {}", user.getObjectId("_id"), e.getMessage());
                // Mark this user as failed for separate handling
                users.updateOne(
                    eq("_id", user.getObjectId("_id")),
                    set("migrationError", e.getMessage())
                );
            }
        }
        
        logger.info("Migrated {} user profiles in this batch", processed);
        
        // Check if more batches are needed
        long remaining = users.countDocuments(
            and(
                exists("profileVersion", false),
                exists(MIGRATION_MARKER, false),
                exists("migrationError", false)  // Exclude failed ones
            )
        );
        
        if (remaining > 0) {
            logger.info("{} users remaining for migration", remaining);
        } else {
            logger.info("User profile migration completed successfully");
        }
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase userDb) {
        MongoCollection<Document> users = userDb.getCollection("users");
        
        // Rollback users that were migrated in this execution
        users.updateMany(
            exists(MIGRATION_MARKER),
            combine(
                unset("profile"),
                unset("profileVersion"), 
                unset(MIGRATION_MARKER),
                unset("migrationError")
            )
        );
    }
}
```

### Pattern 4: Multi-System Coordination
**Use Case**: Distributed system synchronization, event sourcing, complex workflows

```java
@TargetSystem("user-database")  // Primary system
@ChangeUnit(id = "sync-user-data-across-systems", order = "004", author = "integration-team",
           transactional = false)  // Multi-system can't be transactional
public class SyncUserDataAcrossSystems {
    
    @Execution
    public void execute(MongoDatabase userDb, 
                       ElasticsearchOperations searchOps,
                       KafkaTemplate<String, Object> eventPublisher,
                       RedisTemplate<String, Object> cacheOps) {
        
        // Get users that need synchronization
        List<User> usersToSync = findUsersNeedingSync(userDb);
        List<String> processedUsers = new ArrayList<>();
        
        try {
            for (User user : usersToSync) {
                // Step 1: Update primary database
                updateUserInDatabase(userDb, user);
                
                // Step 2: Update search index  
                indexUserInElasticsearch(searchOps, user);
                
                // Step 3: Update cache
                updateUserInCache(cacheOps, user);
                
                // Step 4: Publish change event
                publishUserChangeEvent(eventPublisher, user);
                
                // Track successful processing
                processedUsers.add(user.getId());
                
                // Mark user as synchronized
                markUserAsSynced(userDb, user.getId());
            }
            
        } catch (Exception e) {
            logger.error("Multi-system sync failed for user batch. Processed: {}. Error: {}", 
                        processedUsers.size(), e.getMessage());
            
            // Store progress information for rollback
            storeProcessingProgress(userDb, processedUsers);
            throw e;  // Re-throw to trigger rollback
        }
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase userDb,
                        ElasticsearchOperations searchOps,
                        KafkaTemplate<String, Object> eventPublisher, 
                        RedisTemplate<String, Object> cacheOps) {
        
        // Get list of users that were processed before failure
        List<String> processedUsers = getProcessingProgress(userDb);
        
        for (String userId : processedUsers) {
            try {
                // Reverse each step in opposite order
                publishUserRollbackEvent(eventPublisher, userId);
                removeUserFromCache(cacheOps, userId);
                removeUserFromElasticsearch(searchOps, userId);
                rollbackUserInDatabase(userDb, userId);
                
            } catch (Exception e) {
                logger.error("Failed to rollback user {}: {}", userId, e.getMessage());
                // Continue with other users - partial rollback is better than none
            }
        }
        
        // Clean up progress tracking
        clearProcessingProgress(userDb);
    }
}
```

---

## Operational Safety Patterns

### Pattern 5: Environment-Aware Changes
**Use Case**: Different behavior across environments, gradual rollouts

```java
@TargetSystem("feature-flags")
@ChangeUnit(id = "enable-new-checkout", order = "005", author = "product-team")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)  // Feature flags are idempotent
public class EnableNewCheckout {
    
    @Execution
    public void execute(FeatureFlagService flagService, 
                       @Value("${spring.profiles.active}") String environment) {
        
        FeatureFlagConfig config = buildConfigForEnvironment(environment);
        
        switch (environment) {
            case "development":
                // Full rollout in dev
                flagService.enableFlag("new-checkout", config.withRollout(100));
                break;
                
            case "staging":  
                // Full rollout in staging
                flagService.enableFlag("new-checkout", config.withRollout(100));
                break;
                
            case "production":
                // Gradual rollout in production
                flagService.enableFlag("new-checkout", config.withRollout(5));  // Start with 5%
                break;
                
            default:
                logger.warn("Unknown environment: {}. Skipping feature flag change.", environment);
        }
    }
    
    @RollbackExecution
    public void rollback(FeatureFlagService flagService) {
        flagService.disableFlag("new-checkout");
    }
}
```

### Pattern 6: Validation and Verification
**Use Case**: Critical changes requiring validation, compliance requirements

```java
@TargetSystem("compliance-database")
@ChangeUnit(id = "update-gdpr-consent", order = "006", author = "legal-team")
public class UpdateGdprConsent {
    
    @Execution
    public void execute(MongoDatabase complianceDb, GdprService gdprService) {
        MongoCollection<Document> userConsents = complianceDb.getCollection("user_consents");
        
        // Pre-execution validation
        long totalUsers = userConsents.countDocuments();
        long usersWithoutConsent = userConsents.countDocuments(exists("gdprConsent", false));
        
        logger.info("Starting GDPR consent update. Total users: {}, Without consent: {}", 
                   totalUsers, usersWithoutConsent);
        
        if (usersWithoutConsent == 0) {
            logger.info("All users already have GDPR consent recorded. No action needed.");
            return;
        }
        
        // Execute the change
        UpdateResult result = userConsents.updateMany(
            exists("gdprConsent", false),
            combine(
                set("gdprConsent", buildDefaultConsent()),
                set("consentUpdatedDate", new Date()),
                set("consentSource", "system-migration")
            )
        );
        
        // Post-execution validation
        long updatedCount = result.getModifiedCount();
        long stillWithoutConsent = userConsents.countDocuments(exists("gdprConsent", false));
        
        logger.info("GDPR consent update completed. Updated: {}, Remaining without consent: {}", 
                   updatedCount, stillWithoutConsent);
        
        // Validation checks
        if (updatedCount != usersWithoutConsent) {
            throw new ValidationException(
                String.format("Expected to update %d users but actually updated %d", 
                             usersWithoutConsent, updatedCount));
        }
        
        if (stillWithoutConsent > 0) {
            logger.warn("Some users still without consent after migration: {}", stillWithoutConsent);
        }
        
        // Compliance reporting
        gdprService.reportConsentUpdate(updatedCount, "system-migration");
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase complianceDb, GdprService gdprService) {
        MongoCollection<Document> userConsents = complianceDb.getCollection("user_consents");
        
        // Rollback only system-generated consent entries
        UpdateResult result = userConsents.updateMany(
            eq("consentSource", "system-migration"),
            combine(
                unset("gdprConsent"),
                unset("consentUpdatedDate"),
                unset("consentSource")
            )
        );
        
        logger.info("Rolled back GDPR consent for {} users", result.getModifiedCount());
        gdprService.reportConsentRollback(result.getModifiedCount(), "system-migration");
    }
}
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Silent Failures
```java
// DON'T DO THIS
@Execution
public void execute(ExternalService service) {
    try {
        service.updateData(data);
    } catch (Exception e) {
        // Silent failure - no one knows this failed!
        logger.debug("Update failed: {}", e.getMessage());
    }
}
```

### ✅ Better Approach:
```java
@Execution  
public void execute(ExternalService service) {
    try {
        service.updateData(data);
    } catch (ServiceUnavailableException e) {
        logger.error("Service temporarily unavailable: {}", e.getMessage());
        throw new RetryableException("External service unavailable", e);
    } catch (ValidationException e) {
        logger.error("Data validation failed: {}", e.getMessage());
        throw new PermanentException("Invalid data provided", e);
    }
}
```

### ❌ Anti-Pattern 2: Mixing Transactional and Non-Transactional
```java
// DON'T DO THIS
@ChangeUnit(transactional = true)  // This won't work for Kafka!
public class MixedOperations {
    @Execution
    public void execute(MongoDatabase db, KafkaTemplate kafka) {
        db.getCollection("users").updateMany(...);  // Transactional
        kafka.send("user-topic", event);            // Non-transactional
    }
}
```

### ✅ Better Approach:
```java
// Separate concerns
@TargetSystem("user-database")
@ChangeUnit(id = "update-users", transactional = true)
public class UpdateUsers { }

@TargetSystem("event-stream")  
@ChangeUnit(id = "publish-events", transactional = false)
public class PublishEvents { }
```

### ❌ Anti-Pattern 3: Assuming Success
```java
// DON'T DO THIS
@Execution
public void execute(List<ExternalService> services) {
    for (ExternalService service : services) {
        service.update();  // What if some succeed and others fail?
    }
}
```

### ✅ Better Approach:
```java
@Execution
public void execute(List<ExternalService> services) {
    List<String> successfulServices = new ArrayList<>();
    
    try {
        for (ExternalService service : services) {
            service.update();
            successfulServices.add(service.getId());
        }
    } catch (Exception e) {
        // Store partial progress for rollback
        storeProgress(successfulServices);
        throw e;
    }
}
```

---

## Best Practices Summary

### **Design for Production**
1. **Assume failures will happen** - design changes to handle partial completion
2. **Make operations idempotent** when possible to enable safe retry
3. **Validate inputs and outputs** to catch issues early
4. **Log extensively** for troubleshooting and audit purposes

### **Choose the Right Strategy**
1. **MANUAL_INTERVENTION** for critical, non-idempotent operations
2. **ALWAYS_RETRY** for idempotent, low-risk operations
3. **Document your reasoning** for recovery strategy decisions

### **Implement Proper Rollback**
1. **Always provide @RollbackExecution** methods
2. **Test rollback logic** as thoroughly as execution logic
3. **Handle partial failures** in rollback scenarios
4. **Log rollback operations** for audit trails

### **Monitor and Alert**
1. **Set up monitoring** for change execution patterns
2. **Create alerts** for failure conditions
3. **Establish SLAs** for issue resolution
4. **Review patterns** regularly to improve safety

**Remember**: Safety patterns are not just about preventing failures - they're about building confidence in your system evolution process and enabling your team to move fast while maintaining enterprise-grade reliability.