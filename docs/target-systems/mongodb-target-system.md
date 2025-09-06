---
title: MongoDB
sidebar_position: 1
---

# MongoDB Target System

The MongoDB target system (`MongoSyncTargetSystem`) enables Flamingock to apply changes to MongoDB databases using the official MongoDB Java driver. As a transactional target system, it supports automatic rollback through MongoDB's native transaction capabilities.

## Minimum setup

At minimum, you need to provide a MongoDB database identifier and register the target system:

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.flamingock.targetsystem.mongodb.sync.MongoSyncTargetSystem;

public class App {
  public static void main(String[] args) {
    // Create MongoDB connection
    MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
    MongoDatabase database = mongoClient.getDatabase("mydb");
    
    // Configure target system
    MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
        .withMongoClient(mongoClient)
        .withDatabase(database);
    
    // Register with Flamingock
    Flamingock.builder()
        .addTargetSystems(mongoTarget)
        .setAuditStore(auditStore) // Your audit store configuration
        .build()
        .run();
  }
}
```

## Dependency injection

MongoDB target system follows a hierarchical dependency resolution pattern:

1. **Direct injection** via `.withXXX()` methods (highest priority)
2. **Global context** lookup if not directly injected
3. **Default values** for optional configurations

### Required dependencies

These must be provided either directly or through the global context:

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoClient` | `.withMongoClient(client)` | MongoDB connection client |
| `MongoDatabase` | `.withDatabase(database)` | Target database instance |

### Optional configurations

These have sensible defaults but can be customized:

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |

## Configuration examples

### Full configuration with all options

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withMongoClient(mongoClient)
    .withDatabase(database)
    .withWriteConcern(WriteConcern.MAJORITY.withJournal(true))
    .withReadConcern(ReadConcern.MAJORITY)
    .withReadPreference(ReadPreference.primary());
```

### Using global context fallback

If you register dependencies in Flamingock's global context, the target system will find them automatically:

```java
// Register in global context
Flamingock.builder()
    .addDependency(mongoClient)
    .addDependency(database)
    .addTargetSystems(new MongoSyncTargetSystem("user-database"))
    // MongoClient and MongoDatabase will be resolved from global context
    .build()
    .run();
```

### Mixed approach

```java
// Direct injection takes precedence
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withDatabase(database)  // Direct injection
    // MongoClient will be resolved from global context
    .withWriteConcern(WriteConcern.W1);  // Override default

Flamingock.builder()
    .addDependency(mongoClient)  // Available in global context
    .addTargetSystems(mongoTarget)
    .build()
    .run();
```

## Transactional support

MongoDB target system automatically manages transactions for your ChangeUnits. When a ChangeUnit is marked as transactional (the default), Flamingock:

1. Starts a `ClientSession` before execution
2. Injects it into your `@Execution` method if requested
3. Commits on success or rolls back on failure

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-users", order = "001")
public class CreateUsers {
    
    @Execution
    public void execution(MongoDatabase db, ClientSession session) {
        // This runs in a transaction
        // Session is automatically managed by Flamingock
        db.getCollection("users")
          .insertOne(session, new Document("name", "John"));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase db, ClientSession session) {
        // Compensation logic if needed
        // For transactional systems, this is optional
    }
}
```

## Available dependencies in ChangeUnits

When using MongoDB target system, your ChangeUnits can inject:

- `MongoClient` - The MongoDB client
- `MongoDatabase` - The configured database
- `ClientSession` - For transactional operations (auto-managed)
- Any dependencies from the global context

## Best practices

1. **Use default consistency settings in production** - The defaults (MAJORITY write/read concerns) provide the best balance of safety and performance

2. **Let Flamingock manage sessions** - Don't create your own ClientSession; request it as a parameter and Flamingock handles the lifecycle

3. **Provide both required dependencies** - Even if MongoDatabase seems sufficient, always provide MongoClient for proper transaction support

4. **Name your target systems clearly** - Use descriptive names like `"user-database"` or `"product-catalog"` rather than generic `"mongodb"`

## Troubleshooting

### Missing dependency errors

If you see "Required dependency not found" errors, ensure you've either:
- Directly injected via `.withMongoClient()` and `.withDatabase()`
- OR registered them in the global context via `.addDependency()`

### Transaction not working

Verify that:
- Your MongoDB deployment supports transactions (replica set or sharded cluster)
- You've provided the MongoClient dependency (required for session management)
- The ChangeUnit is not marked with `transactional = false`

## Next steps

- Learn about [ChangeUnits](../flamingock-library-config/changeunits-deep-dive.md)
- Explore [dependency injection](../flamingock-library-config/changeunit-dependency-injection.md)
- See [MongoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)