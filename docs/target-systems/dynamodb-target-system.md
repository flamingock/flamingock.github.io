---
title: DynamoDB
sidebar_position: 5
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DynamoDB Target System

The DynamoDB target system (`DynamoDBTargetSystem`) enables Flamingock to apply changes to Amazon DynamoDB using the AWS SDK for Java. As a transactional target system, it supports automatic rollback through DynamoDB's transaction capabilities with `TransactWriteItems`.

## Version Compatibility

| Component | Version Requirement |
|-----------|-------------------|
| AWS SDK DynamoDB Enhanced | 2.25.0+ |

AWS SDK DynamoDB Enhanced 2.25.0+ is required and must be included in your project dependencies.

## Installation

Add the AWS SDK DynamoDB Enhanced dependency to your project (version 2.25.0+ required):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("software.amazon.awssdk:dynamodb-enhanced:2.25.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb-enhanced</artifactId>
    <version>2.25.0</version> <!-- 2.25.0+ supported -->
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the target system:

```java
var dynamoTarget = new DynamoDBTargetSystem("inventory-database-id", dynamoDbClient);
```

The constructor requires the target system name and DynamoDB client. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System Configuration

The DynamoDB target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `DynamoDbClient` | `dynamoDbClient` | AWS DynamoDB client - **required** for both target system configuration and change execution |

## Dependencies Available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `DynamoDbClient`, `TransactWriteItemsEnhancedRequest.Builder`, plus any added via `.addDependency()`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var dynamoTarget = new DynamoDBTargetSystem("inventory-database", inventoryDynamoClient)
    .addDependency(inventoryService);           // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)                // Available to all target systems
    .addDependency(logService)                  // Available to all target systems
    .addTargetSystems(dynamoTarget)
    .build();
```

**Target system configuration resolution:**
- **DynamoDbClient**: Must be provided via constructor (`inventoryDynamoClient`)

**Change dependency resolution for Changes in "inventory-database":**
- **DynamoDbClient**: From target system context (`inventoryDynamoClient`)
- **TransactWriteItemsEnhancedRequest.Builder**: From target system context (created by Flamingock)
- **InventoryService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage DynamoDB's transactional capabilities, it must use the `TransactWriteItemsEnhancedRequest.Builder` parameter. Flamingock uses the injected `DynamoDbClient` dependency to create and manage this builder's lifecycle - creating it before execution and executing the transaction with all operations on success.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("inventory-database-id")
@Change(id = "update-inventory", author = "team")  // order extracted from filename
public class _20250923_01_UpdateInventory {
    
    @Apply
    public void apply(DynamoDbClient client,
                         TransactWriteItemsEnhancedRequest.Builder txBuilder) {
        // The transaction builder is required for transactional execution
        // Flamingock uses the target system's DynamoDbClient to handle transaction operations
        // and manages transaction creation, execution, and rollback automatically
        
        DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
            .dynamoDbClient(client)
            .build();
        
        DynamoDbTable<Product> table = enhancedClient.table("products", 
            TableSchema.fromBean(Product.class));
        
        // Add operations to the transaction
        txBuilder.addPutItem(table, new Product("123", "Updated Product"));
        txBuilder.addDeleteItem(table, Key.builder().partitionValue("456").build());
    }
}
```

**How transactions work:**
1. **Builder creation**: Flamingock uses the target system's `DynamoDbClient` to create a `TransactWriteItemsEnhancedRequest.Builder`
2. **Transaction management**: The same `DynamoDbClient` executes the transaction with all accumulated operations
3. **Lifecycle**: Flamingock automatically creates the builder, executes the transaction on success, or handles rollback on failure

Without the `TransactWriteItemsEnhancedRequest.Builder` parameter, operations will execute but won't participate in transactions.

## Available dependencies in Changes

Your Changes can inject DynamoDB-specific dependencies like `DynamoDbClient` and `TransactWriteItemsEnhancedRequest.Builder`, but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [DynamoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/dynamodb)