---
sidebar_position: 3
title: MongoDB Template
sidebar_label: MongoDB Template
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB Template Reference

:::caution Beta feature
The MongoDB Template is available in **beta**.
:::

The `MongoChangeTemplate` provides a declarative way to define MongoDB operations in YAML format. This template extends `AbstractSteppableTemplate` and is designed for step-based changes where each step can have its own apply and rollback operation.

## Getting started

The MongoDB Template allows you to define database changes declaratively in YAML instead of writing Java code. Here's a quick example:

```yaml
id: create-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
steps:
  - apply:
      type: createCollection
      collection: users
    rollback:
      type: dropCollection
      collection: users
  - apply:
      type: createIndex
      collection: users
      parameters:
        keys:
          email: 1
        options:
          unique: true
    rollback:
      type: dropIndex
      collection: users
      parameters:
        indexName: "email_1"
```

This single YAML file replaces what would typically require a Java class with annotations and MongoDB driver code. For a step-by-step guide on setting up templates, see [How to use Templates](./templates-how-to-use.md).

## Installation

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-mongodb-sync-template")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-mongodb-sync-template</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

## YAML structure

The MongoDB Template uses the **steps format** where each step contains an apply operation and an optional rollback operation.

```yaml
# Required: Unique identifier for this change
id: my-change-id

# Optional: Author of this change
author: developer-name

# Optional: Whether to run in a transaction (default: true)
transactional: true

# Required: Template to use
template: MongoChangeTemplate

# Required: Target system configuration
targetSystem:
  id: "mongodb"

# Required: List of steps, each with an apply and optional rollback
steps:
  - apply:
      type: <operation-type>
      collection: <collection-name>
      parameters:
        # Operation-specific parameters
    rollback:
      type: <operation-type>
      collection: <collection-name>
      parameters:
        # Operation-specific parameters

  - apply:
      type: <another-operation>
      collection: <collection-name>
    rollback:
      type: <rollback-operation>
      collection: <collection-name>
```

**Example:**

```yaml
id: setup-products
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"

steps:
  - apply:
      type: createCollection
      collection: products
    rollback:
      type: dropCollection
      collection: products

  - apply:
      type: createIndex
      collection: products
      parameters:
        keys:
          category: 1
        options:
          name: "category_index"
    rollback:
      type: dropIndex
      collection: products
      parameters:
        indexName: "category_index"
```

### Rollback behavior

When a step fails during execution:
1. All previously successful steps are rolled back in reverse order
2. Steps without rollback operations are skipped during rollback
3. Rollback errors are logged but don't stop the rollback process for remaining steps

This provides fine-grained control over rollback operations, ensuring each operation can be properly undone.

### Transactional behavior

- Set `transactional: true` (default) for DML operations that support transactions
- Set `transactional: false` for DDL operations like `createCollection`, `dropCollection`, `createIndex`, etc.

:::warning
MongoDB DDL operations (`createCollection`, `dropCollection`, `createView`, etc.) cannot run inside transactions. Always set `transactional: false` when using these operations.
:::

## Supported operations

### createCollection

Creates a new collection.

```yaml
- apply:
    type: createCollection
    collection: users
  rollback:
    type: dropCollection
    collection: users
```

**Parameters:** None required.

---

### dropCollection

Drops an existing collection.

```yaml
- apply:
    type: dropCollection
    collection: users
```

**Parameters:** None required.

---

### insert

Inserts one or more documents into a collection.

```yaml
- apply:
    type: insert
    collection: users
    parameters:
      documents:
        - name: "John Doe"
          email: "john@example.com"
          roles: ["admin", "user"]
        - name: "Jane Smith"
          email: "jane@example.com"
          roles: ["user"]
  rollback:
    type: delete
    collection: users
    parameters:
      filter: {}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documents` | List | Yes | List of documents to insert |
| `options` | Object | No | Insert options |

**Insert Options:**
| Option | Type | Description |
|--------|------|-------------|
| `bypassDocumentValidation` | Boolean | If `true`, allows insertion of documents that don't pass validation |
| `ordered` | Boolean | If `true` (default), stops on first error. If `false`, continues inserting remaining documents |

**Example with options:**

```yaml
- apply:
    type: insert
    collection: users
    parameters:
      documents:
        - name: "John Doe"
          email: "john@example.com"
        - name: "Jane Smith"
          email: "jane@example.com"
      options:
        ordered: false
        bypassDocumentValidation: true
```

---

### update

Updates documents in a collection.

```yaml
- apply:
    type: update
    collection: users
    parameters:
      filter:
        status: "pending"
      update:
        $set:
          status: "active"
      multi: true  # Optional: update all matching documents
  rollback:
    type: update
    collection: users
    parameters:
      filter:
        status: "active"
      update:
        $set:
          status: "pending"
      multi: true
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | Object | Yes | Query filter to select documents |
| `update` | Object | Yes | Update operations to apply |
| `multi` | Boolean | No | If `true`, updates all matching documents. Default: `false` (updates first match only) |
| `options` | Object | No | Additional update options (upsert, etc.) |

**Update Options:**
| Option | Type | Description |
|--------|------|-------------|
| `upsert` | Boolean | Insert if no document matches |
| `bypassDocumentValidation` | Boolean | If `true`, allows update to bypass document validation |
| `collation` | Object | Collation settings for string comparison (see example below) |
| `arrayFilters` | List | Filters specifying which array elements to update |

**Example with collation:**

```yaml
- apply:
    type: update
    collection: users
    parameters:
      filter:
        name: "josé"
      update:
        $set:
          verified: true
      options:
        collation:
          locale: "es"
          strength: 1  # Case-insensitive and accent-insensitive
