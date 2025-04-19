---
sidebar_position: 9
---
# From Mongock to Flamingock

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Welcome to the migration guide for transitioning from Mongock to Flamingock. This document provides a step-by-step process to migrate your existing Mongock setup to Flamingock.

:::warning

- It is strongly advised that your Mongock setup is updated to version 5 before initiating the migration.
- Conduct the migration process within a testing environment.
- ❗ Important: Under no circumstances should you modify your existing ChangeUnits from Mongock. They must remain intact—especially their annotations and execution logic. Changing them can lead to undesired re-execution and compromise system integrity.

:::

## 1. Replace Mongock Dependencies with Flamingock Client Dependency

Update your build configuration to replace Mongock dependencies with Flamingock Client dependency. You can use either:

- Cloud Edition (compatible with all systems)
- Community Edition (you need to choose the specific driver)

Example for **Cloud Edition**:
<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-cloud:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependency>
            <groupId>io.flamingock</groupId>
            <artifactId>flamingock-cloud</artifactId>
            <version>${flamingockVersion}</version>
        </dependency>
        ```
    </TabItem>
</Tabs>

Example for **Community Edition** using MongoDB Sync4:
<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-ce-mongodb-sync4:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependency>
            <groupId>io.flamingock</groupId>
            <artifactId>flamingock-ce-mongodb-sync4</artifactId>
            <version>${flamingockVersion}</version>
        </dependency>
        ```
    </TabItem>
</Tabs>

See [Get Started](../get-started) guide for more drivers and other dependencies.

## 2. Configure Flamingock

### 2.1. Builder-based configuration

To begin using Flamingock, you must replace your existing `MongockStandalone.builder()` setup with the `FlamingockStandalone` builder.

:::info
This change is the starting point to transition your setup.
Once you update the entrypoint, Flamingock provides a familiar yet evolved API designed to simplify the migration process. While many method names remain intuitive for existing users, keep in mind that Flamingock introduces enhanced capabilities, so further changes in your setup may still be required. See [Client Configuration](../client-configuration/Overview) section for further info.
:::

### 2.2. File-based configuration

Flamingock expects the configuration file to be located at `resources/flamingock.yaml`. You must move all your config there.

Remove Mongock-specific references in your code. For example: `@EnableMongock`.

:::warning
❗ Remember: Under no circumstances should you modify your existing ChangeUnits from Mongock. Legacy Mongock annotations will remain supported in Flamingock indefinitely, although they are marked as deprecated.
:::

See [Client Configuration](../client-configuration/Overview) section for configuration options.

## 3. Add Stages

- Before in Mongock we had packages to manage changes. Now, changes must be encapsulated within stages, with each stage comprising a package and a corresponding resource directory.
- This means that existing changes previously implemented in Mongock need to be incorporated into a stage.
- New changes can be wrapped in a different stage (with its own package) or together in the same stage with the previous ones.
- This all needs to be defined in a Pipeline yaml file. By default, Flamingock expects the pipeline file to be located at `resources/flamingock/pipeline.yaml`.

```yaml
pipeline:
  stages:
    - name: mongodb-setup
      description: Initial stage for MongoDB setup (Legacy Mongock ChangeUnits)
      sourcesPackage: io.flamingock.examples.mongodb.springboot.springdata.mongodbSetup
    - name: mongodb-migration
      description: Migration to a new MongoDB version (New Flamingock Change)
      sourcesPackage: io.flamingock.examples.mongodb.springboot.springdata.mongodbMigration
```

You can see [Pipeline & Stages](../client-configuration/pipeline-and-stages) for more information about Flamingock Pipeline

## 4. Specify the Location of Legacy ChangeLogs

When migrating from Mongock, you must specify the source where Flamingock should retrieve the legacy ChangeLogs.

:::info
The DataSource name ("mongockChangeLog" in this example) refers to the data source (e.g., the MongoDB collection, DynamoDB table, etc.) where Mongock stored its execution history. Flamingock will use this to import the existing ChangeSet metadata and ensure continuity.
:::

<Tabs groupId="config">
    <TabItem value="file" label="Unified YAML" default>
This is done using the `legacy-mongock-changelog-source` property in the Flamingock configuration.

```yaml
flamingock:
    # ...
    legacy-mongock-changelog-source: mongockChangeLog
    # ...
```

</TabItem>
<TabItem value="builder" label="Builder">
This is done passing the DataSource name to the importer configuration.

```java
FlamingockStandalone
        //...
        .withImporter(CoreConfiguration.ImporterConfiguration.withSource("mongockChangeLog"))
        //...
```

</TabItem>
</Tabs>

## Conclusion

Congratulations! You've successfully migrated from Mongock to Flamingock. For further assistance, refer to the comprehensive Flamingock documentation or reach out to our support team.
