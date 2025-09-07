---
title: MongoDB Spring Data
sidebar_position: 2
---

# MongoDB Spring Data Target System

The MongoDB Spring Data target system (`MongoSpringDataTargetSystem`) enables Flamingock to apply changes to MongoDB databases using Spring Data MongoDB. As a transactional target system, it integrates seamlessly with Spring's transaction management and supports automatic rollback through MongoDB's native transaction capabilities.

## Minimum recommended setup

```java
MongoSpringDataTargetSystem mongoTarget = new MongoSpringDataTargetSystem("user-database")
    .withMongoTemplate(mongoTemplate);
```

While dependencies can be provided through the global context, we highly recommend injecting them directly at the target system level. This provides clearer scoping, better isolation between systems, and makes dependencies explicit and easier to track.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/target-system-configuration.md#dependency-resolution-hierarchy), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `MongoTemplate` | `.withMongoTemplate(template)` | Spring Data MongoDB template - **required** for both ChangeUnit execution and transaction management |

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
MongoSpringDataTargetSystem mongoTarget = new MongoSpringDataTargetSystem("user-database")
    .withMongoTemplate(userMongoTemplate)      // Target-specific template
    .addDependency(userAuditService);          // Custom service for this target

// Global context with different dependencies
Flamingock.builder()
    .addDependency(defaultMongoTemplate)       // Different template in global
    .addDependency(emailService)               // Available to all targets
    .addTargetSystems(mongoTarget)
    .build();
```

**What gets resolved for ChangeUnits in "user-database":**
- **MongoTemplate**: Uses `userMongoTemplate` (from target system, not `defaultMongoTemplate` from global)
- **UserAuditService**: Available from target system context
- **EmailService**: Available from global context
- **WriteConcern/ReadConcern**: Use defaults (MAJORITY with journal)

The target system context always takes precedence, ensuring proper isolation between different systems.

## Transactional support

Spring Data MongoDB target system integrates with Spring's transaction management. When a ChangeUnit is marked as transactional (the default), Flamingock uses the injected `MongoTemplate` dependency to handle transaction operations through Spring's infrastructure.

```java
@TargetSystem("user-database")
@ChangeUnit(id = "create-users", order = "001")
public class CreateUsers {
    
    @Execution
    public void execution(MongoTemplate mongoTemplate) {
        // MongoTemplate automatically participates in Spring transactions
        // Flamingock uses the target system's MongoTemplate for transaction management
        // through Spring's @Transactional infrastructure
        mongoTemplate.save(new User("john@example.com", "John Doe"));
    }
}
```

**How transactions work:**
1. **Spring integration**: Flamingock leverages the target system's `MongoTemplate` within Spring's transaction context
2. **Transaction management**: The same `MongoTemplate` handles both ChangeUnit operations and transaction coordination
3. **Lifecycle**: Spring's transaction infrastructure manages start, commit, and rollback automatically

The transaction lifecycle is managed through Spring's transaction infrastructure, ensuring consistency with your existing Spring Data operations.

## Available dependencies in ChangeUnits

Your ChangeUnits can inject Spring Data dependencies like `MongoTemplate`, but are not limited to these. Any dependency can be added to the target system context via `.addDependency()`, taking precedence over global dependencies.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Spring integration

This target system is designed to work seamlessly with Spring Boot applications. When using Spring Boot auto-configuration, your existing `MongoTemplate` beans are automatically available for injection into target systems.

For more information on Spring Boot integration, see [Spring Boot integration](../frameworks/springboot-integration/introduction.md).

## Next steps

- Learn about [Target system configuration](../flamingock-library-config/target-system-configuration.md)
- Explore [ChangeUnits](../change-units/introduction.md)
- See [MongoDB Spring Data examples](https://github.com/flamingock/flamingock-examples/tree/master/mongodb-springdata)