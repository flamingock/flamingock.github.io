---
title: Best Practices
sidebar_position: 4
---

# ChangeUnit Best Practices

Following these proven patterns will help you create reliable, maintainable ChangeUnits that work safely in production environments.

## Core principles

### Treat ChangeUnits as immutable

Once a ChangeUnit is deployed, never modify it. Create new ChangeUnits for corrections.

**❌ Don't do this:**
```java
// Modifying an existing ChangeUnit after deployment
@ChangeUnit(id = "add-user-field", order = "0001", author = "team")
public class _0001_AddUserField {
    @Execution  
    public void execute(MongoDatabase db) {
        // Original: db.getCollection("users").updateMany(/* add field */)
        // Modified: db.getCollection("users").updateMany(/* different logic */)
    }
}
```

**✅ Do this instead:**
```java
// Keep the original unchanged
@ChangeUnit(id = "add-user-field", order = "0001", author = "team")
public class _0001_AddUserField {
    @Execution
    public void execute(MongoDatabase db) {
        // Original logic remains unchanged
    }
}

// Create a new ChangeUnit for corrections
@ChangeUnit(id = "fix-user-field-values", order = "0002", author = "team")
public class _0002_FixUserFieldValues {
    @Execution
    public void execute(MongoDatabase db) {
        // Correction logic
    }
}
```

### Always provide rollback logic

Every ChangeUnit must have a `@RollbackExecution` method, regardless of target system type.

**Why rollback matters:**
- **Non-transactional systems**: Automatic cleanup on failure
- **All systems**: CLI/UI undo operations
- **Safety**: Proves you understand the change impact
- **Governance**: Required for audit compliance

**Example with comprehensive rollback:**
```java
@ChangeUnit(id = "setup-user-indexes", order = "0001", author = "db-team")
public class _0001_SetupUserIndexes {
    
    @Execution
    public void execute(MongoDatabase database) {
        MongoCollection<Document> users = database.getCollection("users");
        
        // Create compound index for user queries
        users.createIndex(
            new Document("email", 1).append("status", 1),
            new IndexOptions().name("idx_user_email_status").unique(false)
        );
        
        // Create text index for search
        users.createIndex(
            new Document("firstName", "text").append("lastName", "text"),
            new IndexOptions().name("idx_user_search")
        );
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        MongoCollection<Document> users = database.getCollection("users");
        
        // Drop indexes in reverse order
        try {
            users.dropIndex("idx_user_search");
        } catch (Exception e) {
            // Index might not exist - log but continue
        }
        
        try {
            users.dropIndex("idx_user_email_status");  
        } catch (Exception e) {
            // Index might not exist - log but continue
        }
    }
}
```

### Keep scope focused

Each ChangeUnit should address one logical change. Avoid combining unrelated operations.

**❌ Avoid mixing concerns:**
```java
@ChangeUnit(id = "big-refactor", order = "0001", author = "team")
public class _0001_BigRefactor {
    @Execution
    public void execute(MongoDatabase db, KafkaProducer producer) {
        // Adding user field
        db.getCollection("users").updateMany(/* ... */);
        
        // Creating Kafka topic  
        producer.send(/* create topic message */);
        
        // Updating configuration
        db.getCollection("config").updateOne(/* ... */);
    }
}
```

**✅ Separate concerns:**
```java
@TargetSystem("user-database")
@ChangeUnit(id = "add-user-status", order = "0001", author = "team")
public class _0001_AddUserStatus {
    // Focus: User schema change only
}

@TargetSystem("kafka-events")
@ChangeUnit(id = "create-user-topic", order = "0001", author = "team") 
public class _0001_CreateUserTopic {
    // Focus: Kafka topic creation only
}
```

## Technical guidelines

### Design for idempotency

Make operations safe to re-run whenever possible.

**Example: Idempotent field addition:**
```java
@ChangeUnit(id = "add-user-preferences", order = "0001", author = "team")
public class _0001_AddUserPreferences {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Only update users that don't already have preferences
        database.getCollection("users").updateMany(
            new Document("preferences", new Document("$exists", false)),
            new Document("$set", new Document("preferences", getDefaultPreferences()))
        );
    }
    
    private Document getDefaultPreferences() {
        return new Document()
            .append("theme", "light")
            .append("notifications", true);
    }
}
```

