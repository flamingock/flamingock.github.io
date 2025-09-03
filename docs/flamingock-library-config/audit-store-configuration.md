---
title: Audit Store Configuration
sidebar_position: 5
---

# Audit Store Configuration
*How to configure Flamingock's audit store for tracking and compliance*

The audit store is Flamingock's dedicated system for tracking execution history, managing distributed locking, and ensuring compliance. This guide covers configuration options for different audit store implementations.

> **Conceptual Overview**: For architectural understanding of audit store vs target systems, see [Target Systems vs Audit Store Architecture](../overview/audit-store-vs-target-system.md).

---

## Audit Store Fundamentals

### What the Audit Store Tracks
- **Execution History**: Which ChangeUnits ran, when, and with what outcome
- **Distributed Locking**: Prevents concurrent executions across multiple instances
- **Issue Tracking**: Failed or uncertain executions requiring resolution
- **Metadata**: Authors, environments, execution context

### Audit Store vs Target Systems
- **Audit Store**: Managed automatically by Flamingock framework (never modified by your code)
- **Target Systems**: Modified by your business logic in `@Execution` methods
- **Independence**: Audit integrity maintained even if target systems fail

---

## Community Edition Audit Store Options

### MongoDB Audit Store

#### Basic Configuration
```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(MongoTemplate mongoTemplate) {
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(mongoTemplate))
            .addMigrationClass(MyChangeUnits.class)
            .build();
    }
}
```

#### Advanced MongoDB Configuration
```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock() {
        // Create dedicated audit store connection
        MongoClientSettings settings = MongoClientSettings.builder()
            .applyConnectionString(ConnectionString.create("mongodb://audit-db:27017/flamingock-audit"))
            .writeConcern(WriteConcern.MAJORITY)  // Ensure audit durability
            .readConcern(ReadConcern.MAJORITY)    // Consistent audit reads
            .build();
        
        MongoClient auditClient = MongoClients.create(settings);
        MongoTemplate auditTemplate = new MongoTemplate(auditClient, "flamingock-audit");
        
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(auditTemplate))
            .addMigrationClass(MyChangeUnits.class)
            .build();
    }
}
```

#### MongoDB Collections Structure
Flamingock automatically creates these collections in your audit store:

- **`changeLog`**: Execution history and state tracking
- **`locks`**: Distributed locking for concurrent safety
- **`issues`**: Failed executions requiring resolution

### DynamoDB Audit Store

#### Basic DynamoDB Configuration
```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(DynamoDbClient dynamoDbClient) {
        DynamoConnectionRepository connectionRepository = 
            new DynamoConnectionRepository(dynamoDbClient)
                .withTablePrefix("flamingock-")  // Optional: prefix for table names
                .withRegion(Region.US_EAST_1);   // Optional: specify region
        
        return Flamingock.builder()
            .setConnectionRepository(connectionRepository)
            .addMigrationClass(MyChangeUnits.class)
            .build();
    }
}
```

#### DynamoDB Tables Structure
Flamingock automatically creates these tables:

- **`flamingock-changeLog`**: Execution history
- **`flamingock-locks`**: Distributed locking
- **`flamingock-issues`**: Issue tracking

### Couchbase Audit Store

#### Basic Couchbase Configuration
```java
@Configuration  
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock() {
        Cluster cluster = Cluster.connect("localhost", "username", "password");
        Bucket bucket = cluster.bucket("flamingock-audit");
        
        CouchbaseConnectionRepository connectionRepository = 
            new CouchbaseConnectionRepository(bucket)
                .withScope("audit-scope")        // Optional: custom scope
                .withCollection("change-log");   // Optional: custom collection
        
        return Flamingock.builder()
            .setConnectionRepository(connectionRepository)
            .addMigrationClass(MyChangeUnits.class)
            .build();
    }
}
```

---

## Audit Store Configuration Options

### Write Concern and Durability
Critical for audit integrity - ensure changes are durably persisted:

