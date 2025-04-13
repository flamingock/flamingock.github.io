---
sidebar_position: 1
---
# From Mongock to Flamingock

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Welcome to the migration guide for transitioning from Mongock to Flamingock. This document provides a step-by-step process to migrate your existing Mongock setup to Flamingock, covering both Standalone and Spring Boot integration methods.

## Migration Paths

Flamingock offers two migration paths:

- [Standalone Migration](#1-standalone-migration): Manual setup within your application.
- [Spring Boot Integration](#2-spring-boot-migration): Configure using a YAML file.

:::warning

- It is strongly advised that your Mongock setup is updated to version 5 before initiating the migration.
- Conduct the migration process within a testing environment.
- ❗ Important: Under no circumstances should you modify your existing ChangeUnits from Mongock. They must remain intact—especially their annotations and execution logic. Changing them can lead to undesired re-execution and compromise system integrity.

:::

## 1. Standalone Migration

:::note
This section will be exampled with a DynamoDB example
:::

### 1.1. Replace Mongock Dependencies with Flamingock Dependencies

Update your build configuration to replace Mongock dependencies with Flamingock dependencies.

<Tabs groupId="compilers">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-core:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependencies>
            [...]
            <dependency>
                <groupId>io.flamingock</groupId>
                <artifactId>flamingock-core</artifactId>
                <version>${flamingock.latestVersion}</version>
            </dependency>
        </dependencies>
        ```
    </TabItem>
</Tabs>

### 1.2. Add Flamingock Driver Dependencies (required only in Community Edition)

<Tabs groupId="compilers">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:dynamodb-driver:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependencies>
            [...]
            <dependency>
                <groupId>io.flamingock</groupId>
                <artifactId>dynamodb-driver</artifactId>
                <version>${flamingock.latestVersion}</version>
            </dependency>
        </dependencies>
        ```
    </TabItem>
</Tabs>

### 1.3. Update Code References

To begin using Flamingock, you must replace your existing `MongockStandalone.builder()` setup with either:

- `FlamingockStandalone.local()` — for Community Edition usage
- `FlamingockStandalone.cloud()` — for Cloud Edition usage

This change is the starting point to transition your setup.
Once you update the entrypoint, Flamingock provides a familiar yet evolved API designed to simplify the migration process. While many method names remain intuitive for existing users, keep in mind that Flamingock introduces enhanced capabilities, so further changes in your setup may still be required. See [Flamingock Core Concepts](../core-concepts) for further info.

### 1.4. Add Stages

- Before in Mongock we had packages to manage changes. Now, changes must be encapsulated within stages, with each stage comprising a package and a corresponding resource directory.
- This means that existing changes previously implemented in Mongock need to be incorporated into a stage.
- New changes can be wrapped in a different stage (with its own package) or together in the same stage with the previous ones.

```java
FlamingockStandalone
        //...
        .addStage(
            new Stage("dynamodb-migration")
                // Your existing changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.legacyChanges")
                // New Flamingock changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.newChanges")
        )
        //...
        .build()
        .run();
```

### 1.5. Specify the Location of previous ChangeLogs for the Importer

When migrating from Mongock, you must specify the source where Flamingock should retrieve the legacy ChangeLogs. This is done passing data source name to the importer configuration.

:::info
This data source name refers to the data source (e.g., the MongoDB collection, DynamoDB table, etc.) where Mongock stored its execution history. Flamingock will use this to import the existing ChangeSet metadata and ensure continuity.
:::

```java
FlamingockStandalone
        //...
        // Importer with where legacy changeLogs are located
        .withImporter(CoreConfiguration.ImporterConfiguration.withSource("mongockChangeLog"))
        //...
        .build()
        .run();
```

## 2. Spring Boot Migration

:::note
This section will be exampled with a MongoDB example
:::

### 2.1. Replace Mongock Dependencies with Flamingock Dependencies

Update your build configuration to replace Mongock dependencies with Flamingock dependencies.

<Tabs groupId="compilers">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:flamingock-springboot-v2-runner:$flamingockLatestVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependencies>
            <dependency>
                <groupId>io.flamingock</groupId>
                <artifactId>flamingock-springboot-v2-runner</artifactId>
                <version>${flamingock.latestVersion}</version>
            </dependency>
        </dependencies>
        ```
    </TabItem>
</Tabs>

### 2.2. Add Flamingock Driver Dependencies (required only in Community Edition)

<Tabs groupId="compilers">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        implementation("io.flamingock:mongodb-springdata-v3-driver:$flamingockLatestVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <dependencies>
            [...]
            <dependency>
                <groupId>io.flamingock</groupId>
                <artifactId>mongodb-springdata-v3-driver</artifactId>
                <version>${flamingock.latestVersion}</version>
            </dependency>
        </dependencies>
        ```
    </TabItem>
</Tabs>

### 2.3. Update Code References

Replace Mongock-specific references in your code with Flamingock equivalents.

For example: `io.mongock.runner.springboot.EnableMongock` with `io.flamingock.springboot.v2.context.EnableFlamingock.`

:::note
Legacy Mongock annotations will remain supported in Flamingock indefinitely, although they are marked as deprecated.
:::

### 2.4. Update Configuration File

To begin using Flamingock, you must replace your existing Mongock configuration with the Flamingock one:

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```yaml
        flamingock:
            api-token: API_TOKEN
            environment: ENVIRONMENT_NAME
            service: SERVICE_NAME
            # ...
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```yaml
        flamingock:
            # ...
        ```
    </TabItem>
</Tabs>

This change is the starting point to transition your setup.
Once you update the entrypoint, Flamingock provides a familiar yet evolved configuration structure designed to simplify the migration process. While many property names remain intuitive for existing users, keep in mind that Flamingock introduces enhanced capabilities, so further changes in your setup may still be required. See [Flamingock Core Concepts](../core-concepts) for further info.

### 2.5. Add Stages

- Before in Mongock we had packages to manage changes. Now, changes must be encapsulated within stages, with each stage comprising a package and a corresponding resource directory.
- This means that existing changes previously implemented in Mongock need to be incorporated into a stage.
- New changes can be wrapped in a different stage (with its own package) or together in the same stage with the previous ones.

```yaml
flamingock:
    # ...
    stages:
        - name: mongodb-migration
        code-packages:
            # Your existing changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.legacyChanges
            # New Flamingock changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.newChanges
    # ...
```

### 2.6. Specify the Location of Legacy ChangeLogs

When migrating from Mongock, you must specify the source where Flamingock should retrieve the legacy ChangeLogs. This is done using the mongockChangeLog property in the Importer configuration.

:::info
This property refers to the data source (e.g., the MongoDB collection, DynamoDB table, etc.) where Mongock stored its execution history. Flamingock will use this to import the existing ChangeSet metadata and ensure continuity.
:::

```yaml
flamingock:
    # ...
    # Where legacy changeLogs are located
    legacy-mongock-changelog-source: mongockChangeLog
    # ...
```

## Conclusion

Congratulations! You've successfully migrated from Mongock to Flamingock. For further assistance, refer to the comprehensive Flamingock documentation or reach out to our support team.