### Handle errors gracefully

Don't catch exceptions unless you have specific recovery logic. Let Flamingock handle error management.

**❌ Don't suppress errors:**
```java
@Execution
public void execute(MongoDatabase database) {
    try {
        // Some operation
        database.getCollection("users").updateMany(/* ... */);
    } catch (Exception e) {
        // Silently ignoring errors prevents proper error handling
        System.out.println("Error occurred: " + e.getMessage());
    }
}
```

**✅ Let exceptions bubble up:**
```java
@Execution  
public void execute(MongoDatabase database) {
    // Let Flamingock handle exceptions and recovery
    database.getCollection("users").updateMany(/* ... */);
}
```

### Use meaningful method names

Method names should clearly indicate their purpose.

**Good examples:**
```java
@Execution
public void migrateUserProfilesToNewSchema(MongoDatabase db) { }

@Execution  
public void addEmailIndexForFasterLookups(MongoDatabase db) { }

@RollbackExecution
public void removeEmailIndexAndRevertSchema(MongoDatabase db) { }
```

### Avoid domain objects

Don't use domain objects in ChangeUnits. Since ChangeUnits are immutable and your domain evolves, using domain classes can cause compilation errors when fields are removed or modified in newer versions. Instead, work with primitive types, collections, or framework-native objects like `Document` for MongoDB.


## Naming and organization

### Follow consistent naming patterns

**File names:**
- Use `_XXXX_DescriptiveName` format
- Match the order in `@ChangeUnit` annotation
- Use PascalCase for class names

**Good examples:**
```
_0001_CreateUserIndexes.java
_0002_MigrateUserData.java
_0003_AddUserPreferences.java
_0100_OptimizeUserQueries.java
```

### Use descriptive IDs and descriptions

Make your ChangeUnits self-documenting:

```java
@ChangeUnit(
    id = "migrate-legacy-user-format-to-v2",
    order = "0001",
    author = "data-migration-team", 
    description = "Migrate user documents from legacy format to v2 schema with new preference structure"
)
```

### Organize by chronological order

ChangeUnits should be organized chronologically by their order within stages. If you need logical grouping, use stages - but remember that execution order is only guaranteed within a stage, not between stages.

```
src/main/java/com/company/changes/
├── _0001_CreateUserCollection.java
├── _0002_AddUserIndexes.java  
├── _0003_MigrateUserData.java
├── _0004_CreateOrdersTable.java
└── _0005_AddOrderStatusColumn.java
```

## Testing and validation

### Test both execution and rollback

Create comprehensive tests for your ChangeUnits:

```java
@Test
public void testUserMigrationChangeUnit() {
    // Arrange
    MongoDatabase testDb = getTestDatabase();
    insertTestUsers(testDb);
    
    _0001_MigrateUsers changeUnit = new _0001_MigrateUsers();
    
    // Act - Test execution
    changeUnit.execute(testDb);
    
    // Assert - Verify execution results
    MongoCollection<Document> users = testDb.getCollection("users");
    assertEquals(5, users.countDocuments(new Document("status", "active")));
    
    // Act - Test rollback  
    changeUnit.rollback(testDb);
    
    // Assert - Verify rollback results
    assertEquals(0, users.countDocuments(new Document("status", new Document("$exists", true))));
}
```

### Validate with real-like data

Test with data that resembles production:

```java
@Test
public void testWithRealisticData() {
    // Use realistic data volumes and edge cases
    insertUsers(1000);  // Test batch processing
    insertUsersWithMissingFields(); // Test data inconsistencies
    insertUsersWithEdgeCaseValues(); // Test boundary conditions
    
    // Run your ChangeUnit
    changeUnit.execute(database);
    
    // Verify all scenarios handled correctly
}
```


## Next steps

- **[Templates](../templates/introduction)** - Explore reusable change patterns
- **[Target Systems](../target-systems/introduction)** - Configure where changes are applied
- **[Testing](../testing/introduction)** - Comprehensive testing strategies for ChangeUnits