```java
// MongoDB with strong consistency
MongoClientSettings settings = MongoClientSettings.builder()
    .writeConcern(WriteConcern.MAJORITY)     // Wait for majority acknowledgment
    .readConcern(ReadConcern.MAJORITY)       // Read from majority
    .readPreference(ReadPreference.primary()) // Always read from primary
    .build();

// DynamoDB with consistent reads
DynamoConnectionRepository connectionRepository = 
    new DynamoConnectionRepository(dynamoDbClient)
        .withConsistentRead(true)            // Enable strong consistency
        .withWriteCapacity(25)               // Provision appropriate capacity
        .withReadCapacity(25);
```

### Collection/Table Naming
Customize audit store object names:

```java
// MongoDB custom collection names
MongoConnectionRepository connectionRepository = 
    new MongoConnectionRepository(mongoTemplate)
        .withChangeLogCollectionName("execution_history")
        .withLockCollectionName("distributed_locks")
        .withIssuesCollectionName("failed_executions");

// DynamoDB custom table names  
DynamoConnectionRepository connectionRepository = 
    new DynamoConnectionRepository(dynamoDbClient)
        .withChangeLogTableName("ExecutionHistory")
        .withLockTableName("DistributedLocks")
        .withIssuesTableName("FailedExecutions");
```

### Index Optimization
Flamingock automatically creates necessary indexes, but you can optimize:

```javascript
// MongoDB: Additional indexes for query performance
db.changeLog.createIndex({ "targetSystem": 1, "executionDate": -1 })
db.changeLog.createIndex({ "author": 1, "status": 1 })
db.issues.createIndex({ "createdAt": -1, "status": 1 })
```

---

## Separation Patterns

### Pattern 1: Same Database as Target System
Simplest setup - audit and business data in same database:

```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(@Qualifier("businessDatabase") MongoTemplate mongoTemplate) {
        // Both audit store and target system use same database
        // Benefits: Single database to manage, reduced infrastructure complexity
        // Important: Even with same database, audit and changes use separate transactions
        // Trade-offs: Mixed concerns, shared resource limits
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(mongoTemplate))
            .addMigrationClass(BusinessChangeUnits.class)
            .build();
    }
}
```

### Pattern 2: Dedicated Audit Database
Best practice - separate audit store from business systems:

```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(@Qualifier("auditDatabase") MongoTemplate auditTemplate,
                                @Qualifier("businessDatabase") MongoTemplate businessTemplate) {
        // Audit store: dedicated database for compliance and tracking
        // Target systems: business databases
        // Benefits: Clear separation, independent scaling, compliance isolation
        return Flamingock.builder()
            .setConnectionRepository(new MongoConnectionRepository(auditTemplate))
            .addDependency("businessDatabase", businessTemplate)
            .addMigrationClass(BusinessChangeUnits.class)
            .build();
    }
}
```

### Pattern 3: Cloud Edition
Managed audit store with enhanced capabilities:

```java
@Configuration
public class FlamingockConfig {
    
    @Bean
    public Flamingock flamingock(@Value("${flamingock.cloud.api-key}") String apiKey) {
        // Audit store: Fully managed Flamingock Cloud backend
        // Target systems: Your business systems
        // Benefits: Zero ops, advanced features, enterprise governance
        return Flamingock.builder()
            .setConnectionRepository(new CloudConnectionRepository(apiKey))
            .addMigrationClass(BusinessChangeUnits.class)
            .build();
    }
}
```

---

## Security and Access Control

### Audit Store Security
Protect audit integrity with proper access controls:

```java
// MongoDB with authentication and SSL
MongoClientSettings settings = MongoClientSettings.builder()
    .applyConnectionString(ConnectionString.create(
        "mongodb://audit-user:secure-password@audit-cluster:27017/flamingock-audit" +
        "?authSource=admin&ssl=true&replicaSet=audit-rs"))
    .sslSettings(SslSettings.builder()
        .enabled(true)
        .invalidHostNameAllowed(false)
        .build())
    .build();
```

### Role-Based Access
Define appropriate database roles:

```javascript
// MongoDB: Audit store user with minimal required permissions
db.createUser({
    user: "flamingock-audit",
    pwd: "secure-password",
    roles: [
        {
            role: "readWrite",
            db: "flamingock-audit"
        },
        {
            role: "dbAdmin",  // For index creation
            db: "flamingock-audit"
        }
    ]
});
```

