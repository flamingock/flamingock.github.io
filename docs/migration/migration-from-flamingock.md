---
sidebar_position: 2
---
# From Community Edition to Cloud Edition

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning
Flamingock Cloud Edition is not released yet.
:::

Welcome to the migration guide for transitioning from Flamingock Community Edition (OpenSource) to Flamingock Cloud Edition. This document provides a step-by-step process to migrate your existing Flamingock setup to Flamingock Cloud Edition, covering both Standalone and Spring Boot integration methods.

## Migration Paths

Flamingock offers two migration paths:

- [Standalone Migration](#1-standalone-migration): Manual setup within your application.
- [Spring Boot Integration](#2-spring-boot-migration): Configure using a YAML file.

:::warning

- It is strongly advised to create a backup of your data prior to migration.
- Conduct the migration process within a testing environment.
- Under no circumstances should you alter your existing ChangeUnits. If they were originally Mongock ChangeUnits, they must remain unchanged.

:::

## 1. Standalone Migration

### 1.1. Remove unnecessary dependencies

Update your build configuration to remove Flamingock Community Edition dependencies like drivers, for example `io.flamingock:dynamodb-driver`.

### 1.2. Update Code References

Change your `FlamingockStandalone.local()` with the `FlamingockStandalone.cloud()` builder. See Standalone Runner documentation for options and parameters.

#### Community Edition

```java
FlamingockStandalone.local()
        .setDriver(new DynamoDBDriver(client))
        .addStage(new Stage("stage-name")
                // Your existing changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change1"))
        .addDependency(client)
        .build()
        .run();
```

#### Cloud Edition

```java
FlamingockStandalone.cloud()
        .setApiToken(API_TOKEN)
        .setEnvironment(ENVIRONMENT_NAME)
        .setService(SERVICE_NAME)
        .addStage(new Stage("stage-name")
                // Your existing changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change1"))
        .addDependency(client)
        .build()
        .run();
```

### 1.3. Add a New Package (Optional)

If you want to organize new changeUnits separately, add a new package for them. Both legacy Mongock changeUnits and Flamingock changeUnits can coexist in the same package.

```java
FlamingockStandalone.cloud()
        .setApiToken(API_TOKEN)
        .setEnvironment(ENVIRONMENT_NAME)
        .setService(SERVICE_NAME)
        .addStage(new Stage("stage-name")
                // Your existing changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change1")
                // New Flamingock changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change2"))
        .addDependency(client)
        .build()
        .run();
```

### 1.4. Specify the Location of previous ChangeLogs for the Importer

Specify where the legacy Mongock changeLogs are located using the importer. `"flamingockChangeLog"` is where Flamingock will retrieve the legacy changeLogs to migrate them into the new structure.

```java
FlamingockStandalone.cloud()
        .setApiToken(API_TOKEN)
        .setEnvironment(ENVIRONMENT_NAME)
        .setService(SERVICE_NAME)
        .addStage(new Stage("stage-name")
                // Your existing changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change1")
                // New Flamingock changeUnits
                .addCodePackage("io.flamingock.examples.dynamodb.standalone.change2"))
        .addDependency(client)
        // Importer with where legacy changeLogs are located
        .withImporter(CoreConfiguration.ImporterConfiguration.withSource("flamingockChangeLog"))
        .build()
        .run();
```

## 2. Spring Boot Migration

### 2.1. Remove unnecessary dependencies

Update your build configuration to remove Flamingock Community Edition dependencies like drivers, for example `io.flamingock:mongodb-springdata-v3-driver`.

### 2.2. Update Configuration File

Update your application's configuration file to match Flamingock Cloud Edition structure.

#### Community Edition Configuration

```yaml
flamingock:
    stages:
        - name: mongodb-migration
        code-packages:
            # Your existing changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change1
    transactionDisabled: false
```

#### Flamingock Equivalent Configuration

```yaml
flamingock:
    api-token: API_TOKEN
    environment: ENVIRONMENT_NAME
    service: SERVICE_NAME
    stages:
        - name: mongodb-migration
        code-packages:
            # Your existing changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change1
    transactionDisabled: false
```

### 2.3. Add a New Package (Optional)

If you want to organize new changeUnits separately, add a new package for them. Both legacy Mongock changeUnits and Flamingock changeUnits can coexist in the same package.

```yaml
flamingock:
    api-token: API_TOKEN
    environment: ENVIRONMENT_NAME
    service: SERVICE_NAME
    stages:
        - name: mongodb-migration
        code-packages:
            # Your existing changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change1
            # New Flamingock changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change2
    transactionDisabled: false
```

### 2.4. Specify the Location of Legacy ChangeLogs

Specify where the legacy Mongock changeLogs are located using the property `legacy-mongock-changelog-source`. This is where Flamingock will retrieve the legacy changeLogs to migrate them into the new structure.

```yaml
flamingock:
    api-token: API_TOKEN
    environment: ENVIRONMENT_NAME
    service: SERVICE_NAME
    stages:
        - name: mongodb-migration
        code-packages:
            # Your existing changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change1
            # New Flamingock changeUnits
            - io.flamingock.examples.mongodb.springboot.springdata.change2
    transactionDisabled: false
    # Where legacy changeLogs are located
    legacy-mongock-changelog-source: flamingockChangeLog
```

## Conclusion

Congratulations! You've successfully migrated from Mongock to Flamingock. For further assistance, refer to the comprehensive Flamingock documentation or reach out to our support team.
