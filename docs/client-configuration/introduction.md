---
title: Introduction
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Client configuration

Flamingock provides flexible configuration options to support a variety of environments and workflows — from local setups to cloud-native distributed systems.

Configuration is divided into two distinct scopes:

- **Pipeline configuration** defines how Flamingock discovers and organizes change units. This must always be defined in a dedicated file.

- **Runtime configuration** includes optional parameters such as locking, metadata, author, etc., and can be provided via builder or (depending on the environment) a file.

---

## What You Can Configure

| Area                 | Description                                         |
|----------------------|-----------------------------------------------------|
| 📦 Pipeline & Stages | Organize changes into ordered stages                |
| 🔒 Lock              | Distributed locking and timing options              |
| 🔌 Dependency wiring | Dependency injection to changeUnits and environment |
| ⚙️ Extra             | Metadata, default author, enable/disable            |
| ☁️ Cloud Edition     | Cloud-specific setup: token, env, service           |
| 🧪 Community Edition | Driver-specific config for MongoDB, DynamoDB...     |


Each of these topics is explained in its own section.

---

## Configuration Scopes and Layers

Flamingock configuration is organized in two main scopes:
### Core Configuration (shared by all editions)
Includes:
- Pipeline definition
- Lock settings
- Metadata
- Default author
- Enable/disable flag
- etc.

### Edition-Specific Configuration
Based on the edition of Flamingock you import:
- **Cloud Edition**: Related settings to configure Flamingock Cloud.
- **Community Edition**: MongoDB, DynamoDB, Couchbase drivers and related settings.

Each of these can be used in two runtime environments:
- **Standalone** (default) — direct usage with builder (file-based config will be supported soon)
- **Spring Boot** — supports both setups; builder and integration with Spring’s lifecycle and properties (covered in a separate section)

---

## Defining pipeline configuration

The pipeline must be defined in its own dedicated file located at:
```js
src/main/resources/flamingock/pipeline.yaml
```
This file is required for all runners and all environments. It should contain **only** the pipeline and stage definitions — no runtime configuration should be placed here.

The location of the `resources` directory can be customized using the `resources` compiler option.

:::info
- The pipeline definition should remain the same across environments.
- To conditionally include or exclude changes, Flamingock supports [profiles](../profiles.md).
- Profile support for stages is planned but not yet available.
:::

See the [Pipeline & stages](pipeline-and-stages.md) page for full details and examples.


---

## Applying runtime configuration
Runtime configuration (everything except the pipeline) can be applied in the following ways:

| Runtime environment |  Builder  |         File          |
|---------------------|:---------:|:---------------------:|
| Standalone          |     ✅     |    ❌ (coming soon)    |
| Springboot          |     ✅     |  ✅(framework native)  |

:::info
You can combine both approaches. If a property is defined in both, the builder value takes precedence.
:::

---

## Next Steps

Explore the rest of the configuration section to tune Flamingock for your system:

- [📦 Pipeline & Stages](pipeline-and-stages.md)
- [🔒 Lock Configuration](lock-configuration.md)
- [⚙  Extra Configuration](extra-configuration.md)
- [🔌 Dependency wiring](dependency-wiring.md)
- ☁️ Cloud Edition
- 🧪 Community Edition
