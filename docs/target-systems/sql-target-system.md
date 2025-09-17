---
title: SQL
sidebar_position: 3
---

# SQL Target System

The SQL target system (`SqlTargetSystem`) enables Flamingock to apply changes to relational databases including PostgreSQL, MySQL, Oracle, and SQL Server using standard JDBC connections. As a transactional target system, it supports automatic rollback through the database's native transaction capabilities.

## Minimum recommended setup

```java
SqlTargetSystem sqlTarget = new SqlTargetSystem("inventory-database")
    .withDatasource(dataSource);
```

While dependencies can be provided through the global context, we highly recommend injecting them directly at the target system level. This provides clearer scoping, better isolation between systems, and makes dependencies explicit and easier to track.

## Dependencies

Following Flamingock's [dependency resolution hierarchy](../flamingock-library-config/context-and-dependencies.md), you can provide dependencies via direct injection or global context.

### Required dependencies

| Dependency | Method | Description |
|------------|--------|-------------|
| `DataSource` | `.withDatasource(dataSource)` | JDBC DataSource connection pool - **required** for both Change execution and transaction management |

### Optional configurations

| Configuration | Method | Default | Description |
|---------------|--------|---------|-------------|
| `Connection` | `.withConnection(connection)` | None | Direct JDBC connection (alternative to DataSource) |

Remember: If not provided directly via `.withXXX()`, Flamingock searches the global context. If still not found:
- **Required dependencies** will throw an exception

## Configuration example

Here's a comprehensive example showing dependency resolution:

```java
// Target system with specific dependencies
SqlTargetSystem sqlTarget = new SqlTargetSystem("inventory-database")
    .withDatasource(inventoryDataSource)       // Target-specific datasource
    .addDependency(inventoryService);          // Custom service for this target

// Global context with different dependencies
Flamingock.builder()
    .addDependency(defaultDataSource)          // Different datasource in global
    .addDependency(emailService)               // Available to all targets
    .addTargetSystems(sqlTarget)
    .build();
```

**What gets resolved for Changes in "inventory-database":**
- **DataSource**: Uses `inventoryDataSource` (from target system, not `defaultDataSource` from global)
- **InventoryService**: Available from target system context
- **EmailService**: Available from global context

The target system context always takes precedence, ensuring proper isolation between different systems.

## Transactional support

For a Change to leverage SQL's transactional capabilities, it must use either the `DataSource` or `Connection` parameter. Flamingock uses the injected `DataSource` dependency to create connections and manage the transaction lifecycle - starting the transaction before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../flamingock-library-config/transactions.md).

```java
@TargetSystem("inventory-database")
@Change(id = "update-products", order = "001")
public class UpdateProducts {
    
    @Apply
    public void apply(DataSource dataSource) throws SQLException {
        // DataSource automatically participates in transactions
        // Flamingock uses the target system's DataSource for transaction management
        // and handles transaction start, commit, and rollback automatically
        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO products (id, name, price) VALUES (?, ?, ?)")) {
                stmt.setString(1, "P001");
                stmt.setString(2, "Updated Product");
                stmt.setBigDecimal(3, new BigDecimal("19.99"));
                stmt.executeUpdate();
            }
        }
    }
}
```

You can also inject a `Connection` directly if you prefer to work with connections instead of DataSource:

```java
@TargetSystem("inventory-database")
@Change(id = "create-indexes", order = "002")
public class CreateIndexes {
    
    @Apply
    public void apply(Connection connection) throws SQLException {
        // Connection automatically participates in transactions
        // Flamingock uses the target system's connection for transaction operations
        // and handles transaction lifecycle automatically
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("CREATE INDEX idx_product_name ON products(name)");
        }
    }
}
```

**How transactions work:**
1. **Connection management**: Flamingock uses the target system's `DataSource` to obtain database connections
2. **Transaction management**: The same `DataSource` or `Connection` handles transaction operations (begin, commit, rollback)
3. **Lifecycle**: Flamingock automatically manages transaction boundaries, committing on success or rolling back on failure

Without the `DataSource` or `Connection` parameter, operations will execute but won't participate in transactions.

## Available dependencies in Changes

Your Changes can inject SQL-specific dependencies like `DataSource` and `Connection`, but are not limited to these. Any dependency can be added to the target system context via `.addDependency()`, taking precedence over global dependencies.

For more details on dependency resolution, see [Context and dependencies](../flamingock-library-config/context-and-dependencies.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [SQL examples](https://github.com/flamingock/flamingock-examples/tree/master/sql)