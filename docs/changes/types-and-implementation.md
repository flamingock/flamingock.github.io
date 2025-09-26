---
title: Types & Implementation
sidebar_position: 5
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Change Types & Implementation

Flamingock supports two approaches for implementing Changes: **code-based** and **template-based**. Each serves different use cases and provides the same safety guarantees.







<Tabs groupId="edition">
  <TabItem value="template" label="Template based" default>
Template-based Changes use YAML or JSON files with reusable templates. Templates provide a low-code, declarative approach for common patterns and repetitive operations. Templates can be as powerful and complex as code-based Changes - the difference is that templates are developed for reusable patterns and integrations.

### Basic YAML structure

```yaml
# File: _0001__AddUserIndex.yaml
id: add_user_index
author: "database-team"
description: "Add index on user email field for faster lookups"
targetSystem: "user-database"
templateName: mongodb-index
apply:
  type: createIndex
  collection: users
  indexSpec:
    email: 1
  options:
    unique: true
    name: "idx_user_email"
rollback:
  type: removeIndex
  collection: users
  indexName: "idx_user_email"
```

For more details about available templates and creating custom templates, see [Templates](../templates/templates-introduction).

  </TabItem>
  <TabItem value="code" label="Code based">
Code-based Changes are written in Java, Kotlin, or Groovy with annotations. They provide full programmatic control for custom logic or specific operations that don't fit existing templates.

### Basic structure

```java
@TargetSystem("user-database")
@Change(id = "migrate-user-emails", author = "data-team")  // order extracted from filename
public class _0001__MigrateUserEmails {

    @Apply
    public void apply(MongoDatabase database, ClientSession session) {
        // Custom implementation logic with full programmatic control
        MongoCollection<Document> users = database.getCollection("users");
        users.updateMany(session,
            new Document("email", new Document("$exists", true)),
            new Document("$set", new Document("emailVerified", false)));
    }

    @Rollback
    public void rollback(MongoDatabase database, ClientSession session) {
        // Rollback logic
        database.getCollection("users")
                .updateMany(session, new Document(),
                    new Document("$unset", new Document("emailVerified", "")));
    }
}
```

  </TabItem>
</Tabs>








## File organization

### Recommended project structure:
```
src/main/java/com/yourapp/changes/
├── _0001__CreateUserIndexes.java
├── _0002__AddUserStatus.yaml
├── _0003__MigrateUserData.java
├── _0004__SetupNotifications.yaml
└── _0003__OptimizeQueries.java
```

### Best practices:
- **Keep together**: Store both code and template files in the same directory
- **Consistent naming**: Follow `_ORDER__CHANGE_NAME` pattern for both types (recommended: `NN`)
- **Order in filename**: When using the naming pattern, order in annotation/yaml is optional

:::info Order Field Rules
Using the `_ORDER__CHANGE-NAME` pattern, the order is extracted from the filename. For complete rules about order and file naming, see [Anatomy & Structure - File name and order](./anatomy-and-structure#file-name-and-order).
:::

## Template development

Flamingock and the community provide useful templates for common operations. Organizations can also develop their own templates to standardize patterns and integrations specific to their needs.

For more information about available templates and how to create custom templates, see [Templates](../templates/templates-introduction).

## Next steps

- **[Best Practices](./best-practices)** - Learn proven patterns for reliable Changes
- **[Templates](../templates/templates-introduction)** - Explore available templates and create custom ones
- **[Target Systems](../target-systems/introduction)** - Configure where your changes will be applied