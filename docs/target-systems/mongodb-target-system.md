---
title: MongoDB Sync
sidebar_position: 1
---

# MongoDB Sync Target System

The MongoDB Sync target system (`MongoSyncTargetSystem`) enables Flamingock to apply changes to MongoDB databases using the official MongoDB Java sync driver. As a transactional target system, it supports automatic rollback through MongoDB's native transaction capabilities.

## Minimum setup

```java
import io.flamingock.targetsystem.mongodb.sync.MongoSyncTargetSystem;

MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database");
```

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/target-system-configuration.md#dependency-resolution-hierarchy), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoClient` | `.withMongoClient(client)` | MongoDB connection client - **required** |
| `MongoDatabase` | `.withDatabase(database)` | Target database instance - **required** |

### Optional configurations

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `WriteConcern` | `.withWriteConcern(concern)` | `MAJORITY` with journal | Write acknowledgment level |
| `ReadConcern` | `.withReadConcern(concern)` | `MAJORITY` | Read isolation level |
| `ReadPreference` | `.withReadPreference(pref)` | `PRIMARY` | Server selection for reads |

Remember: If not provided directly via `.withXXX()`, Flamingock searches the global context. If still not found:
- **Required dependencies** will throw an exception
- **Optional configurations** will use the defaults shown above

## Configuration examples

### Direct injection (recommended)

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withMongoClient(mongoClient)
    .withDatabase(database)
    .withWriteConcern(WriteConcern.MAJORITY.withJournal(true));
```

### Global context fallback

```java
// Register in global context
Flamingock.builder()
    .addDependency(mongoClient)
    .addDependency(database)
    .addTargetSystems(new MongoSyncTargetSystem("user-database"))
    .build();
```

### Mixed approach

```java
MongoSyncTargetSystem mongoTarget = new MongoSyncTargetSystem("user-database")
    .withDatabase(database)        // Direct injection
    .withWriteConcern(WriteConcern.W1);  // Override default
    // MongoClient will be resolved from global context
```

## Transactional support

As a transactional target system, MongoDB automatically manages `ClientSession` for your ChangeUnits:

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-users", order = "001")
public class CreateUsers {
    
    @Execution
    public void execution(MongoDatabase db, ClientSession session) {
        // Session is automatically managed by Flamingock
        db.getCollection("users")
          .insertOne(session, new Document("name", "John"));
    }
}
```

## Available dependencies in ChangeUnits

Your ChangeUnits can inject:
- `MongoClient` 
- `MongoDatabase` 
- `ClientSession` (for transactional operations)
- Any dependencies from the global context

## Next steps

- Learn about [Target system configuration](../flamingock-library-config/target-system-configuration.md)
- Explore [ChangeUnits](../flamingock-library-config/changeunits-deep-dive.md)
- See [MongoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/mongodb)