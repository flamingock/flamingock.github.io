---
title: Introduction
sidebar_position: 1
sidebar_label: Library Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Flamingock library configuration

Flamingock provides flexible configuration options to support a variety of environments and workflows — from local setups to cloud-native distributed systems.

Configuration is divided into two distinct scopes:

- **Setup configuration** defines how Flamingock discovers and organizes change units. This is configured using the `@Flamingock` annotation.

- **Runtime configuration** includes optional parameters such as locking, metadata, author, etc., and can be provided via builder or (depending on the environment) a file.

---

## What you can configure

| Area                             | Description                                         |
|----------------------------------|-----------------------------------------------------|
| Setup & Stages                   | Organize changes into ordered stages                |
| ChangeUnits dependency injection | Dependency injection to changeUnits and environment |
| Platform component injection     | Platform-level components injection                 |
| Lock                             | Distributed locking and timing options              |
| Extra                            | Metadata, default author, enable/disable            |
| Cloud Edition                    | Cloud-specific setup: token, env, service           |
| Community Edition                | Driver-specific config for MongoDB, DynamoDB...     |


Each of these topics is explained in its own section.

---

## Configuration scopes and layers

Flamingock configuration is organized in two main scopes:
### Core configuration (shared by all editions)
Includes:
- Setup and stages definition
- Lock settings
- Metadata
- Default author
- Enable/disable flag
- Dependency injection via addDependency(...) for ChangeUnits and framework components
- etc.

### Edition-specific configuration
Based on the edition of Flamingock you import:
- **Cloud Edition**: Related settings to configure Flamingock Cloud.
- **Community Edition**: MongoDB, DynamoDB, Couchbase drivers and related settings.

Each of these can be used in two runtime environments:
- **Standalone** (default) — direct usage with builder (file-based config will be supported soon)
- **Spring Boot** — supports both setups; builder and integration with Spring’s lifecycle and properties (covered in a separate section)

---

## Setup and stages configuration

Stages are configured using the `@EnableFlamingock` annotation on any class in your application:

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourapp.changes")
    }
)
public class FlamingockConfig {
    // Configuration class
}
```

Alternatively, you can use a dedicated file by specifying `pipelineFile` in the annotation:
```java
@EnableFlamingock(pipelineFile = "config/pipeline.yaml")
public class FlamingockConfig {}
```

The annotation should contain **only** the pipeline and stage definitions — no runtime configuration should be placed here.

:::info
- The `@EnableFlamingock` annotation is required for all runners and all environments.
- The pipeline definition should remain the same across environments.
- To conditionally include or exclude changes, Flamingock supports [profiles](../frameworks/springboot-integration/profiles.md).
- Profile support for stages is planned but not yet available.
:::

See the [Pipeline & stages](setup-and-stages.md) page for full details and examples.


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

## Next steps

Explore the rest of the configuration section to tune Flamingock for your system:

### Shared configuration
- [Setup & Stages](./setup-and-stages.md)
- [Lock Configuration](./lock-configuration.md)
- [Extra Configuration](./extra-configuration.md)
- [Dependency wiring](./changeunit-dependency-injection.md)

### Pick an edition
- [☁️ Cloud Edition(Fully-featured)](../cloud-edition/cloud-edition.md)
- 🧪 Community Edition(feature-limited)