```

**Example with arrayFilters:**

```yaml
- apply:
    type: update
    collection: orders
    parameters:
      filter:
        orderId: "ORD-001"
      update:
        $set:
          "items.$[elem].status": "shipped"
      options:
        arrayFilters:
          - elem.status: "pending"
```

---

### delete

Deletes documents from a collection.

```yaml
- apply:
    type: delete
    collection: users
    parameters:
      filter:
        status: "inactive"
```

To delete all documents:

```yaml
- apply:
    type: delete
    collection: users
    parameters:
      filter: {}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | Object | Yes | Query filter to select documents to delete. Use `{}` for all documents. |

---

### createIndex

Creates an index on a collection.

```yaml
- apply:
    type: createIndex
    collection: users
    parameters:
      keys:
        email: 1        # 1 for ascending, -1 for descending
      options:
        name: "email_unique_index"
        unique: true
  rollback:
    type: dropIndex
    collection: users
    parameters:
      indexName: "email_unique_index"
```

**Compound index example:**

```yaml
- apply:
    type: createIndex
    collection: orders
    parameters:
      keys:
        customerId: 1
        orderDate: -1
      options:
        name: "customer_orders_index"
  rollback:
    type: dropIndex
    collection: orders
    parameters:
      indexName: "customer_orders_index"
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keys` | Object | Yes | Index key specification. Use `1` for ascending, `-1` for descending |
| `options` | Object | No | Index options |

**Index Options:**
| Option | Type | Description |
|--------|------|-------------|
| `name` | String | Index name |
| `unique` | Boolean | Create a unique index |
| `sparse` | Boolean | Create a sparse index |
| `expireAfterSeconds` | Integer | TTL index expiration time |
| `background` | Boolean | Build index in background (deprecated in MongoDB 4.2+) |

---

### dropIndex

Drops an index from a collection.

**By index name:**

```yaml
- apply:
    type: dropIndex
    collection: users
    parameters:
      indexName: "email_unique_index"
```

**By index keys:**

```yaml
- apply:
    type: dropIndex
    collection: users
    parameters:
      keys:
        email: 1
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexName` | String | No* | Name of the index to drop |
| `keys` | Object | No* | Index key specification |

*One of `indexName` or `keys` is required.

---

### renameCollection

Renames a collection.

```yaml
- apply:
    type: renameCollection
    collection: oldName
    parameters:
      target: newName
  rollback:
    type: renameCollection
    collection: newName
    parameters:
      target: oldName
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | String | Yes | New collection name |

---

### modifyCollection

Modifies collection options, such as adding validation rules.

```yaml
- apply:
    type: modifyCollection
    collection: users
    parameters:
      validator:
        $jsonSchema:
          bsonType: "object"
          required: ["email", "name"]
          properties:
            email:
              bsonType: "string"
              description: "must be a string and is required"
            name:
              bsonType: "string"
              description: "must be a string and is required"
      validationLevel: "moderate"
      validationAction: "warn"
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `validator` | Object | No | JSON Schema validator |
| `validationLevel` | String | No | `"off"`, `"moderate"`, or `"strict"` |
| `validationAction` | String | No | `"error"` or `"warn"` |

---

### createView

Creates a view based on an aggregation pipeline.

```yaml
- apply:
    type: createView
    collection: activeUsers
    parameters:
      viewOn: users
      pipeline:
        - $match:
            status: "active"
        - $project:
            name: 1
            email: 1
  rollback:
    type: dropView
    collection: activeUsers
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `viewOn` | String | Yes | Source collection name |
| `pipeline` | List | Yes | Aggregation pipeline stages |

---

### dropView

Drops a view.

```yaml
- apply:
    type: dropView
    collection: activeUsers
```

**Parameters:** None required.

---

## Complete examples

### Example 1: Setting up a users collection

```yaml
id: setup-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"

steps:
  - apply:
      type: createCollection
      collection: users
    rollback:
      type: dropCollection
      collection: users

  - apply:
      type: createIndex
      collection: users
      parameters:
        keys:
          email: 1
        options:
          name: "email_unique"
          unique: true
    rollback:
      type: dropIndex
      collection: users
      parameters:
        indexName: "email_unique"

  - apply:
      type: insert
      collection: users
      parameters:
        documents:
          - name: "Admin"
            email: "admin@company.com"
            roles: ["superuser"]
          - name: "Support"
            email: "support@company.com"
            roles: ["readonly"]
    rollback:
      type: delete
      collection: users
      parameters:
        filter: {}
```

### Example 2: Data migration with update

```yaml
id: migrate-user-status
transactional: true
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"

steps:
  - apply:
      type: update
      collection: users
      parameters:
        filter:
          active: true
        update:
          $set:
            status: "active"
          $unset:
            active: ""
        multi: true
    rollback:
      type: update
      collection: users
      parameters:
        filter:
          status: "active"
        update:
          $set:
            active: true
          $unset:
            status: ""
        multi: true
```

### Example 3: Creating a view

```yaml
id: create-premium-customers-view
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"

steps:
  - apply:
      type: createView
      collection: premiumCustomers
      parameters:
        viewOn: customers
        pipeline:
          - $match:
              subscriptionTier: "premium"
          - $project:
              name: 1
              email: 1
              subscriptionTier: 1
    rollback:
      type: dropView
      collection: premiumCustomers
```

## File naming convention

Change files are executed in alphabetical order. Use a numeric prefix to control execution order:

```
_0001__create_users_collection.yaml
_0002__seed_users.yaml
_0003__create_indexes.yaml
```

