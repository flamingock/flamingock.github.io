---
title: MongoDB Sync
sidebar_position: 1
---

# MongoDB Sync Target System

The MongoDB Sync target system (`MongoSyncTargetSystem`) enables Flamingock to apply changes to MongoDB databases using the official MongoDB Java sync driver. As a transactional target system, it supports automatic rollback through MongoDB's native transaction capabilities.

## Minimum recommended setup

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withMongoClient(mongoClient)
    .withDatabase(database);
```

While dependencies can be provided through the global context, we highly recommend injecting them directly at the target system level. This provides clearer scoping, better isolation between systems, and makes dependencies explicit and easier to track.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/context-and-dependencies.md), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoClient` | `.withMongoClient(client)` | MongoDB connection client - **required** for both ChangeUnit execution and transaction management |
| `MongoDatabase` | `.withDatabase(database)` | Target database instance - **required** for both ChangeUnit execution and transaction management |

### Optional configurations

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |

**Important**: These default values are optimized for maximum consistency and should ideally be left unchanged. Override them only for testing purposes or exceptional cases where the defaults cannot be used (e.g., specific infrastructure limitations).

Remember: If not provided directly via `.withXXX()`, Flamingock searches the global context. If still not found:
- **Required dependencies** will throw an exception
- **Optional configurations** will use the defaults shown above

## Configuration example

Here's a comprehensive example showing dependency resolution:

```java
// Target system with specific dependencies
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withMongoClient(productionMongoClient)    // Target-specific client
    .withDatabase(userDatabase)                // Target-specific database
    .addDependency(auditService);              // Custom service for this target

// Global context with different dependencies
Flamingock.builder()
    .addDependency(defaultMongoClient)         // Different client in global
    .addDependency(defaultDatabase)            // Different database in global
    .addDependency(emailService)               // Available to all targets
    .addTargetSystems(mongoTarget)
    .build();
```

**What gets resolved for ChangeUnits in "user-database":**
- **MongoClient**: Uses `productionMongoClient` (from target system, not `defaultMongoClient` from global)
- **MongoDatabase**: Uses `userDatabase` (from target system, not `defaultDatabase` from global)
- **AuditService**: Available from target system context
- **EmailService**: Available from global context
- **WriteConcern/ReadConcern**: Use defaults (MAJORITY with journal)

The target system context always takes precedence, ensuring proper isolation between different systems.

## Transactional support

For a ChangeUnit to leverage MongoDB's transactional capabilities, it must use the `ClientSession` parameter. Flamingock uses the injected `MongoClient` and `MongoDatabase` dependencies to create and manage this session's lifecycle - starting the transaction before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../flamingock-library-config/transactions.md).

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-users", order = "001")
public class CreateUsers {
    
    @Execution
    public void execution(MongoDatabase db, ClientSession session) {
        // The ClientSession is required for transactional execution
        // Flamingock uses the target system's MongoClient to create this session
        // and handles transaction start, commit, and rollback automatically
        db.getCollection("users")
          .insertOne(session, new Document("name", "John"));
    }
}
```

**How transactions work:**
1. **Session creation**: Flamingock uses the target system's `MongoClient` to create a `ClientSession`
2. **Transaction management**: The same `MongoClient` and `MongoDatabase` handle transaction operations
3. **Lifecycle**: Flamingock automatically starts the transaction, commits on success, or rolls back on failure

Without the `ClientSession` parameter, operations will execute but won't participate in transactions.

## Available dependencies in ChangeUnits

Your ChangeUnits can inject MongoDB-specific dependencies like `MongoClient`, `MongoDatabase`, and `ClientSession` (for transactions), but are not limited to these. Any dependency can be added to the target system context via `.addDependency()`, taking precedence over global dependencies.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [ChangeUnits](../change-units/introduction.md)
- See [MongoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)