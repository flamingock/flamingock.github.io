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

- Ensure your Mongock setup is updated to version 5 before initiating the migration.
- It is strongly advised to create a backup of your data prior to migration.
- Conduct the migration process within a testing environment.
- Under no circumstances should you alter your existing ChangeUnits. If they were originally Mongock ChangeUnits, they must remain unchanged.

:::

## 1. Standalone Migration

### 1.1. Replace Mongock Dependencies with Flamingock Dependencies

Update your build configuration to replace Mongock dependencies with Flamingock dependencies.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        <Tabs groupId="compilers">
            <TabItem value="gradle" label="Gradle" default>
                ```kotlin
                implementation("io.flamingock:flamingock-core:$flamingockVersion")
                ```
            </TabItem>
            <TabItem value="maven" label="Maven">
                ```xml
                <dependencies>
                    <dependency>
                        <groupId>io.flamingock</groupId>
                        <artifactId>flamingock-core</artifactId>
                        <version>${flamingock.latestVersion}</version>
                    </dependency>
                </dependencies>
                ```
            </TabItem>
        </Tabs>
    </TabItem>
    <TabItem value="community" label="Community Edition">
        <Tabs groupId="compilers">
            <TabItem value="gradle" label="Gradle" default>
                ```kotlin
                implementation("io.flamingock:flamingock-core:$flamingockVersion")
                implementation("io.flamingock:dynamodb-driver:$flamingockVersion")
                ```
            </TabItem>
            <TabItem value="maven" label="Maven">
                ```xml
                <dependencies>
                    <dependency>
                        <groupId>io.flamingock</groupId>
                        <artifactId>flamingock-core</artifactId>
                        <version>${flamingock.latestVersion}</version>
                    </dependency>
                    <dependency>
                        <groupId>io.flamingock</groupId>
                        <artifactId>dynamodb-driver</artifactId>
                        <version>${flamingock.latestVersion}</version>
                    </dependency>
                </dependencies>
                ```
            </TabItem>
        </Tabs>
    </TabItem>
</Tabs>

### 1.2. Update Code References

Change your `MongockStandalone.builder()` with the `FlamingockStandalone.local()` or `FlamingockStandalone.cloud()` builders. See Standalone Runner documentation for options and parameters.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```java
        FlamingockStandalone.cloud()
                .setApiToken(API_TOKEN)
                .setEnvironment(ENVIRONMENT_NAME)
                .setService(SERVICE_NAME)
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock"))
                .addDependency(client)
                .build()
                .run();
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```java
        FlamingockStandalone.local()
                .setDriver(new DynamoDBDriver(client))
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock"))
                .addDependency(client)
                .build()
                .run();
        ```
    </TabItem>
</Tabs>

### 1.3. Add a New Package (Optional)

If you want to organize new changeUnits separately, add a new package for them. Both legacy Mongock changeUnits and Flamingock changeUnits can coexist in the same package.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```java
        FlamingockStandalone.cloud()
                .setApiToken(API_TOKEN)
                .setEnvironment(ENVIRONMENT_NAME)
                .setService(SERVICE_NAME)
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock")
                        // New Flamingock changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.changes"))
                .addDependency(client)
                .build()
                .run();
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```java
        FlamingockStandalone.local()
                .setDriver(new DynamoDBDriver(client))
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock")
                        // New Flamingock changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.changes"))
                .addDependency(client)
                .build()
                .run();
        ```
    </TabItem>
</Tabs>

### 1.4. Specify the Location of previous ChangeLogs for the Importer

