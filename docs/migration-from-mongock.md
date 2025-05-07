---
sidebar_position: 9
---
# Migration: From Mongock to Flamingock

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Welcome to the migration guide for transitioning from Mongock to Flamingock. This document provides a step-by-step process to migrate your existing Mongock setup to Flamingock.

The migration process typically takes approximately 15 minutes, although the exact duration depends on the number of ChangeUnits present in your system.

The migration process will require the following steps:

1. **Replace Mongock with Flamingock dependencies**: Update your current project dependencies by replacing Mongock with the Flamingock client dependencies.
2. **Configure Flamingock**: Set up Flamingock according to the provided configuration guidelines.
3. **ChangeUnit preparation**: Review and prepare your existing ChangeUnits to ensure compatibility with Flamingock.
4. **Add Stages**: Add legacy ChangeUnits to the new Stages Pipeline
5. **Specify the location of legacy change logs**: Specify the directory where your legacy change logs are stored.
6. **Verify the correctness of the migration**: Conduct checks to confirm that the migration has been completed correctly.

## 0. Keep in mind

- It is strongly advised that your Mongock setup is updated to version 5 before initiating the migration.
- Initially, conduct the migration process in a testing environment.

:::danger[❗ Important]
Under no circumstances should you modify the execution logic from your existing ChangeUnits from Mongock. Changing them can lead to undesired re-execution and compromise system integrity.
:::

## 1. Replace Mongock with Flamingock dependencies

Update your build configuration to replace Mongock dependencies with Flamingock Client dependency. You can use either:

- Cloud Edition (compatible with all systems)
- Community Edition (you need to choose the specific storage: MongoDB, DynamoDB, etc.)

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

