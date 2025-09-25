# Flamingock Recovery & Safety Knowledge Base

> **Purpose**: This document serves as the authoritative knowledge base for Flamingock's recovery and safety mechanisms. It's designed to be imported into documentation projects to ensure consistent, accurate communication of Flamingock's core value propositions and technical capabilities.

## Executive Summary

### Core Value Proposition
Flamingock is a **safety-first platform** for the evolution of distributed systems. While traditional migration tools optimize for the "happy path," Flamingock is built for **real-world chaos**: partial failures, non-transactional systems, network issues, and uncertain states.

**The Flamingock Guarantee**: "Your system will always be left in a known, auditable, and consistent state — no matter what happens."

### Safety-First Philosophy
- **Default to safety**: When uncertain, stop and alert rather than corrupt
- **Explicit flexibility**: Advanced users can opt into automatic retry for idempotent operations
- **Complete audit trail**: Every action, success, and failure is tracked
- **Deterministic state**: Always know exactly what happened and what needs to happen next

### Edition Positioning
- **Community Audit Stores**: Secure + Functional
  - Complete safety guarantees
  - Manual intervention when needed
  - Full audit capabilities
  - Covers essential enterprise needs

- **Cloud Edition**: Secure + Resilient + Automatic
  - Same configuration options as Community
  - Enhanced automatic resolution through advanced mechanisms
  - Better resilience through markers and reconciliation
  - Premium value: "Same settings, better outcomes"

## Core Concepts

### Target Systems vs Audit Store

Before diving into recovery strategies, it's essential to understand Flamingock's dual-system architecture:

#### Target Systems
**Target Systems** are where your business changes are applied - the systems you're actually migrating or evolving:

- **Examples**: User database, Product catalog, Order management system, Payment processing DB
- **Purpose**: Store and process your business data
- **Changes applied**: Business logic migrations, schema updates, data transformations
- **Annotation**: `@TargetSystem("user-database")`

#### Audit Store  
**Audit Store** is where Flamingock tracks execution history and state - completely separate from your business systems:

- **Examples**: Dedicated audit database, separate MongoDB collection, audit service
- **Purpose**: Store execution logs, audit entries, issue tracking, compliance data
- **Changes applied**: None - read-only for your business logic, write-only for Flamingock
- **Configuration**: Set up once in Flamingock configuration, not in individual changes

#### Key Differences

| Aspect             | Target System                   | Audit Store                         |
|--------------------|---------------------------------|-------------------------------------|
| **Purpose**        | Business data and logic         | Execution tracking and compliance   |
| **Modified by**    | Your @Execution methods         | Flamingock framework automatically  |
| **Access pattern** | Read/Write by your code         | Read/Write by Flamingock            |
| **Examples**       | `user-db`, `inventory-system`   | `flamingock-audit`, `audit-service` |
| **Failure impact** | Business functionality affected | Only tracking affected              |
| **Recovery scope** | Business data recovery          | Audit trail recovery                |

#### Practical Example

```java
@TargetSystem("user-database")  // This is the TARGET - where business changes go
@Change(id = "user-migration", order = "20250207_01", author = "team-data")
public class UserMigration {
    
    @Execution
    public void migrate(MongoDatabase userDb) {  // Modifying TARGET system
        // Your business logic changes the target system
        MongoCollection<Document> users = userDb.getCollection("users");
        users.updateMany(
            Filters.eq("status", "inactive"),
            Updates.set("status", "archived")
        );
        // Flamingock automatically writes audit entry to AUDIT STORE
        // You don't interact with audit store directly
    }
}
```

**What happens during execution:**
1. **Target System**: Your code modifies user data in `user-database`
2. **Audit Store**: Flamingock automatically logs execution start, progress, and result to audit system
3. **CLI Access**: `flamingock audit list` reads from audit store, not target system

#### Audit Store Integrity

> **📝 Note for Documentation**: This clarifies Flamingock's safety guarantees regarding audit data integrity.

**Critical Design Principle**: Flamingock maintains complete safety as long as audit store integrity is preserved

