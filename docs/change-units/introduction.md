---
title: Introduction
sidebar_position: 1
---

# ChangeUnits

A **ChangeUnit** is the atomic, versioned, self-contained unit of change in Flamingock. It encapsulates logic to evolve [**target systems**](../overview/audit-store-vs-target-system.md) safely, deterministically, and with complete auditability.

## Key characteristics

- **Atomic execution**: Each ChangeUnit runs exactly once
- **Ordered sequence**: Executed based on their `order` property  
- **Auditable**: Recorded in the audit store to prevent duplicate execution
- **Safe by default**: If Flamingock is uncertain about a change's outcome, it stops and requires manual intervention
- **Rollback capable**: Can be undone through rollback methods

## What ChangeUnits can do

ChangeUnits enable you to version and track changes across your entire technology stack:

- **Message queue operations**: Topic creation, schema registry updates
- **Object storage**: Bucket setup, file migrations, policy updates  
- **Database migrations**: Schema changes, data transformations, index creation
- **External API integrations**: Service configurations, webhook setups
- **Infrastructure changes**: Feature flag updates, configuration changes

## Types of ChangeUnits

### Code-based ChangeUnits
Written in Java, Kotlin, or Groovy with annotations. Best for complex logic or when you need full programmatic control.

```java
@TargetSystem("user-database")
@ChangeUnit(id = "add-user-status", order = "0001", author = "dev-team")
public class _0001_AddUserStatus {
    
    @Execution
    public void execute(MongoDatabase database) {
        // Your change logic here
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        // Your rollback logic here
    }
}
```

### Template-based ChangeUnits
Use YAML or JSON definitions with reusable templates. Perfect for repetitive operations and standardized patterns.

```yaml
# File: _0002_add_status_column.yml
id: add_status_column
order: "0002"
author: "db-team"
templateName: sql-template
execution: "ALTER TABLE orders ADD COLUMN status VARCHAR(20);"
rollback: "ALTER TABLE orders DROP COLUMN status;"
```

## Safety and recovery

While ChangeUnit executions typically complete successfully, Flamingock provides configurable recovery strategies to handle any exceptional circumstances that may arise. If results are uncertain, Flamingock stops and requires manual intervention rather than risking data corruption, ensuring you always know the exact state of your systems.

You can configure different recovery strategies based on your requirements. For complete details on failure handling and recovery workflows, see [Safety and Recovery](../safety-and-recovery/introduction.md).

## Next steps

Dive deeper into specific aspects of ChangeUnits:

- **[Anatomy & Structure](./anatomy-and-structure.md)** - Learn the technical structure, required properties, and annotations
- **[Types & Implementation](./types-and-implementation.md)** - Understand code-based vs template-based approaches  
- **[Best Practices](./best-practices.md)** - Follow proven patterns for reliable ChangeUnits

Or continue to other key concepts:
- **[Target Systems](../target-systems/introduction.md)** - Configure where your changes will be applied
- **[Templates](../templates/templates-introduction.md)** - Explore reusable change patterns