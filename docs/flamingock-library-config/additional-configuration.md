---
title: Additional configuration
sidebar_position: 60
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Additional configuration

This section includes additional settings for customizing defaults and adding contextual information to your Flamingock setup.

| Setting         | Purpose                                      | Default            |
|-----------------|-----------------------------------------------|--------------------|
| `metadata`      | Attach tags and labels for audit tracking     | _empty map_        |
| `enabled`       | Globally enable/disable Flamingock            | `true`             |

:::note
These options can currently be defined using the Flamingock builder. Support for config file (outside Spring Boot) will be added in a future release
:::

## Metadata

Flamingock provides a Metadata object - which is a flexible `Map<String, Object>` that allows you to attach custom information to your Flamingock process.

The metadata is stored as part of the **audit log**, and can be used for labeling, traceability, and future reporting.

### Use cases
You can use metadata to:
- Tag executions by **team**, **service**, or **region**
- Include a **deployment ID**, **build number**, or **triggering user**
- Attach **comments** or **labels** for easier traceability

### Example

<Tabs groupId="config">
    <TabItem value="file" label="YAML" default>
```yaml
metadata:
  owner: platform-team
  triggeredBy: ci-cd-pipeline
  notes: initial deployment setup
```
    </TabItem>
    <TabItem value="builder" label="Builder">
```java
Map<String, Object> metadata = new HashMap<>();
metadata.put("owner", "platform-team");
metadata.put("triggeredBy", "ci-cd-pipeline");

Flamingock.builder()
.setMetadata(metadata)
...
```
    </TabItem>
</Tabs>


## Disable flamingock process

This global toggle allows you to enable or disable Flamingock.

- If set to `false`, Flamingock will **not run**
- A log message will appear in the **application logs**, indicating that Flamingock is disabled
- No changes will be applied and no audit entries will be created

:::note
Useful in test environments, local runs, or cases where you want to conditionally skip changes.
:::

### Example

<Tabs groupId="config">
    <TabItem value="file" label="YAML" default>
```yaml
enabled: false
```
    </TabItem>
    <TabItem value="builder" label="Builder">
```java
Flamingock.builder()
  .setEnabled(false)
```
    </TabItem>
</Tabs>

