---
title: SQL
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SQL Target System

The SQL target system (`SqlTargetSystem`) enables Flamingock to apply changes to relational databases including PostgreSQL, MySQL, Oracle, and SQL Server using standard JDBC connections. As a transactional target system, it supports automatic rollback through the database's native transaction capabilities.

## Installation

Add a JDBC driver dependency for your database. For example, for PostgreSQL:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
implementation("org.postgresql:postgresql:42.3.0")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.3.0</version>
</dependency>
```
  </TabItem>
</Tabs>

You can use any JDBC driver for your database. Common examples include:
- **MySQL**: `com.mysql:mysql-connector-j`
- **Oracle**: `com.oracle.database.jdbc:ojdbc8`
- **SQL Server**: `com.microsoft.sqlserver:mssql-jdbc`
- **H2**: `com.h2database:h2`
- **HSQLDB**: `org.hsqldb:hsqldb`
- And any other JDBC-compliant driver

## Basic setup

Configure the target system:

```java
var sqlTarget = new SqlTargetSystem("inventory-database-id", dataSource);
```

The constructor requires the target system name and DataSource. Optional configurations can be added via `.withXXX()` methods.

:::info Register Target System
Once created, you need to register this target system with Flamingock. See [Registering target systems](introduction.md#registering-target-systems) for details.
:::

## Target System Configuration

The SQL target system uses Flamingock's [split dependency resolution architecture](introduction.md#dependency-injection) with separate flows for target system configuration and change execution dependencies.

### Constructor Dependencies (Mandatory)

These dependencies must be provided at target system creation time with **no global context fallback**:

| Dependency | Constructor Parameter | Description |
|------------|----------------------|-------------|
| `DataSource` | `dataSource` | JDBC DataSource connection pool - **required** for both target system configuration and change execution |

## Dependencies Available to Changes

Changes can access dependencies through [dependency injection with fallback](../changes/anatomy-and-structure.md#method-parameters-and-dependency-injection):

1. **Target system context** (highest priority) - `DataSource`, `Connection`, plus any added via `.addDependency()`
2. **Target system additional dependencies** - added via `.addDependency()` or `.setProperty()`
3. **Global context** (fallback) - shared dependencies available to all target systems

## Configuration example

Here's a comprehensive example showing the new architecture:

```java
// Target system configuration (mandatory via constructor)
var sqlTarget = new SqlTargetSystem("inventory-database", inventoryDataSource)
    .addDependency(inventoryService);          // Additional dependency for changes

// Global context with shared dependencies
Flamingock.builder()
    .addDependency(emailService)               // Available to all target systems
    .addDependency(logService)                 // Available to all target systems
    .addTargetSystems(sqlTarget)
    .build();
```

**Target system configuration resolution:**
- **DataSource**: Must be provided via constructor (`inventoryDataSource`)

**Change dependency resolution for Changes in "inventory-database":**
- **DataSource**: From target system context (`inventoryDataSource`)
- **Connection**: From target system context (derived from `inventoryDataSource`)
- **InventoryService**: From target system additional dependencies
- **EmailService**: From global context (fallback)
- **LogService**: From global context (fallback)

This architecture ensures explicit target system configuration while providing flexible dependency access for changes.

## Transactional support

For a Change to leverage SQL's transactional capabilities, it must use either the `DataSource` or `Connection` parameter. Flamingock uses the injected `DataSource` dependency to create connections and manage the transaction lifecycle - starting the transaction before execution, committing on success, and rolling back on failure.

> For detailed information on transaction handling, see [Transactions](../changes/transactions.md).

```java
@TargetSystem("inventory-database-id")
@Change(id = "update-products", author = "team")  // order extracted from filename
public class _20250923_01_UpdateProducts {
    
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
@TargetSystem("inventory-database-id")
@Change(id = "create-indexes", author = "team")  // order extracted from filename
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

Your Changes can inject SQL-specific dependencies like `DataSource` and `Connection`, but are not limited to these. The target system provides these dependencies through its context, and you can add additional dependencies via `.addDependency()` that take precedence over global dependencies.

For comprehensive details on change dependency resolution, see [Change Anatomy & Structure](../changes/anatomy-and-structure.md).

## Next steps

- Learn about [Target systems](introduction.md)
- Explore [Changes](../changes/introduction.md)
- See [SQL examples](https://github.com/flamingock/flamingock-examples/tree/master/sql)