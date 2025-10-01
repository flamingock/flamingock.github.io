---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Changes

A **Change** is the atomic, versioned, self-contained unit of change in Flamingock. It encapsulates logic to evolve [**target systems**](../get-started/audit-store-vs-target-system.md) safely, deterministically, and with complete auditability.

## Key characteristics

- **Atomic execution**: Each Change runs exactly once
- **Ordered sequence**: Executed based on their `order` property
- **Auditable**: Recorded in the audit store to prevent duplicate execution
- **Safe by default**: If Flamingock is uncertain about a change's outcome, it stops and requires manual intervention
- **Rollback capable**: Can be undone through rollback methods

## What Changes can do?

Changes enable you to version and track changes across your entire technology stack:

- **Message queue operations**: Topic creation, schema registry updates
- **Object storage**: Bucket setup, file migrations, policy updates
- **Database migrations**: Schema changes, data transformations, index creation
- **External API integrations**: Service configurations, webhook setups
- **Infrastructure changes**: Feature flag updates, configuration changes

## Types of Changes


<Tabs groupId="edition">
  <TabItem value="code" label="Code based" default>
Written in Java, Kotlin, or Groovy with annotations. Best for complex logic or when you need full programmatic control.

```java
@TargetSystem("user-database")
@Change(id = "add-user-status", author = "dev-team")
public class _0001__AddUserStatus {

    @Apply
    public void apply(MongoDatabase database) {
        // Your change logic here
    }

    @Rollback
    public void rollback(MongoDatabase database) {
        // Your rollback logic here
    }
}
```

  </TabItem>
  <TabItem value="template" label="Template based">
Use YAML or JSON definitions with reusable templates. Perfect for repetitive operations and standardized patterns.

```yaml
# File: _0002__AddStatusColumn.yaml
id: add_status_column
author: "db-team"
templateName: sql-template
apply: "ALTER TABLE orders ADD COLUMN status VARCHAR(20);"
rollback: "ALTER TABLE orders DROP COLUMN status;"
```

  </TabItem>
</Tabs>



## Safety and recovery

While Change executions typically complete successfully, Flamingock provides configurable recovery strategies to handle any exceptional circumstances that may arise. If results are uncertain, Flamingock stops and requires manual intervention rather than risking data corruption, ensuring you always know the exact state of your systems.

You can configure different recovery strategies based on your requirements. For complete details on failure handling and recovery workflows, see [Safety and Recovery](../safety-and-recovery/introduction.md).

## Next steps

Dive deeper into specific aspects of Changes:

- **[Anatomy & Structure](./anatomy-and-structure.md)** - Learn the technical structure, required properties, and annotations
- **[Types & Implementation](./types-and-implementation.md)** - Understand code-based vs template-based approaches
- **[Best Practices](./best-practices.md)** - Follow proven patterns for reliable Changes

Or continue to other key concepts:
- **[Target Systems](../target-systems/introduction.md)** - Configure where your changes will be applied
- **[Templates](../templates/templates-introduction.md)** - Explore reusable change patterns
