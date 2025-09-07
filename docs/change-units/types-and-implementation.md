---
title: Types & Implementation
sidebar_position: 3
---

# ChangeUnit Types & Implementation

Flamingock supports two approaches for implementing ChangeUnits: code-based and template-based. Each serves different use cases and provides the same safety guarantees.

## Code-based ChangeUnits

Code-based ChangeUnits are written in Java, Kotlin, or Groovy with annotations. They provide full programmatic control for custom logic or specific operations that don't fit existing templates.

### Basic structure

```java
@TargetSystem("user-database")
@ChangeUnit(id = "migrate-user-emails", order = "0001", author = "data-team")
public class _0001_MigrateUserEmails {
    
    @Execution
    public void execute(MongoDatabase database, ClientSession session) {
        // Custom implementation logic with full programmatic control
        MongoCollection<Document> users = database.getCollection("users");
        users.updateMany(session,
            new Document("email", new Document("$exists", true)),
            new Document("$set", new Document("emailVerified", false)));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database, ClientSession session) {
        // Rollback logic
        database.getCollection("users")
                .updateMany(session, new Document(),
                    new Document("$unset", new Document("emailVerified", "")));
    }
}
```

## Template-based ChangeUnits

Template-based ChangeUnits use YAML or JSON files with reusable templates. Templates provide a low-code, declarative approach for common patterns and repetitive operations. Templates can be as powerful and complex as code-based ChangeUnits - the difference is that templates are developed for reusable patterns and integrations.

### Basic YAML structure

```yaml
# File: _0001_add_user_index.yml
id: add_user_index
order: "0001"
author: "database-team"
description: "Add index on user email field for faster lookups"
templateName: mongodb-index
templateConfiguration:
  collection: users
  indexSpec:
    email: 1
  options:
    unique: true
    name: "idx_user_email"
```

For more details about available templates and creating custom templates, see [Templates](../templates/introduction).


## File organization

### Recommended project structure:
```
src/main/java/com/yourapp/changes/
├── _0001_CreateUserIndexes.java
├── _0002_add_user_status.yml
├── _0003_MigrateUserData.java
├── _0004_setup_notifications.yml
└── _0005_OptimizeQueries.java
```

### Best practices:
- **Keep together**: Store both code and template files in the same directory
- **Consistent naming**: Follow `_XXXX_DescriptiveName` pattern for both types

## Template development

Flamingock and the community provide useful templates for common operations. Organizations can also develop their own templates to standardize patterns and integrations specific to their needs.

For more information about available templates and how to create custom templates, see [Templates](../templates/introduction).

## Next steps

- **[Best Practices](./best-practices)** - Learn proven patterns for reliable ChangeUnits
- **[Templates](../templates/introduction)** - Explore available templates and create custom ones
- **[Target Systems](../target-systems/introduction)** - Configure where your changes will be applied