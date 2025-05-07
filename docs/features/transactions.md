---
sidebar_position: 6
---

# Transactions

## Introduction

As the name suggests, a ```Change``` represents the fundamental unit of a migration. By default, each ```Change``` is executed within its own independent transaction. While this behavior can be modified through configuration, it is generally not recommended.

:::warning
In this section, the term native transactions refers to the transaction mechanisms provided directly by the database.

Flamingock strives to ensure a transactional environment whenever possible. In cases where native transactions are not supported, it attempts to manually revert changes using the ```@RollbackExecution``` ```@RollbackBeforeExecution``` method or ```rollbackSql``` declaration.
:::

## Configuration

Transaction enforcement can be configured at two levels: via the ```setTransactionEnabled()``` method in the builder, and within the specific driver implementation.

Each driver's documentation page provides detailed guidance on how to enable native transactions for that particular database.

As outlined in the runner properties table, Flamingock's native transaction handling follows the logic described below:
There are two points where the transactions are configured to be enforced or disabled, the ```setTransactionEnabled()``` method in the builder and the driver.

The Flamingock native transactionability follows the next logic:

:::tip
- When ```setTransactionEnabled(true)```, it enforces native transactions, throwing an exception is the driver is not capable of it.
- When ```setTransactionEnabled(false)```, it disables the transactions and ignores the transactionability of the driver.
- When ```setTransactionEnabled()```is not set, it totally delegates on the driver the transactionability of the migration.
:::

:::note TODO
Add a diagram to explain Flamingock transactions like https://docs.mongock.io/v5/technical-overview/#process-steps
:::

## Best practices
- Always set explicitly the Flamingock ```setTransactionEnabled()``` method to true or false.
- DDL operations placed in the ```@BeforeExecution``` method of the ```Change```.