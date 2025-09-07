---
title: DynamoDB
sidebar_position: 4
---

# DynamoDB Target System

The DynamoDB target system (`DynamoDBTargetSystem`) enables Flamingock to apply changes to Amazon DynamoDB using the AWS SDK for Java. As a transactional target system, it supports automatic rollback through DynamoDB's transaction capabilities with `TransactWriteItems`.

## Minimum recommended setup

```java
DynamoDBTargetSystem dynamoTarget = new DynamoDBTargetSystem("inventory-database")
    .withDynamoDBClient(dynamoDbClient);
```

While dependencies can be provided through the global context, we highly recommend injecting them directly at the target system level. This provides clearer scoping, better isolation between systems, and makes dependencies explicit and easier to track.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/target-system-configuration.md#dependency-resolution-hierarchy), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `DynamoDbClient` | `.withDynamoDBClient(client)` | AWS DynamoDB client - **required** for both ChangeUnit execution and transaction management |

Remember: If not provided directly via `.withXXX()`, Flamingock searches the global context. If still not found:
- **Required dependencies** will throw an exception

## Configuration example

Here's a comprehensive example showing dependency resolution:

```java
// Target system with specific dependencies
DynamoDBTargetSystem dynamoTarget = new DynamoDBTargetSystem("inventory-database")
    .withDynamoDBClient(inventoryDynamoClient)  // Target-specific client
    .addDependency(inventoryService);           // Custom service for this target

// Global context with different dependencies
Flamingock.builder()
    .addDependency(defaultDynamoClient)         // Different client in global
    .addDependency(emailService)                // Available to all targets
    .addTargetSystems(dynamoTarget)
    .build();
```

**What gets resolved for ChangeUnits in "inventory-database":**
- **DynamoDbClient**: Uses `inventoryDynamoClient` (from target system, not `defaultDynamoClient` from global)
- **InventoryService**: Available from target system context
- **EmailService**: Available from global context

The target system context always takes precedence, ensuring proper isolation between different systems.

## Transactional support

For a ChangeUnit to leverage DynamoDB's transactional capabilities, it must use the `TransactWriteItemsEnhancedRequest.Builder` parameter. Flamingock uses the injected `DynamoDbClient` dependency to create and manage this builder's lifecycle - creating it before execution and executing the transaction with all operations on success.

> For detailed information on transaction handling, see [Transactions](../flamingock-library-config/transactions.md).

```java
@TargetSystem("inventory-database")
@ChangeUnit(id = "update-inventory", order = "001")
public class UpdateInventory {
    
    @Execution
    public void execution(DynamoDbClient client, 
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

## Available dependencies in ChangeUnits

Your ChangeUnits can inject DynamoDB-specific dependencies like `DynamoDbClient` and `TransactWriteItemsEnhancedRequest.Builder`, but are not limited to these. Any dependency can be added to the target system context via `.addDependency()`, taking precedence over global dependencies.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Next steps

- Learn about [Target system configuration](../flamingock-library-config/target-system-configuration.md)
- Explore [ChangeUnits](../change-units/introduction.md)
- See [DynamoDB examples](https://github.com/flamingock/flamingock-examples/tree/master/dynamodb)