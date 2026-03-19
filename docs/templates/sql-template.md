---
sidebar_position: 4
title: SQL Template
sidebar_label: SQL Template
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SQL Template Reference

:::caution Beta feature
The SQL Template is available in **beta**.
:::

The `SqlTemplate` provides a declarative way to define SQL database changes in YAML format. This template extends `AbstractChangeTemplate` and uses simple `apply`/`rollback` fields where the payloads are raw SQL strings.

## Getting started

The SQL Template allows you to define database changes declaratively in YAML instead of writing Java code. Here's a quick example:

```yaml
id: create-users-table
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255));"
rollback: "DROP TABLE users;"
```

## Installation

Add the SQL Template dependency to your project:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-template-sql")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-template-sql</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

## YAML structure

SQL Template changes use a simple `apply`/`rollback` format:

```yaml
id: <unique-change-id>
# transactional: defaults to true when omitted (SQL payloads make no claim)
template: SqlTemplate
targetSystem:
  id: "<target-system-id>"
apply: "<SQL statement(s)>"
rollback: "<SQL statement(s)>"
```

### Configuration attributes

- **`id`**: Unique identifier for the change, used for tracking.
- **`transactional`**: Whether to run the change in a database transaction. When omitted, defaults to `true` (the SQL Template's payloads make no transaction claim). Set `false` explicitly to opt out.
- **`template`**: Must be `SqlTemplate`.
- **`targetSystem`**: Specifies which SQL target system this change applies to.
- **`apply`**: Required. Raw SQL string to execute. Multiple statements can be separated by `;`.
- **`rollback`**: Optional. Raw SQL string to execute for rollback.
- **`configuration`**: Optional. Template-specific configuration (see below).
- **`recovery`**: Optional failure handling configuration.
  - `strategy`: Can be `MANUAL_INTERVENTION` (default) or `ALWAYS_RETRY`.

## Configuration

The SQL Template supports optional configuration via the `configuration` field:

```yaml
id: bulk-insert
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
configuration:
  splitStatements: false
apply: "INSERT INTO users VALUES (1, 'Admin', 'admin@example.com')"
rollback: "DELETE FROM users WHERE id = 1"
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `splitStatements` | boolean | `true` | Controls SQL statement splitting. When `true`, the template automatically splits multi-statement SQL using dialect-aware parsing. Set to `false` to execute the entire SQL string as a single statement. |

## Multi-statement support

The SQL Template includes intelligent SQL splitting that understands database-specific syntax. By default, it automatically splits multi-statement SQL strings and executes each statement individually. The splitting is dialect-aware, correctly handling:

- Quoted strings containing semicolons (e.g., `'text;with;semi'`)
- Dialect-specific delimiters and block syntax (e.g., `DELIMITER`, `GO`, `SET TERM`)
- Dollar-quoted strings, PL/pgSQL blocks, and other dialect features

```yaml
id: insert-seed-data
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: |
  INSERT INTO users (id, name, role) VALUES (1, 'Admin', 'superuser');
  INSERT INTO users (id, name, role) VALUES (2, 'Support', 'readonly');
  INSERT INTO users (id, name, role) VALUES (3, 'Developer', 'user');
rollback: "DELETE FROM users WHERE id IN (1, 2, 3);"
```

The splitter correctly handles complex dialect-specific syntax such as PL/pgSQL blocks:

```yaml
id: create-user-function
transactional: false
template: SqlTemplate
targetSystem:
  id: "sql"
apply: |
  CREATE OR REPLACE FUNCTION get_active_users()
  RETURNS TABLE(id INT, name VARCHAR, email VARCHAR) AS $
  BEGIN
    RETURN QUERY SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.active = true;
  END;
  $ LANGUAGE plpgsql
rollback: |
  DROP FUNCTION IF EXISTS get_active_users()
```

## Supported databases

The SQL Template supports dialect-aware statement splitting for the following databases:

| Database | Strategy | Key features |
|----------|----------|--------------|
| **MySQL** | `MySqlSplitter` | DELIMITER command, backticks, backslash escapes |
| **MariaDB** | `MariaDbSplitter` | Inherits all MySQL features |
| **PostgreSQL** | `PostgreSqlSplitter` | Dollar-quoted strings (`$`), E-strings |
| **Oracle** | `OracleSplitter` | `/` delimiter, Q-strings (`q'[...]'`) |
| **SQL Server** | `SqlServerSplitter` | `GO` batch separator, square brackets |
| **SQLite** | `SqliteSplitter` | Square brackets, backticks (MySQL compat) |
| **H2** | `H2Splitter` | Mixed mode support (PostgreSQL + MySQL features) |
| **Firebird** | `FirebirdSplitter` | `SET TERM` directive, AS context awareness |
| **IBM DB2** | `Db2Splitter` | `@` delimiter support, BEGIN ATOMIC |
| **Informix** | `InformixSplitter` | Curly brace comments, compound END keywords |
| **Sybase** | `SybaseSplitter` | Inherits SQL Server features |

The dialect is automatically detected from the JDBC connection metadata.

## Complete examples

### Example 1: Create table with seed data

```yaml
id: create-users-table
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255), role VARCHAR(50));"
rollback: "DROP TABLE users;"
```

```yaml
id: seed-users
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: |
  INSERT INTO users (id, name, email, role) VALUES (1, 'Admin', 'admin@company.com', 'superuser');
  INSERT INTO users (id, name, email, role) VALUES (2, 'Support', 'support@company.com', 'readonly');
rollback: "DELETE FROM users WHERE id IN (1, 2);"
```

### Example 2: Schema change with index

```yaml
id: add-status-column
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: |
  ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  CREATE INDEX idx_users_status ON users (status);
rollback: |
  DROP INDEX idx_users_status;
  ALTER TABLE users DROP COLUMN status;
```

### Example 3: Data migration

```yaml
id: migrate-user-roles
transactional: true
template: SqlTemplate
targetSystem:
  id: "sql"
apply: |
  CREATE TABLE roles (id INT PRIMARY KEY, name VARCHAR(50));
  INSERT INTO roles (id, name) VALUES (1, 'superuser'), (2, 'readonly'), (3, 'user');
  ALTER TABLE users ADD COLUMN role_id INT REFERENCES roles(id);
  UPDATE users SET role_id = (SELECT id FROM roles WHERE name = users.role);
rollback: |
  ALTER TABLE users DROP COLUMN role_id;
  DROP TABLE roles;
```

## File naming convention

Change files are executed in alphabetical order. Use a numeric prefix to control execution order:

```
_0001__create_users_table.yaml
_0002__seed_users.yaml
_0003__add_status_column.yaml
```