### Network Security
Isolate audit store network access:

```yaml
# Docker Compose example with network isolation
services:
  audit-database:
    image: mongo:7
    networks:
      - audit-network
    environment:
      MONGO_INITDB_ROOT_USERNAME: audit-admin
      MONGO_INITDB_ROOT_PASSWORD: secure-password
  
  app:
    networks:
      - audit-network
      - business-network
```

---

## Performance and Scaling

### Connection Pooling
Optimize audit store connections:

```java
// MongoDB connection pool settings
MongoClientSettings settings = MongoClientSettings.builder()
    .applyToConnectionPoolSettings(builder ->
        builder.maxSize(20)                    // Max connections
               .minSize(5)                     // Min connections
               .maxWaitTime(10, TimeUnit.SECONDS)
               .maxConnectionIdleTime(30, TimeUnit.SECONDS))
    .build();
```

### Write Performance Optimization
Balance consistency with performance:

```java
// For high-throughput scenarios
MongoConnectionRepository connectionRepository = 
    new MongoConnectionRepository(mongoTemplate)
        .withBatchSize(100)              // Batch audit writes
        .withAsyncWrites(true)           // Non-blocking audit writes
        .withRetryPolicy(RetryPolicy.exponentialBackoff());
```

### Monitoring and Metrics
Track audit store health:

```java
@Component
public class AuditStoreMonitoring {
    
    @EventListener
    public void onAuditWrite(AuditWriteEvent event) {
        // Track audit store performance metrics
        meterRegistry.timer("flamingock.audit.write.duration")
                    .record(event.getDuration());
        
        if (event.hasFailed()) {
            meterRegistry.counter("flamingock.audit.write.failures")
                        .increment();
        }
    }
}
```

---

## Backup and Recovery

### Audit Store Backup Strategy
Protect your compliance and execution history:

```bash
#!/bin/bash
# MongoDB audit store backup script
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mongodump --host audit-cluster:27017 \
         --db flamingock-audit \
         --out /backups/flamingock-audit-$TIMESTAMP \
         --gzip

# Retention: Keep 30 days of backups
find /backups -name "flamingock-audit-*" -mtime +30 -exec rm -rf {} \;
```

### Disaster Recovery
Restore audit store from backup:

```bash
#!/bin/bash
# Restore audit store from backup
BACKUP_DATE="20241201_143000"
mongorestore --host audit-cluster:27017 \
            --db flamingock-audit \
            --gzip \
            /backups/flamingock-audit-$BACKUP_DATE/flamingock-audit

# Verify restoration
mongo audit-cluster:27017/flamingock-audit --eval "db.changeLog.count()"
```

---

## Troubleshooting Audit Store Issues

### Common Configuration Problems

#### Connection Issues
```
Error: Unable to connect to audit store
Solution: Verify connection string, network access, and authentication credentials
```

#### Permission Errors
```
Error: Insufficient permissions to create collections/tables
Solution: Grant necessary database permissions to Flamingock user
```

#### Index Creation Failures
```
Error: Failed to create audit store indexes
Solution: Ensure dbAdmin privileges or create indexes manually
```

### Diagnostic Commands
```bash
# Verify audit store connectivity
flamingock test-connection --audit-store

# Check audit store schema
flamingock audit verify-schema

# Monitor audit store performance
flamingock audit stats --since "1 hour ago"

# Repair corrupted audit entries (use with caution)
flamingock audit repair --dry-run
```

### Health Checks
Implement audit store health monitoring:

```java
@Component
public class AuditStoreHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Test audit store connectivity
            auditStore.testConnection();
            
            // Verify recent write capability
            auditStore.writeHealthCheck();
            
            return Health.up()
                        .withDetail("audit-store", "Available")
                        .build();
        } catch (Exception e) {
            return Health.down()
                        .withDetail("audit-store", "Unavailable")
                        .withException(e)
                        .build();
        }
    }
}
```

---

**Key Takeaway**: Proper audit store configuration is critical for Flamingock's safety guarantees, compliance capabilities, and operational reliability. Choose the configuration pattern that best matches your architecture and operational requirements.