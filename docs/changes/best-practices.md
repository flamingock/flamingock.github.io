---
title: Best Practices
sidebar_position: 4
---

# Change Best Practices

Following these proven patterns will help you create reliable, maintainable Changes that work safely in production environments.

## Core principles

### Treat Changes as immutable

Once a Change is deployed, never modify it. Create new Changes for corrections.

**❌ Don't do this:**
```java
// Modifying an existing Change after deployment
@Change(id = "add-user-field", author = "team")  // order extracted from filename
public class _20250923_01_AddUserField {
    @Apply
    public void apply(MongoDatabase db) {
        // Original: db.getCollection("users").updateMany(/* add field */)
        // Modified: db.getCollection("users").updateMany(/* different logic */)
    }
}
```

**✅ Do this instead:**
```java
// Keep the original unchanged
@Change(id = "add-user-field", author = "team")  // order extracted from filename
public class _20250923_01_AddUserField {
    @Apply
    public void apply(MongoDatabase db) {
        // Original logic remains unchanged
    }
}

// Create a new Change for corrections
@Change(id = "fix-user-field-values", author = "team")  // order extracted from filename
public class _20250923_02_FixUserFieldValues {
    @Apply
    public void apply(MongoDatabase db) {
        // Correction logic
    }
}
```
---

### Avoid domain object coupling

Building on the idea of immutability, another common pitfall is coupling Changes too tightly to domain objects. Changes are historical records that must remain stable over time, even as your application evolves. When Changes depend on domain classes that later change (fields removed, renamed, or restructured), your previously successful Changes can break compilation or execution.

**The issue:** If a Change uses a `Customer` domain class and you later remove the `middleName` field from that class, the Change will no longer compile - breaking Flamingock's ability to verify or re-execute historical changes.

**✅ Use generic structures instead:**
```java
// Instead of domain objects, use framework-native structures
@Apply
public void apply(JdbcTemplate jdbc) {
    Map<String, Object> customer = jdbc.queryForMap(
        "SELECT * FROM customers WHERE id = ?", customerId
    );
    // Work with the Map directly, not a Customer object
}
```

→ **Learn more:** [Domain Coupling and Historical Immutability](domain-coupling.md) - Understand why this happens and explore different approaches to keep your Changes stable.

---

### Always provide rollback logic

Every Change must have a `@Rollback` method, regardless of target system type.

**Why rollback matters:**
- **Non-transactional systems**: Automatic cleanup on failure
- **All systems**: CLI/UI undo operations
- **Safety**: Proves you understand the change impact
- **Governance**: Required for audit compliance

**Example with comprehensive rollback:**
```java
@Change(id = "setup-user-indexes", author = "db-team")  // order extracted from filename
public class _20250923_01_SetupUserIndexes {
    
    @Apply
    public void apply(MongoDatabase database) {
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
    
    @Rollback
    public void rollback(MongoDatabase database) {
        MongoCollection<Document> users = database.getCollection("users");

        // Drop only if the index exists
        if (isIndexCreated(users, "idx_user_search")) {
            users.dropIndex("idx_user_search");
        }

        if (isIndexCreated(users, "idx_user_email_status")) {
            users.dropIndex("idx_user_email_status");
        }
    }
}
```

---

### Keep scope focused

Each Change should address one logical change. Avoid combining unrelated operations.

**❌ Avoid mixing concerns:**
```java
@Change(id = "big-refactor", author = "team")  // order extracted from filename
public class _20250923_01_BigRefactor {
    @Apply
    public void apply(MongoDatabase db, KafkaProducer producer) {
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
@Change(id = "add-user-status", author = "team")  // order extracted from filename
public class _20250923_01_AddUserStatus {
    // Focus: User schema change only
}

@TargetSystem("kafka-events")
@Change(id = "create-user-topic", author = "team")  // order extracted from filename
public class _20250923_01_CreateUserTopic {
    // Focus: Kafka topic creation only
}
```

## Technical guidelines

### Design for idempotency

Make operations safe to re-run whenever possible.

