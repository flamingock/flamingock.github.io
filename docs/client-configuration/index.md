---
title: Client Configuration
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Configuration Overview

Flamingock provides flexible configuration options to support a variety of environments and workflows — from local setups to cloud-native distributed systems.

You can configure Flamingock using:

- **Builder-based configuration** — via code (Java/Kotlin standalone setup)
- **File-based configuration** — using a unified `flamingock.yaml` file placed in your resources folder

> 🔁 *When a property is defined in both the builder and the YAML file, the builder value takes precedence.*

> 📌 *Note:* The **pipeline definition must always be provided in the YAML file**. Configuration can be fully declared in the file, or split between YAML and the builder.

---

## 🔍 What You Can Configure

| Area                  | Description                                      |
|-----------------------|--------------------------------------------------|
| 📦 Pipeline & Stages  | Organize changes into ordered stages             |
| 🔒 Lock               | Distributed locking and timing options           |
| 🧱 Other              | Metadata, default author, enable/disable         |
| ☁️ Cloud Edition      | Cloud-specific setup: token, env, service        |
| 🧪 Community Edition  | Driver-specific config for MongoDB, DynamoDB...  |


Each of these topics is explained in its own section.

---

## 🧭 Configuration Scopes and Layers

Flamingock configuration is organized in two main scopes:

### 1. Core Configuration (shared by all editions)
Includes:
- Pipeline definition
- Lock settings
- Metadata
- Default author
- Enable/disable flag
- etc.

### 2. Edition-Specific Configuration
Based on the edition of Flamingock you import:
- **Cloud Edition**: Related settings to configure Flamingock Cloud.
- **Community Edition**: MongoDB, DynamoDB, Couchbase drivers and related settings.

Each of these can be used in two environments:
- **Standalone** (default) — direct usage with builder or `flamingock.yaml`
- **Spring Boot** — integrated with Spring’s lifecycle and properties (covered in a separate section)

---

## 📁 Configuration File: `flamingock.yaml`

Flamingock expects the configuration file to be located at **`src/main/resources/flamingock.yaml`**

This file contains both the pipeline definition and optional configuration:

```yaml
lockAcquiredForMillis: 60000
metadata:
  owner: backend-team
pipeline:
  stages:
    - name: init
      sourcesPackage: io.flamingock.changes.init
```

> 💡 *You can override the default path via compiler options.*

---

## ➕ How to Apply Configuration

You can apply configuration in **one or both** of the following ways:


<Tabs groupId="config">
    <TabItem value="file" label="Unified YAML" default>
```yaml
enabled: true
defaultAuthor: antonio
lockAcquiredForMillis: 60000
pipeline:
  stages:
    - name: init
      sourcesPackage: com.yourcompany.flamingock.mysql
```
    </TabItem>
    <TabItem value="builder" label="Builder">
```java
FlamingockStandalone
  .setLockAcquiredForMillis(60000)
  .setEnabled(true)
  .build()
  .run();
```
    </TabItem>
</Tabs>


> 📌 **The `flamingock.yaml` file must always exist**, at a minimum containing the pipeline definition. All other configuration may either be placed in the file, in the builder, or split between them.

---

## ✅ Next Steps

Explore the rest of the configuration section to tune Flamingock for your system:

- 📦 Pipeline & Stages
- 🔒 Lock Configuration
- 🧱 Other Configuration
- ☁️ Cloud Edition
- 🧪 Community Edition
