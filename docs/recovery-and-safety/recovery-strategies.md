---
title: Recovery Strategies
sidebar_position: 1
---

# Recovery Strategies
*Intelligent failure handling for enterprise distributed systems*

Flamingock's recovery strategies are a key differentiator from traditional tools. While others retry blindly or fail silently, Flamingock provides intelligent, configurable recovery based on operation characteristics.


## The Safety-First Philosophy

**Core Principle**: "When in doubt, stop and alert rather than corrupt data."

Traditional tools assume the "happy path" - they retry operations blindly or fail without context. This approach leads to:
- Silent data corruption
- Inconsistent system states  
- Difficult troubleshooting
- Compliance gaps

**Flamingock's Approach**: Configurable recovery strategies that match your operation's risk profile.


## Recovery Strategy Types

### MANUAL_INTERVENTION (Default)
**Philosophy**: "Safety first - human judgment for uncertain situations."

```java
@TargetSystem("financial-database")
@ChangeUnit(id = "process-payments", order = "001", author = "finance-team")
// No @Recovery annotation = MANUAL_INTERVENTION default
public class ProcessPayments {
    
    @Execution
    public void execute(MongoDatabase financialDb) {
        // Critical financial operations
        // Any failure requires manual review to ensure data integrity
        financialDb.getCollection("payments")
                  .updateMany(eq("status", "pending"), 
                             combine(set("status", "processed"),
                                   set("processedAt", new Date())));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase financialDb) {
        // Financial rollback requires careful manual oversight
        financialDb.getCollection("payments")
                  .updateMany(eq("status", "processed"),
                             combine(set("status", "pending"),
                                   unset("processedAt")));
    }
}
```

**When It Activates**: Any failure where system state is uncertain
**What Happens**:
1. Execution stops immediately
2. Issue logged with detailed context
3. Human review required via CLI
4. Complete audit trail maintained

**Best For**:
- Financial transactions
- User data modifications
- Critical business logic
- Non-idempotent operations
- Compliance-sensitive changes

### ALWAYS_RETRY  
**Philosophy**: "Keep trying until successful - for operations we know are safe."

```java
@TargetSystem("user-cache")
@ChangeUnit(id = "warm-user-cache", order = "002", author = "platform-team")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class WarmUserCache {
    
    @Execution
    public void execute(RedisTemplate redis, UserService userService) {
        // Idempotent cache warming - safe to repeat
        List<User> activeUsers = userService.findActiveUsers();
        for (User user : activeUsers) {
            String cacheKey = "user:" + user.getId();
            UserProfile profile = userService.getUserProfile(user.getId());
            redis.opsForValue().set(cacheKey, profile, Duration.ofHours(24));
        }
    }
    
    @RollbackExecution
    public void rollback(RedisTemplate redis) {
        // Clear cache - used for CLI undo operations
        redis.delete("user:*");
    }
}
```

**When It Activates**: Any failure, regardless of cause
**What Happens**:
1. Failure is logged
2. Automatic retry on next execution
3. Continues until successful
4. No manual intervention required

**Best For**:
- Cache warming operations
- Idempotent API calls  
- Event publishing (with consistent keys)
- Configuration updates
- Index creation
- File operations with overwrite


## Decision Framework

### Is Your Operation Idempotent?
**Idempotent**: Running multiple times produces same result as running once
- ✅ Cache SET operations
- ✅ Database UPSERT operations
- ✅ File overwrites
- ✅ CREATE IF NOT EXISTS operations
- ❌ Increment/decrement operations
- ❌ Append operations
- ❌ Time-sensitive operations

### Risk Assessment Matrix

| Operation Risk | Data Criticality | Recovery Strategy |
|---------------|------------------|-------------------|
| **High** | **High** | MANUAL_INTERVENTION |
| **High** | **Low** | MANUAL_INTERVENTION |
| **Low** | **High** | MANUAL_INTERVENTION |
| **Low** | **Low** | ALWAYS_RETRY (if idempotent) |

**Examples**:
- **High Risk + High Criticality**: Financial transactions, user authentication data
- **High Risk + Low Criticality**: Complex multi-step processes, dependency changes
- **Low Risk + High Criticality**: Simple user data updates, critical configuration
- **Low Risk + Low Criticality**: Cache operations, metrics collection


## Practical Implementation Patterns

### Pattern 1: Financial Operations
```java
@TargetSystem("payment-system")
@ChangeUnit(id = "process-refunds", order = "010", author = "finance-team")
// MANUAL_INTERVENTION default - no annotation needed
public class ProcessRefunds {
    
    @Execution
    public void execute(PaymentService paymentService) {
        // Critical financial operation - requires human oversight on failure
        List<RefundRequest> pendingRefunds = paymentService.getPendingRefunds();
        for (RefundRequest refund : pendingRefunds) {
            paymentService.processRefund(refund);
            auditService.logRefund(refund);
        }
    }
    
    @RollbackExecution
    public void rollback(PaymentService paymentService) {
        // Financial rollbacks require manual verification
        // This method used for CLI undo operations
    }
}
```

