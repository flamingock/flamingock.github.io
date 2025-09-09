---
title: Introduction
sidebar_position: 1
sidebar_label: Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Flamingock library configuration

Flamingock provides flexible configuration options to support a variety of environments and workflows — from local setups to cloud-native distributed systems.

Configuration is divided into two distinct scopes:

- **Setup configuration** defines how Flamingock discovers and organizes change units. This is configured using the `@Flamingock` annotation.

- **Runtime configuration** includes optional parameters such as locking, metadata, author, etc., and can be provided via builder or (depending on the environment) a file.


## What you can configure

| Area                             | Description                                         | Link |
|----------------------------------|-----------------------------------------------------|------|
| ⭐ Setup & stages                | Organize changes into ordered stages - **Essential** | [Setup & stages](./setup-and-stages.md) |
| ⭐ Target systems               | Configure target systems for your changes - **Essential** | [Target systems](../target-systems/introduction.md) |
| ⭐ Audit store                  | Configure audit storage - **Essential** (Not needed for Cloud Edition) | [Audit stores](../audit-stores/introduction.md) |
| Global dependency injection      | Dependency injection to ChangeUnits and environment | [Context and dependencies](./context-and-dependencies.md) |
| Cloud Edition                    | Cloud-specific setup: token, env, service           | [Cloud Edition](../cloud-edition/cloud-edition.md) |
| Framework integration            | Integration with frameworks (currently Spring Boot) | [Spring Boot integration](../frameworks/springboot-integration/introduction.md) |
| Lock                             | Distributed locking and timing options              | [Lock configuration](./lock.md) |
| Extra                            | Metadata, default author, enable/disable            | [Additional configuration](./additional-configuration.md) |


Each of these topics is explained in its own section.




## Applying runtime configuration
Runtime configuration (everything except the pipeline) can be applied in the following ways:

| Runtime environment |  Builder  |         File          |
|---------------------|:---------:|:---------------------:|
| Standalone          |     ✅     |    ❌ (coming soon)    |
| Springboot          |     ✅     |  ✅(framework native)  |

:::info
You can combine both approaches. If a property is defined in both, the builder value takes precedence.
:::


## Next steps

Start with the essential configurations marked with ⭐, then explore additional options based on your needs:

### Essential configurations (start here)
- [⭐ Setup & stages](./setup-and-stages.md) - Define how changes are organized and discovered
- [⭐ Target systems](../target-systems/introduction.md) - Configure systems where changes will be applied
- [⭐ Audit stores](../audit-stores/introduction.md) - Set up audit storage (not needed for Cloud Edition)

### Additional configurations
- [Global dependency injection](./context-and-dependencies.md) - Configure dependency resolution
- [Framework integration](../frameworks/springboot-integration/introduction.md) - Spring Boot integration
- [Lock configuration](./lock.md) - Distributed locking options
- [Additional configuration](./additional-configuration.md) - Metadata, author, and other settings

### Choose your edition
- [☁️ Cloud Edition](../cloud-edition/cloud-edition.md) - Fully-featured managed solution
- [🧪 Community Edition](../audit-stores/introduction.md) - Community audit stores (feature-limited)