For more storage packages and other dependencies, check the [Get Started](get-started#1-add-flamingock-client-dependency) guide.

## 2. Configure Flamingock

### 2.1. Builder-based configuration (Standalone)

To begin using Flamingock, you must replace your existing `MongockStandalone.builder()` setup with the `Flamingock.builder()` builder.

This change is the starting point to transition your setup.
Once you update the entrypoint, Flamingock provides a familiar yet evolved API designed to simplify the migration process. While many method names remain intuitive for existing users, keep in mind that Flamingock introduces enhanced capabilities, so further changes in your setup may still be required.

For additional details, please refer to the [Client Configuration](client-configuration/Overview) section.

### 2.2. File-based configuration (Spring Boot or others frameworks)

All Flamingock configuration is expected to be located by default at `resources/flamingock.yaml`. Please ensure all your config is located in the same location.

In your app main class, change the annotation `@EnableMongock` by `@EnableFlamingock`.

For further guidance on configuration options, consult the [Client Configuration](client-configuration/Overview) section.

## 3. ChangeUnit preparation

Flamingock introduces the concepts of workflows. This implies that all change units are required to be wrapped up in a Flamingock Pipeline.

:::danger[❗ Important]
Under no circumstances should you modify the execution logic from your existing ChangeUnits from Mongock. Changing them can lead to undesired re-execution and compromise system integrity. Any new change you need, can be done with a new [Change](get-started#3-define-a-change).
:::

Flamingock introduces the enforcement of having unique id's for ChangeUnits as part of this release. This could introduce a breaking change in your existing code. In order to mitigate any risks, Flamingock supports the following 2 scenarios:

### 3.1. Default (and desired) scenario

If your ChangeUnits have ids that are unique across all authors, Flamingock will do nothing.

Replace the old Mongock package for annotations with the new one in every ChangeUnit imports.

| Annotation           | Mongock Package                                | Flamingock Package                                     |
|----------------------|------------------------------------------------|--------------------------------------------------------|
| `@ChangeUnit`        | `io.mongock.api.annotations.ChangeUnit`        | `io.flamingock.core.api.annotations.ChangeUnit`        |
| `@Execution`         | `io.mongock.api.annotations.Execution`         | `io.flamingock.core.api.annotations.Execution`         |
| `@RollbackExecution` | `io.mongock.api.annotations.RollbackExecution` | `io.flamingock.core.api.annotations.RollbackExecution` |

### 3.2. Second scenario

If your ChangeUnits have duplicated ids for different authors, Flamingock will append the id with the author.

Add the Flamingock Legacy Annotation Processor which lets you use the old Mongock annotation for Legacy ChangeUnits.

<Tabs groupId="gradle_maven">
    <TabItem value="gradle" label="Gradle" default>
        ```kotlin
        annotationProcessor("io.flamingock:flamingock-legacy-processor:$flamingockVersion")
        ```
    </TabItem>
    <TabItem value="maven" label="Maven">
        ```xml
        <build>
        <plugins>
            <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <annotationProcessorPaths>
                <path>
                    <groupId>io.flamingock</groupId>
                    <artifactId>flamingock-legacy-processor</artifactId>
                    <version>${flamingockVersion}</version>
                </path>
                </annotationProcessorPaths>
            </configuration>
            </plugin>
        </plugins>
        </build>
        ```
    </TabItem>
</Tabs>

:::info
Make sure in new ChangeUnits not to use the Mongock's packages instead the Flamingock's ones.
:::

## 4. Add Stages

Before in Mongock we had packages to manage changes. Now, changes must be encapsulated within stages, with each stage comprising a package and a corresponding resource directory.

- This means that existing changes previously implemented in Mongock need to be incorporated into a stage.
- New changes can be wrapped in a different stage (with its own package) or together in the same stage with the previous ones.
- This all needs to be defined in a Pipeline yaml file. By default, Flamingock expects by default the pipeline file to be located at `resources/flamingock/pipeline.yaml`.

```yaml
pipeline:
  stages:
    - name: mongodb-setup
      description: Initial stage for MongoDB setup (Legacy Mongock ChangeUnits example)
      sourcesPackage: io.flamingock.examples.mongodb.springboot.springdata.mongodbSetup
    - name: mongodb-migration
      description: Migration to a new MongoDB version (New Flamingock ChangeUnits example)
      sourcesPackage: io.flamingock.examples.mongodb.springboot.springdata.mongodbMigration
```

For more information about Flamingock pipeline, you can see [Pipeline & Stages](client-configuration/pipeline-and-stages) section.

## 5. Specify the location of legacy change logs

When migrating from Mongock, you must specify the source where Flamingock should retrieve the legacy change logs.

:::info
The DataSource name ("mongockChangeLog" in this example) refers to the data source (e.g., the MongoDB collection, DynamoDB table, etc.) where Mongock stored its execution history. Flamingock will use this to import the existing ChangeSet metadata and ensure continuity.
:::

<Tabs groupId="config">
    <TabItem value="file" label="YAML" default>
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
        Flamingock.builder()
                //...
                .withImporter(CoreConfiguration.ImporterConfiguration.withSource("mongockChangeLog"))
                //...
        ```
    </TabItem>
</Tabs>

## 6. Verify the correctness of the migration

To confirm that the migration was executed correctly, examine the execution log for a message similar to the following:

```text
Stage: mongodb-local-legacy-importer
    1) id: mongock-local-legacy-importer-mongodb 
        [class: io.flamingock.oss.driver.mongodb.internal.mongock.MongockLocalLegacyImporterChangeUnit]
        Execution       ✅ - OK
        Audit execution ✅ - OK
```

Additionally, perform the following checks:

- For Flamingock Community Edition users, inspect your database to determine if legacy change logs are present in the Flamingock table or document.
- For Flamingock Cloud Edition users, review your dashboard to verify the appearance of legacy change logs.

## Conclusion

Congratulations! You've successfully migrated from Mongock to Flamingock. For further assistance, refer to the comprehensive Flamingock documentation or reach out to our support team.
