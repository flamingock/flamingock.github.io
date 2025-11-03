---
title: SQL
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SQL Audit Store

The SQL audit store (`SqlAuditStore`) enables Flamingock to record execution history and ensure safe coordination across distributed deployments using any supported SQL database as the storage backend.

> For a conceptual explanation of the audit store vs target systems, see [Audit store vs target system](../../get-started/audit-store-vs-target-system.md).

## Supported databases

:::info Automatic Dialect Detection
Flamingock automatically detects the database vendor from the DataSource connection metadata and applies the appropriate SQL dialect. No manual configuration required.
:::

The following databases are supported:

| Database     | Auto-detection | Notes                                    |
|--------------|----------------|------------------------------------------|
| MySQL        | ✅             | 5.7+ recommended                         |
| MariaDB      | ✅             | 10.3+ recommended                        |
| PostgreSQL   | ✅             | 12+ recommended                          |
| SQLite       | ✅             | Suitable for testing and local development |
| H2           | ✅             | Ideal for testing environments           |
| HSQLDB       | ✅             | Testing and embedded scenarios           |
| SQL Server   | ✅             | 2017+ recommended                        |
| Oracle       | ✅             | 19c+ recommended                         |
| Sybase       | ✅             | ASE 16+ recommended                      |
| Firebird     | ✅             | 3.0+ recommended                         |
| Informix     | ✅             | 12.10+ recommended                       |
| DB2          | ✅             | 11.5+ recommended                        |

## Installation

Add your preferred JDBC driver dependency to your project:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>
```kotlin
// PostgreSQL example
implementation("org.postgresql:postgresql:42.7.0")

// MySQL example  
implementation("mysql:mysql-connector-java:8.0.33")

```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<!-- PostgreSQL example -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.0</version>
</dependency>

<!-- MySQL example -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
```
  </TabItem>
</Tabs>

## Basic setup

Configure the audit store:

```java
var auditStore = new SqlAuditStore(dataSource);
```

The constructor requires a `DataSource`. Optional configurations can be added via `.withXXX()` methods.

:::info Register Audit Store
Once created, you need to register this audit store with Flamingock. See [Registering the community audit store](../introduction.md#registering-the-community-audit-store) for details.
:::

## Audit Store configuration

The SQL audit store uses explicit configuration with no global context fallback.

### Constructor dependencies (mandatory)

These dependencies must be provided at audit store creation time with **no global context fallback**:

| Dependency   | Constructor Parameter | Description                                                              |
|--------------|-----------------------|--------------------------------------------------------------------------|
| `DataSource` | `dataSource`          | SQL database connection pool - **required** for audit store configuration |

### Optional configuration (.withXXX() methods)

These configurations can be customized via `.withXXX()` methods with **no global context fallback**:

| Configuration           | Method                           | Default              | Description                           |
|-------------------------|----------------------------------|----------------------|---------------------------------------|
| `Auto Create`           | `.withAutoCreate(enabled)`       | `true`               | Auto-create tables and indexes        |
| `Audit Repository Name` | `.withAuditRepositoryName(name)` | `flamingockAuditLog` | Table name for audit entries          |
| `Lock Repository Name`  | `.withLockRepositoryName(name)`  | `flamingockLock`     | Table name for distributed locks      |

**Important**: These default values are optimized for maximum consistency and should ideally be left unchanged. Override them only for testing purposes or exceptional cases.

## Configuration example

Here's a comprehensive example showing the configuration:

```java
// Audit store configuration (mandatory via constructor)
var auditStore = new SqlAuditStore(dataSource)
    .withAutoCreate(true)                          // Optional configuration
    .withAuditRepositoryName("custom_audit_log")   // Optional configuration
    .withLockRepositoryName("custom_lock_table");  // Optional configuration

// Register with Flamingock
Flamingock.builder()
    .setAuditStore(auditStore)
    .addTargetSystems(targetSystems...)
    .build();
```

**Audit store configuration resolution:**
- **DataSource**: Must be provided via constructor
- **Database dialect**: Automatically detected from DataSource vendor
- **Table configurations**: Uses explicit configuration instead of defaults

This architecture ensures explicit audit store configuration with no fallback dependencies.

## Database-specific examples

### PostgreSQL
```java
// PostgreSQL DataSource configuration
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
config.setUsername("user");
config.setPassword("password");
config.setDriverClassName("org.postgresql.Driver");

DataSource dataSource = new HikariDataSource(config);
var auditStore = new SqlAuditStore(dataSource);
```

### MySQL
```java
// MySQL DataSource configuration
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
config.setUsername("user");
config.setPassword("password");
config.setDriverClassName("com.mysql.cj.jdbc.Driver");

DataSource dataSource = new HikariDataSource(config);
var auditStore = new SqlAuditStore(dataSource);
```

## Schema management

When `autoCreate` is enabled (default), Flamingock automatically creates the required tables:

- **Audit table** (default: `flamingockAuditLog`): Stores execution history
- **Lock table** (default: `flamingockLock`): Manages distributed locking

The SQL schemas are automatically optimized for each supported database dialect.

:::tip Database Permissions
Ensure your database user has `CREATE TABLE` and `CREATE INDEX` permissions when using `autoCreate=true`.
:::

## Next steps

- Learn about [Target systems](../../target-systems/introduction.md)
- 👉 See a [full example project](https://github.com/flamingock/flamingock-java-examples)