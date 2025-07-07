---
title: Upgrade from Mongock to Flamingock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrade from Mongock to Flamingock

This guide walks you through upgrading your existing Mongock project to Flamingock with minimal changes and complete audit-history preservation.

## Upgrade steps

Upgrading from Mongock to Flamingock involves four straightforward steps:

1. **Update ChangeUnit imports** – Replace Mongock package imports with Flamingock equivalents in your existing ChangeUnits.  
2. **Upgrade application code** – Replace Mongock API usage with the Flamingock builder.  
3. **Create system stage** – Add a template-based ChangeUnit to import existing audit logs.  
4. **Configure pipeline** – Define pipeline configuration pointing to your existing ChangeUnit packages.  

That’s it! Once complete, your project runs with Flamingock, preserving all existing change units and history.

## Original Mongock dependencies

In your `build.gradle`:

```groovy
implementation(platform("io.mongock:mongock-bom:5.5.0"))
implementation("io.mongock:mongock-standalone")
implementation("io.mongock:mongodb-sync-v4-driver")
```

## Step 1: Update ChangeUnit imports

Update these imports in your existing ChangeUnits (keep them in their current packages):

| Mongock import                                 | Flamingock import                                 |
|------------------------------------------------|---------------------------------------------------|
| `io.mongock.api.annotations.ChangeUnit`        | `io.flamingock.api.annotations.ChangeUnit`        |
| `io.mongock.api.annotations.Execution`         | `io.flamingock.api.annotations.Execution`         |
| `io.mongock.api.annotations.RollbackExecution` | `io.flamingock.api.annotations.RollbackExecution` |

:::info Legacy Support
- **For existing change units**: Keep them **exactly as they are** in their current packages - only update imports to maintain immutability.
- **For new change units**: Avoid using `@BeforeExecution` and `@RollbackBeforeExecution`. Instead, use dedicated `@Execution` and `@RollbackExecution` methods for better separation of concerns
- `@BeforeExecution` and `@RollbackBeforeExecution` from `io.mongock.api` are supported for backward compatibility
:::
## Step 2: Upgrade application code

<Tabs groupId="upgrade">
  <TabItem value="flamingock" label="Flamingock(new)" default>
```java
Flamingock.builder()
    .addDependency(mongoClient)
    .addDependency(mongoDatabase)
    .build()
    .run();
```
  </TabItem>
  <TabItem value="mongock" label="Mongock(legacy)">
```java
MongockStandalone.builder()
    .setDriver(MongoSync4Driver.withDefaultLock(mongoClient, "test"))
    .addMigrationScanPackage("legacy.mongock.changes")
    .buildRunner()
    .execute();
```
  </TabItem>
</Tabs>


### Key changes:
- Replace `MongockStandalone` with `Flamingock.builder()`
- Remove explicit driver setup (Flamingock auto-configures it)
- Remove package scanning in favor of pipeline config
- Inject dependencies via `.addDependency()`

For Spring Boot integration, see the [Spring Boot guide](springboot-integration/introduction).

## Step 3: Create system stage

The system stage is a special stage handled by Flamingock for system-level operations. In this migration context, you'll create a template-based change unit in the system stage package to handle the upgrade from Mongock. 

Create a YAML file (e.g., `_0001_upgrade_from_mongock.yaml`) with the following structure:

```yaml
id: upgrade-from-mongock
order: 0001
template: MongoDbImporterChangeTemplate
configuration:
  origin: mongockChangeLog
  failOnEmptyOrigin: true
```

**Configuration parameters:**
- **id**: Choose how you want to identify this change unit
- **order**: Should be the first one (0001) as this is typically the first system stage change unit
- **template**: Available templates: `MongoDbImporterChangeTemplate`, `DynamoDbImporterChangeTemplate`, `CouchbaseImporterChangeTemplate`
- **origin**: The collection/table where Mongock's audit log is stored (typically `mongockChangeLog`)
- **failOnEmptyOrigin**: (Optional) Set to `false` to disable the security check that ensures the origin contains data. By default, Flamingock verifies the origin collection/table has content to prevent importing from the wrong source

## Step 4: Configure setup

Configure Flamingock using the `@Flamingock` annotation. Add this annotation to any class in your application:

```java
@Flamingock(
    systemStage = @SystemStage(sourcesPackage = "com.yourapp.flamingock.system"),
    stages = {
        @Stage(name = "Existing changes from Mongock", type = StageType.LEGACY, sourcesPackage = "com.yourapp.mongock"),
        @Stage(name = "Application Changes", sourcesPackage = "com.yourapp.flamingock.changes")
    }
)
public class FlamingockConfig {
    // Configuration class
}
```

### Configuration explained:

**Stage types and usage:**

1. **System Stage**: A generic stage for system-level change units handled by Flamingock itself. In this migration context, it contains the upgrade change unit that imports Mongock change logs and transforms them to Flamingock audit logs

2. **Legacy Stage**: Points to your existing change units from Mongock (type: "legacy") - no need to move or copy files. This stage is read-only and should not receive new changeUnits

3. **User Stage**: For new Flamingock-native change units. Typically, applications use a single user stage where all new changes should be added

**Important notes:**
- **System and Legacy stages** are special stages handled by Flamingock itself
- **User stages** are where you add your application changes. In most cases, you'll have just one user stage for all your new changeUnits
- For advanced stage configurations and multi-stage scenarios, see the [setup & stages guide](client-configuration/pipeline-and-stages)

## Run and validate

### Running the upgrade

```shell
./gradlew run
```

### Expected output

After running Flamingock, you should see output similar to:
```
Stage: flamingock-system-stage
	0001) id: upgrade-from-mongock 
		Started				✅ - OK
		Executed			✅ - OK
		Audited[execution]	        ✅ - OK
	
Stage: Application Changes
	0001) id: create-users-collection-with-index 
		Started				✅ - OK
		Executed			✅ - OK
		Audited[execution]	        ✅ - OK
	0002) id: seed-users 
		Started				✅ - OK
		Executed			✅ - OK
		Audited[execution]	        ✅ - OK
```

### Validation checklist

- ✅ System stage executes the upgrade changeUnit successfully
- ✅ Already-applied existing changeUnits from Mongock are not reapplied
- ✅ Previously unapplied existing changeUnits from Mongock execute without errors
- ✅ New Flamingock changeUnits execute as expected
- ✅ All audit logs are properly created in Flamingock format
- ✅ Database changes match the expected results

---

## Why upgrade rather than remove?

- **Complete audit history**: Retains all original ChangeUnits and logs.  
- **Risk mitigation**: Prevents accidental re-application of pending Mongock changes.  
- **Philosophy**: Treats migrations as code and history as part of your application.  

---

Ready to upgrade? See the [pipeline & stages guide](client-configuration/pipeline-and-stages) and [ChangeUnit reference](change-units).  

**Complete example project**: https://github.com/mongock/flamingock-examples/tree/master/import-from-mongock
