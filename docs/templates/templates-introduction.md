---
sidebar_position: 1
title: Introduction
sidebar_label: Templates Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Templates

:::caution Beta feature
Templates are available in **beta**.  
- You can already create **custom templates** for your own use cases.  
- Our **official templates** (SQL, MongoDB, etc.) are **experimental** and not yet recommended for production.  
- Expect API and behavior changes before GA.  

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of ChangeUnits.
:::

## Introduction

Flamingock Templates are experimental modules designed to streamline the integration of common third-party services, databases, and configurations into the **Flamingock change management system**. These templates provide a structured way to define configuration changes in declarative format (such as **YAML** files), reducing the need for custom code-based ChangeUnits while ensuring execution and versioning of changes.

## How It Works

Flamingock Templates are designed to simplify change definitions by extracting reusable logic into modular building blocks. While **Flamingock’s core approach** relies on code-based ChangeUnits to manage database and system changes, Flamingock Templates provide a **low-code alternative** that simplifies the process for common integration scenarios. Instead of writing Java classes for each migration, users can leverage existing templates by defining changes in a declarative format(**YAML**, etc.).

### Who Provides Templates?

Templates can be:
- **Provided by the Flamingock core team** (e.g., SQL, Kafka, Redis)
- **Offered by the community**
- **Created internally by teams** to address common patterns in their own systems

This makes them highly adaptable: whether you're integrating a database, messaging system, or internal service, templates give you a low-code mechanism to structure your changes cleanly and consistently.

### Why Do Templates Exist?

Templates exist to solve a common problem in traditional, code-based migrations: **duplicated logic across ChangeUnits**.

Instead of repeating the same boilerplate code over and over, templates let you **externalize the logic** into a reusable definition and **parameterize** what's different.

Today, Flamingock templates can already be created and used in your own projects. However, the official templates provided by the Flamingock team are experimental, and their APIs may change before GA.

## Key Features

- **Experimental, reusable modules**: Each template provides a well-defined structure for managing migrations and configurations.
- **Declarative ChangeUnits**: Users define changes in YAML, avoiding Java boilerplate.
- **Support for third-party integrations**: Includes databases, messaging systems, and cloud configurations.
- **Automatic execution and versioning**: Templates are applied and tracked as part of Flamingock's change management process.
- **Designed to encourage best practices, though still experimental**.
- **Extensible by the community**: Developers can contribute new templates to expand Flamingock's ecosystem.

## When to use Template-based ChangeUnits vs. code-based ChangeUnits

| **Use Case** | **Template-Based ChangeUnit** | **Code-Based ChangeUnit** |
|-------------|-----------------------------|-------------------------|
| Integration with third-party services (e.g., Kafka, Twilio) | ✅ | ✅ |
| Simple database migrations (e.g., SQL schema updates) | ✅ | ✅ |
| Custom logic and advanced migrations | ☑️* | ✅ |
| Complex, dynamic change sequences | ☑️** | ✅ |
| Low-code, configuration-driven changes | ✅ | ❌ |

☑️* Templates can handle custom logic if it can be abstracted and reused. Users can create custom templates to manage these scenarios.

☑️** While templates may support complex change sequences, full control and dynamic logic might be easier to implement in code when the scenario is highly specific or non-repetitive.


## List of current Flamingock templates

| Template Name | Description | Status |
|--------------|-------------|---------|
| **SQL Template** | Enables SQL-based migrations using YAML-defined ChangeUnits | 🟡 Experimental |
| **MongoDB Template** | Manages MongoDB operations and schema changes using YAML definitions | 🟡 Experimental |
| **Kafka Template** | Manages Kafka topics and configurations using YAML definitions | 🔴 Not yet available |
| **S3 Template** | Manages S3 bucket operations and object configurations via YAML | 🔴 Not yet available |

---

Flamingock Templates unlock new possibilities for application evolution. Whether you're managing **databases, configurations, or third-party services**, templates simplify the process, though they are still experimental and not yet recommended for production use. 

:::tip 
Join the [**Flamingock community**](https://github.com/flamingock/flamingock-project/discussions) and start building your own templates today! 🚀
:::
