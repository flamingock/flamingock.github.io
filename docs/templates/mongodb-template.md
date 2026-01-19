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

The `MongoChangeTemplate` provides a declarative way to define MongoDB operations in YAML format. This page documents all supported operations and their parameters.

## Getting started

The MongoDB Template allows you to define database changes declaratively in YAML instead of writing Java code. Here's a quick example:

```yaml
id: create-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
apply:
  - type: createCollection
    collection: users
  - type: createIndex
    collection: users
    parameters:
      keys:
        email: 1
      options:
        unique: true
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

## YAML Structure

```yaml
id: change-identifier          # Required: Unique identifier for the change
transactional: false           # Optional: Whether to run in a transaction (default: true)
template: MongoChangeTemplate  # Required: Template class name
targetSystem:
  id: "mongodb"                # Required: Target system identifier
apply:                         # Required: List of operations to apply
  - type: operationType
    collection: collectionName
    parameters:
      # Operation-specific parameters
rollback:                      # Optional: List of operations for rollback
  - type: operationType
    collection: collectionName
    parameters:
      # Operation-specific parameters
```

### Transactional Behavior

- Set `transactional: true` (default) for DML operations that support transactions
- Set `transactional: false` for DDL operations like `createCollection`, `dropCollection`, `createIndex`, etc.

:::warning
MongoDB DDL operations (`createCollection`, `dropCollection`, `createView`, etc.) cannot run inside transactions. Always set `transactional: false` when using these operations.
:::

## Supported Operations

### createCollection

Creates a new collection.

```yaml
- type: createCollection
  collection: users
```

**Parameters:** None required.

---

### dropCollection

Drops an existing collection.

```yaml
- type: dropCollection
  collection: users
```

**Parameters:** None required.

---

### insert

Inserts one or more documents into a collection.

```yaml
- type: insert
  collection: users
  parameters:
    documents:
      - name: "John Doe"
        email: "john@example.com"
        roles: ["admin", "user"]
      - name: "Jane Smith"
        email: "jane@example.com"
        roles: ["user"]
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
- type: insert
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
- type: update
  collection: users
  parameters:
    filter:
      status: "pending"
    update:
      $set:
        status: "active"
    multi: true  # Optional: update all matching documents
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
- type: update
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
- type: update
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
- type: delete
  collection: users
  parameters:
    filter:
      status: "inactive"
```

To delete all documents:

```yaml
- type: delete
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
- type: createIndex
  collection: users
  parameters:
    keys:
      email: 1        # 1 for ascending, -1 for descending
    options:
      name: "email_unique_index"
      unique: true
```

**Compound index example:**

```yaml
- type: createIndex
  collection: orders
  parameters:
    keys:
      customerId: 1
      orderDate: -1
    options:
      name: "customer_orders_index"
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
- type: dropIndex
  collection: users
  parameters:
    indexName: "email_unique_index"
```

**By index keys:**

```yaml
- type: dropIndex
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
- type: renameCollection
  collection: oldName
  parameters:
    target: newName
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | String | Yes | New collection name |

---

### modifyCollection

Modifies collection options, such as adding validation rules.

```yaml
- type: modifyCollection
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
- type: createView
  collection: activeUsers
  parameters:
    viewOn: users
    pipeline:
      - $match:
          status: "active"
      - $project:
          name: 1
          email: 1
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
- type: dropView
  collection: activeUsers
```

**Parameters:** None required.

---

## Complete Examples

### Example 1: Setting up a users collection

```yaml
id: setup-users-collection
transactional: false
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
apply:
  - type: createCollection
    collection: users

  - type: createIndex
    collection: users
    parameters:
      keys:
        email: 1
      options:
        name: "email_unique"
        unique: true

  - type: insert
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
  - type: dropIndex
    collection: users
    parameters:
      indexName: "email_unique"

  - type: delete
    collection: users
    parameters:
      filter: {}

  - type: dropCollection
    collection: users
```

### Example 2: Data migration with update

```yaml
id: migrate-user-status
transactional: true
template: MongoChangeTemplate
targetSystem:
  id: "mongodb"
apply:
  - type: update
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
  - type: update
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
apply:
  - type: createView
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
  - type: dropView
    collection: premiumCustomers
```

## Backward Compatibility

The MongoDB Template supports two YAML formats for backward compatibility:

**New format (recommended) - List of operations:**
```yaml
apply:
  - type: createCollection
    collection: users
  - type: createIndex
    collection: users
    parameters:
      keys:
        email: 1
```

**Legacy format - Single operation:**
```yaml
apply:
  type: createCollection
  collection: users
```

The new list format is recommended as it allows multiple operations in a single change.