### Pattern 2: Infrastructure Setup
```java
@TargetSystem("messaging-infrastructure")
@ChangeUnit(id = "create-kafka-topics", order = "020", author = "platform-team",
           transactional = false)
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class CreateKafkaTopics {
    
    @Execution
    public void execute(KafkaAdminClient kafkaAdmin) {
        // Topic creation is idempotent - safe to retry
        List<NewTopic> topics = Arrays.asList(
            new NewTopic("user-events", 10, (short) 3),
            new NewTopic("order-events", 10, (short) 3)
        );
        kafkaAdmin.createTopics(topics);
    }
    
    @RollbackExecution
    public void rollback(KafkaAdminClient kafkaAdmin) {
        // Delete topics - used for CLI undo operations
        kafkaAdmin.deleteTopics(Arrays.asList("user-events", "order-events"));
    }
}
```

### Pattern 3: Conditional Logic Based on Environment
```java
@TargetSystem("user-database")
@ChangeUnit(id = "user-data-cleanup", order = "030", author = "data-team")
@Recovery(strategy = RecoveryStrategy.MANUAL_INTERVENTION)  // Explicit for clarity
public class UserDataCleanup {
    
    @Execution
    public void execute(MongoDatabase userDb, @Value("${environment}") String env) {
        if ("production".equals(env)) {
            // Production data cleanup requires manual oversight
            cleanupInactiveUsers(userDb);
        } else {
            // Non-production can be more aggressive
            cleanupAllTestData(userDb);
        }
    }
}
```


## Cloud Edition Enhanced Recovery

Cloud Edition uses the same recovery strategies but provides enhanced outcomes:

### Enhanced MANUAL_INTERVENTION
- **Automatic issue detection** with real-time alerts
- **Detailed diagnostic information** for faster resolution
- **Workflow automation** for common resolution patterns  
- **Team collaboration** features for complex issues

### Enhanced ALWAYS_RETRY
- **Intelligent retry backoff** prevents system overload
- **Circuit breaker patterns** prevent cascading failures
- **Automatic reconciliation** detects and resolves inconsistencies
- **Advanced monitoring** provides visibility into retry patterns

### Marker Mechanism (Cloud Edition)
For transactional systems, Cloud Edition uses sophisticated coordination:
1. **Intent markers** placed before execution
2. **State tracking** during execution
3. **Resolution markers** after completion
4. **Automatic recovery** based on marker state

This enables Cloud Edition to automatically resolve many issues that require manual intervention in Community Audit Stores.


## Operational Workflows

### Issue Resolution Process
```bash
# 1. Detect issues
flamingock issue list
# Shows all changes requiring attention

# 2. Get next priority issue
flamingock issue get
# Returns detailed context and guidance

# 3. Investigate and resolve
# Review target system state
# Make necessary corrections
# Document resolution

# 4. Mark as resolved
flamingock audit fix -c change-id --resolution APPLIED
# or
flamingock audit fix -c change-id --resolution ROLLED_BACK
```

### Monitoring and Alerting
- **Issue detection**: Automated monitoring of failure states
- **Alert integration**: Connect to PagerDuty, Slack, email systems
- **Metrics tracking**: Success rates, failure patterns, resolution times
- **Dashboard visibility**: Real-time status across environments


## Best Practices

### **Start Conservative, Optimize Gradually**
1. Begin with MANUAL_INTERVENTION (default)
2. Monitor failure patterns and resolution outcomes
3. Identify truly idempotent operations
4. Gradually move appropriate changes to ALWAYS_RETRY

### **Design for Idempotency When Possible**
```java
// ✅ Idempotent design
users.updateMany(
    eq("status", "pending"),
    set("status", "processed")  // Same result regardless of repetition
);

// ❌ Non-idempotent design  
users.updateMany(
    eq("status", "pending"),
    inc("processCount", 1)  // Different result each time
);
```

### **Document Recovery Strategy Decisions**
```java
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
// Document why: "Cache SET operations are idempotent and safe to retry"
@ChangeUnit(description = "Warm user profile cache - idempotent operation safe for automatic retry")
```

### **Test Both Strategies in Development**
- Simulate failures in lower environments
- Verify MANUAL_INTERVENTION workflow
- Validate ALWAYS_RETRY behavior
- Test rollback logic for both strategies

### **Enterprise Governance**
- **Policy definition**: Establish organization-wide guidelines
- **Code review**: Include recovery strategy in review process
- **Compliance documentation**: Maintain records of strategy decisions
- **Regular assessment**: Review and update strategies based on operational experience


**Key Takeaway**: Recovery strategies are not just error handling - they're a core architectural decision that affects operational safety, team productivity, and business risk. Choose wisely, document thoroughly, and evolve based on operational experience.