**Audit Store Failures**: Standard infrastructure failures (network, database down, etc.) are handled gracefully:
- Flamingock stops execution safely
- No changes applied without proper audit tracking
- Manual intervention required to resolve infrastructure issues
- System remains in safe, known state

**Manual Audit Tampering**: The only scenario where inconsistencies could occur is if users manually alter audit log data:
- **This is strictly prohibited** and violates Flamingock's operational requirements
- **CLI Safety**: When audit maintenance is needed, use CLI operations (`audit fix`, etc.) which provide safety mechanisms and ensure system remains in stable state
- **User responsibility**: Direct database modifications to audit data are at user's own risk
- **System assumption**: Audit store data integrity is maintained through proper operational practices

**Flamingock's Safety Guarantee**: With proper operational practices (no manual audit tampering), Flamingock provides complete safety guarantees under all normal and failure scenarios.

### Target Systems and Transactionality

Flamingock works with two types of target systems based on their native transaction capabilities:

#### Transactional Target Systems
**Underlying Technology**: Systems that natively support ACID transactions
- **Examples**: PostgreSQL, MySQL, MongoDB (4.0+), Oracle
- **Native Capabilities**: Built-in rollback, atomicity, consistency guarantees
- **In Flamingock**: Changes can leverage native transactions via `@Change(transactional = true)`
- **Rollback Strategy**: Automatic (database handles it) or manual via `@RollbackExecution` when the change itself it's not transactional, despite being a transactional target system(like DDL operations in MySQL,a s we mentioned)