Specify where the legacy Mongock changeLogs are located using the importer. `"mongockChangeLog"` is where Flamingock will retrieve the legacy changeLogs to migrate them into the new structure.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```java
        FlamingockStandalone.cloud()
                .setApiToken(API_TOKEN)
                .setEnvironment(ENVIRONMENT_NAME)
                .setService(SERVICE_NAME)
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock")
                        // New Flamingock changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.changes"))
                .addDependency(client)
                // Importer with where legacy changeLogs are located
                .withImporter(CoreConfiguration.ImporterConfiguration.withSource("mongockChangeLog"))
                .build()
                .run();
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```java
        FlamingockStandalone.local()
                .setDriver(new DynamoDBDriver(client))
                .addStage(new Stage("stage-name")
                        // Your existing changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.mongock")
                        // New Flamingock changeUnits
                        .addCodePackage("io.flamingock.examples.dynamodb.standalone.changes"))
                .addDependency(client)
                // Importer with where legacy changeLogs are located
                .withImporter(CoreConfiguration.ImporterConfiguration.withSource("mongockChangeLog"))
                .build()
                .run();
        ```
    </TabItem>
</Tabs>

## 2. Spring Boot Migration

### 2.1. Replace Mongock Dependencies with Flamingock Dependencies

Update your build configuration to replace Mongock dependencies with Flamingock dependencies.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
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
    </TabItem>
    <TabItem value="community" label="Community Edition">
        <Tabs groupId="compilers">
            <TabItem value="gradle" label="Gradle" default>
                ```kotlin
                implementation("io.flamingock:flamingock-springboot-v2-runner:$flamingockLatestVersion")
                implementation("io.flamingock:mongodb-springdata-v3-driver:$flamingockLatestVersion")
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
                    <dependency>
                        <groupId>io.flamingock</groupId>
                        <artifactId>mongodb-springdata-v3-driver</artifactId>
                        <version>${flamingock.latestVersion}</version>
                    </dependency>
                </dependencies>
                ```
            </TabItem>
        </Tabs>
    </TabItem>
</Tabs>

### 2.2. Update Code References

Replace Mongock-specific references in your code with Flamingock equivalents.

For example: `io.mongock.runner.springboot.EnableMongock` with `io.flamingock.springboot.v2.context.EnableFlamingock.`

:::note
Legacy Mongock annotations will remain supported in Flamingock indefinitely, although they are marked as deprecated.
:::

### 2.3. Update Configuration File

Update your application's configuration file to match Flamingock's structure.

#### Legacy Mongock Configuration

```yaml
mongock:
  migration-scan-package:
    - io.flamingock.examples.mongodb.springboot.springdata.mongock
  transactional: true
```

#### Flamingock Equivalent Configuration

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```yaml
        flamingock:
            api-token: API_TOKEN
            environment: ENVIRONMENT_NAME
            service: SERVICE_NAME
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
            transactionDisabled: false
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```yaml
        flamingock:
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
            transactionDisabled: false
        ```
    </TabItem>
</Tabs>

### 2.4. Add a New Package (Optional)

If you want to organize new changeUnits separately, add a new package for them. Both legacy Mongock changeUnits and Flamingock changeUnits can coexist in the same package.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```yaml
        flamingock:
            api-token: API_TOKEN
            environment: ENVIRONMENT_NAME
            service: SERVICE_NAME
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
                    # New Flamingock changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.changes
            transactionDisabled: false
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```yaml
        flamingock:
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
                    # New Flamingock changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.changes
            transactionDisabled: false
        ```
    </TabItem>
</Tabs>

### 2.5. Specify the Location of Legacy ChangeLogs

Specify where the legacy Mongock changeLogs are located using the property `legacy-mongock-changelog-source`. This is where Flamingock will retrieve the legacy changeLogs to migrate them into the new structure.

<Tabs groupId="flavors">
    <TabItem value="cloud" label="Cloud Edition" default>
        ```yaml
        flamingock:
            api-token: API_TOKEN
            environment: ENVIRONMENT_NAME
            service: SERVICE_NAME
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
                    # New Flamingock changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.changes
            transactionDisabled: false
            # Where legacy changeLogs are located
            legacy-mongock-changelog-source: mongockChangeLog
        ```
    </TabItem>
    <TabItem value="community" label="Community Edition" default>
        ```yaml
        flamingock:
            stages:
                - name: mongodb-migration
                code-packages:
                    # Your existing changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.mongock
                    # New Flamingock changeUnits
                    - io.flamingock.examples.mongodb.springboot.springdata.changes
            transactionDisabled: false
            # Where legacy changeLogs are located
            legacy-mongock-changelog-source: mongockChangeLog
        ```
    </TabItem>
</Tabs>

## Conclusion

Congratulations! You've successfully migrated from Mongock to Flamingock. For further assistance, refer to the comprehensive Flamingock documentation or reach out to our support team.
