---
title: Introduction
sidebar_position: 1
sidebar_label: Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Flamingock library configuration

Flamingock provides configuration options for organizing Changes, connecting Target Systems, and configuring the required local Audit Store resources. Cloud Edition is coming soon; it provides Cloud capabilities while retaining those local resources.

Configuration is divided into two distinct scopes:

- **Setup configuration** defines how Flamingock discovers and organizes change units. This is configured using the `@Flamingock` annotation.

- **Runtime configuration** includes optional parameters such as locking, metadata, author, etc., and can be provided via builder or (depending on the environment) a file.


## What you can configure

| Area                        | Description                                                                 | Link                                                                            |
|-----------------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| ⭐ Setup & stages           | Organize changes into ordered stages - **Essential**                        | [Setup & stages](./setup-and-stages.md)                                         |
| ⭐ Target systems           | Configure target systems for your changes - **Essential**                   | [Target systems](../target-systems/introduction.md)                             |
| ⭐ Audit store              | Configure required local audit, lock, and journal resources - **Essential** | [Audit stores](../audit-stores/introduction.md)                                 |
| Cloud Edition (coming soon) | Cloud reporting, RBAC, and multi-environment governance                     | [Cloud Edition](../cloud-edition/cloud-edition.md)                              |
| Global dependency injection | Dependency injection to Changes and environment                             | [Context and dependencies](./context-and-dependencies.md)                       |
| Framework integration       | Integration with frameworks (currently Spring Boot)                         | [Spring Boot integration](../frameworks/springboot-integration/introduction.md) |
| Lock                        | Distributed locking and timing options                                      | [Lock configuration](./lock.md)                                                 |
| Extra                       | Metadata, default author, enable/disable                                    | [Additional configuration](./additional-configuration.md)                       |


Each of these topics is explained in its own section.




## Applying runtime configuration
Runtime configuration (everything except the pipeline) can be applied in the following ways:

| Runtime environment | Builder |         File         |
|---------------------|:-------:|:--------------------:|
| Standalone          |   ✅    |   ❌ (coming soon)   |
| Springboot          |   ✅    | ✅(framework native) |

:::info
You can combine both approaches. If a property is defined in both, the builder value takes precedence.
:::


## Next steps

Start with the essential configurations marked with ⭐, then explore additional options based on your needs:

### Essential configurations (start here)
- [⭐ Setup & stages](./setup-and-stages.md) - Define how changes are organized and discovered
- [⭐ Target systems](../target-systems/introduction.md) - Configure systems where changes will be applied
- [⭐ Audit stores](../audit-stores/introduction.md) - Set up the required audit, lock, and journal resources

### Additional configurations
- [Global dependency injection](./context-and-dependencies.md) - Configure dependency resolution
- [Framework integration](../frameworks/springboot-integration/introduction.md) - Spring Boot integration
- [Lock configuration](./lock.md) - Distributed locking options
- [Additional configuration](./additional-configuration.md) - Metadata, author, and other settings

### Choose your edition
- [☁️ Cloud Edition (coming soon)](../cloud-edition/cloud-edition.md) - Cloud reporting, RBAC, and multi-environment governance complement the required local resources
- [🧪 Community Edition](../audit-stores/introduction.md) - Configure the required local audit, lock, and journal resources
