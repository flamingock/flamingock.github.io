---
sidebar_position: 1
title: Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Templates

## Introduction

Flamingock Templates are pre-built modules designed to streamline the integration of common third-party services, databases, and configurations into the **Flamingock change management system**. These templates provide a structured way to define configuration changes in declarative format (such as **YAML** files), reducing the need for custom Code-Based ChangeUnits while ensuring seamless execution and versioning of changes.

## How It Works

Flamingock Templates are designed to simplify change definitions by extracting reusable logic into modular building blocks. While **Flamingock’s core approach** relies on Code-Based ChangeUnits to manage database and system changes, Flamingock Templates provide a **low-code alternative** that simplifies the process for common integration scenarios. Instead of writing Java classes for each migration, users can leverage existing templates by defining changes in a declarative format(**YAML**, etc.). This approach offers:

### Who Provides Templates?

Templates can be:
- **Provided by the Flamingock core team** (e.g., SQL, Kafka, Redis)
- **Offered by the community**
- **Created internally by teams** to address common patterns in their own systems

This makes them highly adaptable: whether you're integrating a database, messaging system, or internal service, templates give you a low-code mechanism to structure your changes cleanly and consistently.

### Why Do Templates Exist?

Templates exist to solve a common problem in traditional, code-based migrations: **duplicated logic across ChangeUnits**.

Instead of repeating the same boilerplate code over and over, templates let you **externalize the logic** into a reusable definition and **parameterize** what’s different.

---

### 🔁 A Simple Example

Imagine you're working on a Java application that manages users and roles in a database. You’re using Code-based ChangeUnits like this:

```java
@ChangeUnit(id = "create-users-table", order = 1, author = "flamingock")
public class CreateUsersTableChangeUnit {

    @Execution
    public void execute() {
        // Java logic to create `users` table
    }
}

@ChangeUnit(id = "create-roles-table", order = 2, author = "flamingock")
public class CreateRolesTableChangeUnit {

    @Execution
    public void execute() {
        // Java logic to create `roles` table
    }
}
```

These classes are almost identical — they only differ in the SQL they execute. Over time, these small repetitions add up.

---

### 💡 Now with Templates

Instead of duplicating logic, you could define a single template (e.g. `sql-template`) that handles SQL execution generically. Then you just pass the SQL via configuration:

```yaml
id: create-users-table
order: 1
templateName: sql-template
templateConfiguration:
  executionSql: |
    CREATE TABLE users (
      id INT PRIMARY KEY,
      name VARCHAR(255)
    )
```

```yaml
id: create-roles-table
order: 2
templateName: sql-template
templateConfiguration:
  executionSql: |
    CREATE TABLE roles (
      id INT PRIMARY KEY,
      role_name VARCHAR(255)
    )
```

Behind the scenes, the **template handles the logic**: connection management, execution, rollback, etc.

---

### What You Gain

- **Less boilerplate**: You don’t need to write 10 near-identical Java classes.
- **Faster development**: Anyone can create or modify a change by editing a config file.
- **Safer migrations**: Centralized logic makes it easier to test and enforce best practices.

:::info
Templates let you think in terms of ***what*** you want to do — not ***how*** you implement it every time.
:::

## Key Features

- **Pre-built, reusable modules**: Each template provides a well-defined structure for managing migrations and configurations.
- **Declarative Change Units**: Users define changes in YAML, avoiding Java boilerplate.
- **Support for third-party integrations**: Includes databases, messaging systems, and cloud configurations.
- **Automatic execution and versioning**: Templates are applied and tracked as part of Flamingock’s change management process.
- **Built-in best practices**: Ensures correctness and reliability for each integration.
- **Extensible by the community**: Developers can contribute new templates to expand Flamingock’s ecosystem.

## When to Use Template-Based ChangeUnits vs. Code-Based ChangeUnits

| **Use Case** | **Template-Based ChangeUnit** | **Code-Based ChangeUnit** |
|-------------|-----------------------------|-------------------------|
| Simple database migrations (e.g., SQL schema updates) | ✅ | ✅ |
| Integration with third-party services (e.g., Kafka, Twilio) | ✅ | ✅ |
| Custom logic and advanced migrations | ☑️* | ✅ |
| Complex, dynamic change sequences | ☑️** | ✅ |
| Low-code, configuration-driven changes | ✅ | ❌ |

☑️* Templates can handle custom logic if it can be abstracted and reused. Users can create custom templates to manage these scenarios.

☑️** While templates may support complex change sequences, full control and dynamic logic might be easier to implement in code when the scenario is highly specific or non-repetitive.


## List of Current Flamingock Templates

| Template Name | Description |
|--------------|-------------|
| **SQL Template** | Enables SQL-based migrations using YAML-defined Change Units. |
| **Kafka Template** (Upcoming) | Manages Kafka topics and configurations using YAML definitions. |
| **Twilio Template** (Upcoming) | Simplifies Twilio messaging configurations via YAML. |
| **Redis Template** (Upcoming) | Allows structured updates to Redis configurations. |

---

Flamingock Templates unlock new possibilities for seamless application evolution. Whether you’re managing **databases, configurations, or third-party services**, templates simplify the process, ensuring **faster, safer, and more standardised migrations**. Join the **Flamingock community** and start building your own templates today! 🚀
