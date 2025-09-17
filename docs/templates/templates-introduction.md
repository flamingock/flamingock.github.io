---
sidebar_position: 1
title: Introduction
sidebar_label: Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Templates

:::caution Beta feature
Templates are available in **beta**.  
- You can already create **custom templates** for your own use cases.  
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.  
- We're building a **comprehensive template catalog** where teams can discover, share, and contribute templates for common integration patterns.
- Expect API and behavior changes before GA.  

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of Changes.
:::

## Introduction

Flamingock Templates are experimental modules designed to streamline the integration of common third-party services, databases, and configurations into the **Flamingock change management system**. These templates provide a structured way to define system changes in declarative format (such as **YAML** files), reducing the need for custom code-based Changes while ensuring execution and versioning of changes.

## How It Works

Flamingock Templates are designed to simplify change definitions by extracting reusable logic into modular building blocks. While **Flamingock’s core approach** relies on code-based Changes to manage database and system changes, Flamingock Templates provide a **low-code alternative** that simplifies the process for common integration scenarios. Instead of writing Java classes for each migration, users can leverage existing templates by defining changes in a declarative format(**YAML**, etc.).

### Who Provides Templates?

Templates can be:
- **Provided by the Flamingock core team** (e.g., SQL, Kafka, Redis)
- **Offered by the community**
- **Created internally by teams** to address common patterns in their own systems

This makes them highly adaptable: whether you're integrating a database, messaging system, or internal service, templates give you a low-code mechanism to structure your system changes cleanly and consistently.

### Why Do Templates Exist?

Templates exist to solve a common problem in traditional, code-based changes: **duplicated logic across Changes**.

Instead of repeating the same boilerplate code over and over, templates let you **externalize the logic** into a reusable definition and **parameterize** what's different.

Today, Flamingock templates can already be created and used in your own projects. However, the official templates provided by the Flamingock team are experimental, and their APIs may change before GA.

## Key Features

- **Experimental, reusable modules**: Each template provides a well-defined structure for managing system changes and configurations.
- **Declarative Changes**: Users define changes in YAML, avoiding Java boilerplate.
- **Support for third-party integrations**: Includes databases, messaging systems, and cloud configurations.
- **Automatic execution and versioning**: Templates are applied and tracked as part of Flamingock's change management process.
- **Designed to encourage best practices, though still experimental**.
- **Extensible by the community**: Developers can contribute new templates to expand Flamingock's ecosystem.

## When Template-based Changes Shine

Template-based Changes are ideal when you have **reusable patterns** in your system changes. They excel in scenarios where the same type of operation needs to be repeated with different parameters, allowing you to avoid duplicating boilerplate code across multiple Changes.

**Templates shine when:**

- **You have repetitive patterns**: Creating database tables, indexes, Kafka topics, S3 buckets, or API configurations that follow the same structure but with different values
- **Multiple team members need to make similar changes**: Templates provide a consistent, declarative way for developers to define changes without writing boilerplate code
- **You want to enforce best practices**: Templates encapsulate proven logic and prevent implementation inconsistencies across your changes
- **The change type already has a template**: Why reinvent the wheel when S3, Kafka, SQL, MongoDB, or other common templates already exist?

**Stick with code-based Changes when:**

- **You have unique, one-off logic**: Complex business transformations that are specific to your application and unlikely to be repeated
- **You need maximum flexibility**: Custom integrations or complex workflows that require full programmatic control
- **No suitable template exists**: When your use case doesn't match any available templates and creating a custom template isn't justified

**Remember**: Templates can handle any level of complexity - from simple configuration updates to sophisticated multi-step operations. The decision isn't about complexity, but about **reusability** and whether the pattern is worth abstracting into a declarative format.

Flamingock Templates unlock new possibilities for application evolution. Whether you're managing **databases, configurations, or third-party services**, templates simplify the process, though they are still experimental and not yet recommended for production use. 

:::tip 
Join the [**Flamingock community**](https://github.com/flamingock/flamingock-project/discussions) and start building your own templates today! 🚀
:::