**Example: Idempotent field addition:**
```java
@Change(id = "add-user-preferences", author = "team")  // order extracted from filename
public class _20250923_01_AddUserPreferences {
    
    @Apply
    public void apply(MongoDatabase database) {
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


---

### Handle errors gracefully

Don't catch exceptions unless you have specific recovery logic. Let Flamingock handle error management.

**❌ Don't suppress errors:**
```java
@Apply
public void apply(MongoDatabase database) {
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
@Apply
public void apply(MongoDatabase database) {
    // Let Flamingock handle exceptions and recovery
    database.getCollection("users").updateMany(/* ... */);
}
```


---

### Use meaningful method names

Method names should clearly indicate their purpose.

**Good examples:**
```java
@Apply
public void migrateUserProfilesToNewSchema(MongoDatabase db) { }

@Apply  
public void addEmailIndexForFasterLookups(MongoDatabase db) { }

@Rollback
public void removeEmailIndexAndRevertSchema(MongoDatabase db) { }
```

## Naming and organization

### Follow consistent naming patterns

**File names:**
- Use `_ORDER_DescriptiveName` format where ORDER is extracted between first and last underscores
- **Recommended format**: `YYYYMMDD_NN` where:
  - YYYY = year, MM = month, DD = day
  - NN = sequence number (01-99) for changes on the same day
- When using this naming pattern, the order in `@Change` annotation or YAML is optional
- Use PascalCase for class names

**Good examples:**
```
_20250923_01_CreateUserIndexes.java
_20250923_02_MigrateUserData.java
_20250924_01_AddUserPreferences.java
_20250925_01_OptimizeUserQueries.java
_20250930_01_MigrateToNewFormat.yaml
```

:::tip Recommendation
We recommend specifying the order in the file/class name using the `YYYYMMDD_NN` format:

**Benefits:**
- **Natural chronological sorting** - Files automatically sort by date in folders
- **Clear timeline visibility** - Instantly see when changes were created
- **Practical daily limit** - 99 changes per day is more than sufficient
- **Easy identification** - Quick visual scan shows change history
- **No annotation needed** - Order is extracted from filename

Examples:
- `_20250923_01_CreateUserTable.java` → order: "20250923_01" (no need for order in @Change)
- `_20250923_02_MigrateData.yaml` → order: "20250923_02" (no need for order in YAML)
- `_20250924_01_AddIndexes.java` → order: "20250924_01"
:::


For detailed rules about order field placement (filename vs annotation), see [Anatomy & Structure - Order](./anatomy-and-structure#order---execution-sequence).

---

### Use descriptive IDs and descriptions

Make your Changes self-documenting:

```java
@Change(
    id = "migrate-legacy-user-format-to-v2",
    order = "20250923_01",
    author = "data-migration-team",
    description = "Migrate user documents from legacy format to v2 schema with new preference structure"
)
```


---

### Organize by chronological order

Changes should be organized chronologically by their order within stages. If you need logical grouping, use stages - but remember that execution order is only guaranteed within a stage, not between stages.

```
src/main/java/com/company/changes/
├── _20250923_01_CreateUserCollection.java
├── _20250923_02_AddUserIndexes.java
├── _20250924_01_MigrateUserData.java
├── _20250924_02_CreateOrdersTable.java
└── _20250925_01_AddOrderStatusColumn.java
```

## Testing and validation

### Test both execution and rollback

Create comprehensive tests for your Changes:

```java
@Test
public void testUserMigrationChange() {
    // Arrange
    MongoDatabase testDb = getTestDatabase();
    insertTestUsers(testDb);
    
    var change = new _20250923_01_MigrateUsers();
    
    // Act - Test execution
    change.execute(testDb);
    
    // Assert - Verify execution results
    MongoCollection<Document> users = testDb.getCollection("users");
    assertEquals(5, users.countDocuments(new Document("status", "active")));
    
    // Act - Test rollback  
    change.rollback(testDb);
    
    // Assert - Verify rollback results
    assertEquals(0, users.countDocuments(new Document("status", new Document("$exists", true))));
}
```


---

### Validate with real-like data

Test with data that resembles production:

```java
@Test
public void testWithRealisticData() {
    // Use realistic data volumes and edge cases
    insertUsers(1000);  // Test batch processing
    insertUsersWithMissingFields(); // Test data inconsistencies
    insertUsersWithEdgeCaseValues(); // Test boundary conditions
    
    // Run your Change
    change.execute(database);
    
    // Verify all scenarios handled correctly
}
```


## Next steps

- **[Templates](../templates/templates-introduction)** - Explore reusable change patterns
- **[Target Systems](../target-systems/introduction)** - Configure where changes are applied
- **[Testing](../testing/introduction)** - Comprehensive testing strategies for Changes