#### Non-Transactional Target Systems  
**Underlying Technology**: Systems that don't provide native transaction support
- **Examples**: Kafka, S3, ElasticSearch, REST APIs, File Systems, MongoDB (pre-4.0)
- **Native Capabilities**: No built-in rollback mechanism, no atomicity guarantees
- **In Flamingock**: All changes are `transactional = false` (cannot leverage what doesn't exist)
- **Rollback Strategy**: Manual only via `@RollbackExecution` (user-provided compensation logic)

**Key Distinction**: 
- **Native System Capability** ≠ **Flamingock Rollback Capability**
- Even non-transactional systems can have safe rollback **through Flamingock** via user-provided `@RollbackExecution` methods
- Flamingock provides rollback safety regardless of underlying system - the difference is **who provides the rollback logic** (database vs user code)

> Note: The @RollbackExecution method is highly recommended also in transactional changes, since it's used in cli operations like `undo`

#### Key Concept: Change-Level Transactionality

Even when targeting a transactional system, a change can be non-transactional. 

**Critical**: Transactional changes rely on automatic database rollback and won't execute @RollbackExecution methods.

```java
// Transactional change - relies on database rollback
@Change(id = "user-migration", order = "20250207_01", transactional = true, author = "team")
@TargetSystem("user-db")
public class UserMigration {
    
    @Execution
    public void migrate(MongoDatabase db) {
        // This runs within a transaction
        // Database handles rollback automatically on failure
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase db) {
        // This method is NOT executed for transactional changes on failure
        // Database automatic rollback handles it
        // But method is still recommended for CLI undo operations
    }
}

// Non-transactional change - requires explicit rollback
@TargetSystem("user-db") 
@Change(id = "schema-changes", order = "20250207_02", transactional = false, author = "dba-team")
public class SchemaChanges {
    
    @Execution  
    public void createTableAndIndexes(MongoDatabase db) {
        // DDL operations that can't be auto-rolled back
        db.createCollection("new_collection");
        
        MongoCollection<Document> collection = db.getCollection("new_collection");
        collection.createIndex(Indexes.ascending("email"));
        collection.createIndex(Indexes.ascending("createdAt"));
        
        // If this fails partially (e.g., collection created but indexes fail)
        // Database CAN'T automatically rollback DDL operations
        // Flamingock WILL execute the @RollbackExecution method
    }
    
    @RollbackExecution
    public void cleanup(MongoDatabase db) {
        // This method WILL be executed on failure for non-transactional changes
        // Manual cleanup of partially applied DDL changes
        try {
            db.getCollection("new_collection").drop();
        } catch (Exception e) {
            // Handle cleanup errors
        }
    }
}
```

**Why control transactionality per change?**
- **DDL operations need explicit rollback**: Even on transactional systems like MongoDB or MySQL, DDL operations (CREATE TABLE, CREATE INDEX, ALTER TABLE) often can't be rolled back by the database automatically and require manual cleanup via @RollbackExecution
- Some operations are too large for transactions (bulk operations)
- Some operations span multiple systems (distributed changes) 
- Performance optimization for read-heavy operations
- Legacy system compatibility

### Recovery Strategies

Flamingock provides two recovery strategies that users can choose:

#### MANUAL_INTERVENTION (Default)
**Philosophy**: "When in doubt, stop and alert."

- **When it activates**: Any failure where state is uncertain
- **What happens**: 
  - Execution stops
  - Issue is logged in audit
  - Requires human review via CLI or Cloud UI
- **Why it's default**: Prevents silent data corruption
- **Best for**: 
  - Critical data migrations
  - Non-idempotent operations
  - Systems where correctness > availability

**Example Configuration**:
```java
@TargetSystem("user-database")
@Change(id = "critical-user-migration", order = "20250207_01", author = "team-data")
// No @Recovery annotation needed - MANUAL_INTERVENTION is default
public class CriticalUserMigration {
    
    @Execution
    public void migrate(MongoDatabase database) {
        // Critical business logic migration
        MongoCollection<Document> users = database.getCollection("users");
        
        // Complex transformation that could fail in various ways
        users.updateMany(
            Filters.eq("status", "inactive"), 
            Updates.combine(
                Updates.set("status", "archived"),
                Updates.set("archivedDate", new Date()),
                Updates.unset("temporaryField")
            )
        );
        
        // If this fails, manual review is required to determine:
        // - How many users were actually updated?
        // - Was the update partial or complete?
        // - Is it safe to retry or should we roll back?
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // Rollback logic - highly recommended even for transactional changes
        // Used for CLI undo operations and non-transactional failure recovery
        MongoCollection<Document> users = database.getCollection("users");
        users.updateMany(
            Filters.eq("status", "archived"),
            Updates.set("status", "inactive")
        );
    }
}
```

#### ALWAYS_RETRY
**Philosophy**: "Keep trying until successful."

- **When it activates**: Any failure, regardless of state
- **What happens**: 
  - Automatic retry on next execution
  - No manual intervention required
  - Continues until successful
- **Why opt-in**: Requires idempotent operations
- **Best for**:
  - Idempotent operations
  - Event publishing
  - Cache warming
  - Non-critical updates

**Example Configuration**:
```java
@TargetSystem("redis-cache")
@Change(id = "cache-warming", order = "20250207_02", author = "team-platform")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class CacheWarmingChange {
    
    @Execution
    public void warmCache(RedisTemplate<String, Object> redis, UserRepository userRepo) {
        // Idempotent operation - safe to repeat
        List<User> activeUsers = userRepo.findActiveUsers();
        
        for (User user : activeUsers) {
            // SET operation is idempotent - same key gets same value
            redis.opsForValue().set(
                "user:" + user.getId(), 
                user.toJson(), 
                Duration.ofHours(24)
            );
        }
        
        // If this fails due to network issues, Redis unavailability, etc.
        // it's safe to retry because:
        // 1. SET operations are idempotent
        // 2. Cache warming doesn't affect business logic
        // 3. Worst case: cache is populated on next run
    }
    
    @RollbackExecution
    public void clearCache(RedisTemplate<String, Object> redis) {
        // Optional: Clear cache entries if needed for undo operations
        // Highly recommended for CLI undo functionality
        redis.delete("user:*");
    }
}
```

**More ALWAYS_RETRY Examples**:
```java
// Event publishing - idempotent with same event key
@TargetSystem("kafka-events")
@Change(id = "publish-user-events", order = "20250207_03", author = "team-events")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class PublishUserEvents {
    
    @Execution
    public void publishEvents(KafkaTemplate<String, Object> kafka) {
        List<UserEvent> events = prepareUserEvents();
        
        for (UserEvent event : events) {
            // Using same key ensures idempotency
            kafka.send("user-topic", event.getUserId(), event);
        }
    }
    
    @RollbackExecution
    public void rollback() {
        // For Kafka: Usually no rollback needed (events are immutable)
        // But method is recommended for CLI undo operations
        // Could publish compensating events if needed
    }
}

// CREATE IF NOT EXISTS - naturally idempotent
@Change(id = "create-indexes", order = "20250207_04", author = "team-dba", transactional = false)
@TargetSystem("user-database")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class CreateIndexes {
    
    @Execution
    public void createIndexes(MongoDatabase database) {
        MongoCollection<Document> users = database.getCollection("users");
        
        // createIndex is idempotent - creating same index multiple times is safe
        users.createIndex(Indexes.ascending("email"));
        users.createIndex(Indexes.compound(
            Indexes.ascending("status"), 
            Indexes.descending("createdAt")
        ));
    }
    
    @RollbackExecution
    public void dropIndexes(MongoDatabase database) {
        // Highly recommended for DDL operations
        // Used by CLI undo operations
        MongoCollection<Document> users = database.getCollection("users");
        try {
            users.dropIndex("email_1");
            users.dropIndex("status_1_createdAt_-1");
        } catch (Exception e) {
            // Handle index drop errors
        }
    }
}
```

### Important Note: @RollbackExecution Methods

**@RollbackExecution methods are highly recommended for all changes** even transactional ones:

1. **For transactional changes**: Not executed on failure (database handles rollback automatically), but used for CLI **undo operations** to reverse already-applied changes
2. **For non-transactional changes**: Executed automatically on failure to clean up partial changes
3. **CLI integration**: Essential for `flamingock undo` command functionality 
4. **Audit compliance**: Provides clear trail of how changes can be reversed

### Audit States

Every change unit execution results in one of these audit states:

#### Success States
- **EXECUTED**: Change completed successfully
- **ROLLED_BACK**: Change was successfully rolled back
- **MANUAL_MARKED_AS_EXECUTED**: Manually marked as completed via CLI after verification

#### Failure States (Create Issues)
- **STARTED**: Change began but never completed (crash/timeout)
- **EXECUTION_FAILED**: Change failed during execution
- **ROLLBACK_FAILED**: Rollback attempt failed

#### Resolution States
- **MANUAL_MARKED_AS_EXECUTED**: Issue resolved by marking as executed (via `audit fix`)
- **MANUAL_MARKED_AS_ROLLED_BACK**: Issue resolved by marking as rolled back

### Issue Detection

An "issue" is detected when:
1. Audit entry is in a failure state (STARTED, EXECUTION_FAILED, ROLLBACK_FAILED)
2. Change is required to run again (based on version/order)
3. Recovery strategy determines next action

## Recovery in Action

### Scenario 1: MongoDB Migration Failure

**Setup**: Migrating user documents, database connection drops mid-execution

**With MANUAL_INTERVENTION (default)**:
```
1. Change execution starts → Audit: STARTED
2. Connection drops → Execution fails
3. Audit updated → EXECUTION_FAILED
4. Issue created → Requires manual intervention
5. Developer investigates via CLI:
   $ flamingock issue get -c user-migration
6. Determines partial completion
7. Fixes data manually
8. Marks as resolved:
   $ flamingock audit fix -c user-migration --resolution EXECUTED
9. Next run skips this change (marked as executed)
```

**With ALWAYS_RETRY**:
```
1. Change execution starts → Audit: STARTED
2. Connection drops → Execution fails
3. Audit updated → EXECUTION_FAILED
4. Next run automatically retries
5. If idempotent, eventually succeeds
6. Audit updated → EXECUTED
```

### Scenario 2: Kafka Event Publishing

**Setup**: Publishing events to Kafka topic, broker unavailable

**Best Practice**: Use ALWAYS_RETRY
```java
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
@Change(id = "publish-user-events", order = "20250207_03")
public class PublishUserEvents {
    @Execution
    public void publish(KafkaProducer producer) {
        // Idempotent event publishing
        // Safe to retry multiple times
    }
}
```

### Scenario 3: Multi-System Update

**Setup**: Update MongoDB + publish to Kafka + update cache

**Best Practice**: MANUAL_INTERVENTION for safety
```java
@Change(id = "multi-system-update", order = "20250207_04")
// Default MANUAL_INTERVENTION ensures consistency
public class MultiSystemUpdate {
    @Execution
    public void update(MongoDatabase db, KafkaProducer kafka, Cache cache) {
        // Complex multi-system operation
        // Manual intervention ensures all systems are consistent
    }
}
```

## CLI and Resolution

### Issue Discovery

**List all issues** (reads from audit store):
```bash
$ flamingock issue list

ISSUES FOUND (2)
┌─────────────────────────┬─────────┬──────────────────┬──────────────┐
│ Change ID               │ State   │ Error            │ Target       │
├─────────────────────────┼─────────┼──────────────────┼──────────────┤
│ user-migration-v2       │ STARTED │ Execution        │ mongodb-prod │
│                         │         │ interrupted      │              │
│ cache-warming-q4        │ FAILED  │ Connection       │ redis-cache  │
│                         │         │ timeout          │              │
└─────────────────────────┴─────────┴──────────────────┴──────────────┘

# This data comes from the audit store, not the target systems
# Shows the state of change executions, not business data
```

**Get issue details**:
```bash
$ flamingock issue get -c user-migration-v2 --guidance

ISSUE DETAILS: user-migration-v2
State: STARTED
Strategy: MANUAL_INTERVENTION
Error: Execution interrupted unexpectedly

RESOLUTION GUIDANCE:
1. Check TARGET SYSTEM state (not audit store):
   - Verify partial changes in mongodb-prod target system
   - Check for incomplete transactions
   - Inspect actual business data state
   
2. Determine actual state:
   - If changes were applied → mark as executed in audit store
   - If no changes were made → mark as executed (skip) in audit store  
   - If partially applied → fix target system manually, then mark audit
   
3. Fix the AUDIT STORE state (not target system):
   $ flamingock audit fix -c user-migration-v2
```

### Manual Resolution

**Fix an issue** (marks as MANUAL_MARKED_AS_EXECUTED):
```bash
$ flamingock audit fix -c user-migration-v2

✅ Successfully fixed audit state for change unit 'user-migration-v2'
   Resolution: MANUAL_MARKED_AS_EXECUTED
   Next run will skip this change
```

## Cloud Edition Advantages

### Same Configuration, Better Outcomes

Cloud Edition uses the **same recovery strategies** (MANUAL_INTERVENTION and ALWAYS_RETRY) but provides **enhanced outcomes** through advanced mechanisms.

#### Enhanced MANUAL_INTERVENTION in Cloud
- **Automatic issue detection** with real-time alerts
- **Detailed diagnostic information** for faster resolution
- **Workflow automation** for common resolution patterns
- **Team collaboration** features for issue resolution

#### Enhanced ALWAYS_RETRY in Cloud
- **Intelligent retry backoff** prevents system overload
- **Marker mechanism** ensures safe retries in transactional systems
- **Automatic reconciliation** detects and resolves inconsistencies
- **Circuit breaker** patterns prevent cascading failures

### Marker Mechanism (Conceptual)

In transactional systems, Cloud Edition uses "markers" to ensure safety:

1. **Before execution**: Place marker in target system (within transaction)
2. **Execute change**: Apply changes
3. **After execution**: Update marker with result
4. **On failure**: Marker indicates whether changes were applied
5. **Recovery**: Use marker state to determine safe action

This allows Cloud Edition to **automatically resolve** many issues that would require manual intervention in Community Audit Stores.

### Enterprise Resilience Features

- **Multi-region support**: Coordinate changes across regions
- **Zero-downtime migrations**: Blue-green deployment patterns
- **Compliance reporting**: Audit trails for regulatory requirements
- **SLA guarantees**: Committed uptime and resolution times

## Competitive Differentiation

### vs Traditional Migration Tools

| Aspect                  | Flyway/Liquibase   | Mongock                | Flamingock              |
|-------------------------|--------------------|------------------------|-------------------------|
| **Focus**               | SQL databases      | MongoDB only           | All systems             |
| **Distributed Systems** | ❌ Not designed for | ❌ Limited              | ✅ First-class support   |
| **Non-transactional**   | ❌ No support       | ❌ Assumes transactions | ✅ Full support          |
| **Failure Handling**    | Retry blindly      | Retry blindly          | Configurable strategies |
| **Audit Trail**         | Basic              | Basic                  | Comprehensive           |
| **Issue Resolution**    | Manual SQL         | None                   | CLI + Cloud automation  |
| **Safety Default**      | None               | None                   | MANUAL_INTERVENTION     |

### Unique Value Propositions

1. **Only platform addressing distributed systems holistically**
   - Not just databases, but Kafka, S3, APIs, etc.
   - Coordinated changes across multiple systems

2. **Safety-first design philosophy**
   - Default to manual intervention
   - Explicit opt-in for automatic retry
   - Never corrupt silently

3. **Enterprise-grade audit and compliance**
   - Complete audit trail
   - Issue tracking and resolution
   - Compliance reporting (Cloud)

4. **Progressive enhancement model**
   - Community: Essential safety
   - Cloud: Same config, better outcomes
   - No vendor lock-in

## Key Messages for Documentation

### For Developers
- "Flamingock protects you from silent failures"
- "Choose your recovery strategy based on your operation's idempotency"
- "The CLI gives you full control when automation isn't safe"

### For Architects
- "Built for distributed systems, not just databases"
- "Safety by default, flexibility when needed"
- "Cloud Edition enhances your existing configuration"

### For Management
- "Prevent costly production incidents"
- "Complete audit trail for compliance"
- "Progressive investment: Community → Cloud as you scale"

### For DevOps
- "Deterministic state in all environments"
- "CLI integration for CI/CD pipelines"
- "Cloud Edition for zero-downtime migrations"

## Common Patterns and Best Practices

### Pattern 1: Idempotent by Design
Make changes idempotent when possible, then use ALWAYS_RETRY:
```java
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class IdempotentChange {
    @Execution
    public void execute() {
        // INSERT ... ON CONFLICT DO NOTHING
        // PUT with same key-value
        // CREATE IF NOT EXISTS
    }
}
```

### Pattern 2: Critical Path Protection
Keep MANUAL_INTERVENTION for critical data paths:
```java
// No @Recovery annotation - defaults to MANUAL_INTERVENTION
public class CriticalDataMigration {
    @Execution
    public void migrate() {
        // Financial transactions
        // User authentication data
        // Compliance-related changes
    }
}
```

### Pattern 3: Progressive Migration
Start with MANUAL_INTERVENTION, move to ALWAYS_RETRY after validation:
```java
// Phase 1: Manual intervention during initial rollout
@Change(id = "feature-v1", order = "20250207_01", author = "team-feature")
public class FeatureRollout {
    @Execution
    public void rolloutFeature(FeatureService service) {
        // New feature logic
        // Defaults to MANUAL_INTERVENTION for safety
        service.enableFeatureForBetaUsers();
    }
}

// Phase 2: After validation, same change with retry
@Change(id = "feature-v1-stable", order = "20250207_02", author = "team-feature")
@Recovery(strategy = RecoveryStrategy.ALWAYS_RETRY)
public class FeatureRolloutStable {
    @Execution
    public void rolloutFeatureStable(FeatureService service) {
        // Same logic, now proven stable
        // Safe to retry automatically
        service.enableFeatureForAllUsers();
    }
}
```

### Pattern 4: Transactional vs Non-Transactional Strategy
```java
// Large bulk operation - non-transactional for performance
@Change(id = "bulk-user-update", order = "20250207_05", 
           author = "team-data", transactional = false)
@TargetSystem("user-database")
@Recovery(strategy = RecoveryStrategy.MANUAL_INTERVENTION)  
public class BulkUserUpdate {
    
    @Execution
    public void updateUsers(MongoDatabase database) {
        MongoCollection<Document> users = database.getCollection("users");
        
        // Process 1M+ users without transaction for performance
        // If this fails, manual intervention needed to check progress
        users.updateMany(
            Filters.exists("oldField"),
            Updates.combine(
                Updates.set("newField", "migrated"),
                Updates.unset("oldField")
            )
        );
    }
    
    @RollbackExecution
    public void rollbackUpdate(MongoDatabase database) {
        // Essential for non-transactional changes
        // Will be executed automatically on failure
        MongoCollection<Document> users = database.getCollection("users");
        users.updateMany(
            Filters.exists("newField"),
            Updates.combine(
                Updates.set("oldField", "original_value"),
                Updates.unset("newField")
            )
        );
    }
}

// Small critical operation - transactional for safety
@Change(id = "admin-permissions", order = "20250207_06", 
           author = "team-security", transactional = true)
@TargetSystem("user-database") 
@Recovery(strategy = RecoveryStrategy.MANUAL_INTERVENTION)
public class AdminPermissions {
    
    @Execution
    public void updatePermissions(MongoDatabase database) {
        // Critical security change - runs in transaction
        // Automatic rollback if any part fails
        MongoCollection<Document> users = database.getCollection("users");
        MongoCollection<Document> roles = database.getCollection("roles");
        
        // All or nothing - transaction ensures consistency
        users.updateMany(Filters.eq("role", "admin"), 
                        Updates.set("permissions", Arrays.asList("read", "write", "admin")));
        roles.updateOne(Filters.eq("name", "admin"),
                       Updates.set("maxUsers", 10));
    }
    
    @RollbackExecution  
    public void rollbackPermissions(MongoDatabase database) {
        // Recommended even for transactional changes
        // Not executed on failure (transaction handles it)
        // Used for CLI undo operations on successfully applied changes
        MongoCollection<Document> users = database.getCollection("users");
        MongoCollection<Document> roles = database.getCollection("roles");
        
        users.updateMany(Filters.eq("role", "admin"),
                        Updates.set("permissions", Arrays.asList("read")));
        roles.updateOne(Filters.eq("name", "admin"),
                       Updates.set("maxUsers", 5));
    }
}
```

## FAQ for Documentation

**Q: Why is MANUAL_INTERVENTION the default?**
A: Safety first. It's better to stop and investigate than to corrupt data. You can always opt into ALWAYS_RETRY for idempotent operations.

**Q: When should I use ALWAYS_RETRY?**
A: When your operation is idempotent and safe to repeat multiple times. Examples: cache warming, event publishing, creating resources with IF NOT EXISTS.

**Q: How does Cloud Edition improve recovery without new strategies?**
A: Cloud Edition uses the same strategies but adds mechanisms like markers, intelligent backoff, and automatic reconciliation to resolve issues that would require manual intervention in Community Audit Stores.

**Q: Can I change recovery strategy after deployment?**
A: Yes, you can change the strategy in your code and redeploy. Existing audit entries maintain their state.

**Q: What happens if I don't handle an issue?**
A: With MANUAL_INTERVENTION, Flamingock will skip the problematic change and continue with others (if configured). The issue remains in the audit for resolution.

**Q: How do I know if my operation is idempotent?**
A: If running it multiple times produces the same result as running it once, it's idempotent. When in doubt, use MANUAL_INTERVENTION.

**Q: What's the difference between Target System and Audit Store?**
A: **Target Systems** are your business databases/services where changes are applied. **Audit Store** is Flamingock's tracking system. Your code modifies target systems; Flamingock automatically tracks everything in the audit store. CLI commands read from audit store, not target systems.

**Q: What happens if the audit store fails but target system succeeds?**
A: Your business change succeeds, but Flamingock can't track it. This creates an "invisible" change that may be re-attempted on next run. This is why audit store reliability is critical for proper recovery management.

## Summary

Flamingock's recovery and safety mechanisms represent a fundamental shift in how we handle distributed system evolution:

1. **Safety by default** through MANUAL_INTERVENTION
2. **Explicit flexibility** with ALWAYS_RETRY for idempotent operations  
3. **Complete visibility** through comprehensive audit trails
4. **Progressive enhancement** from Community to Cloud

This approach may seem more complex than "fire and forget" tools, but it's the only way to handle 100% of real-world cases, not just the easy 70%.

**The bottom line**: Flamingock ensures your distributed systems evolve safely, with full audit trails, and always in a known state — regardless of what failures occur.