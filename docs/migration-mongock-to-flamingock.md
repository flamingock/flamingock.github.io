---
title: Migration from Mongock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Migration: from Mongock to Flamingock

This guide walks you through migrating an existing Mongock project to Flamingock with minimal changes and complete audit-history preservation.

## Migration steps

Migrating from Mongock to Flamingock involves four straightforward steps:

1. **Adapt change units** – Update Mongock imports to Flamingock equivalents.  
2. **Update application code** – Replace Mongock API usage with the Flamingock builder.  
3. **Create system stage** – Add a template-based ChangeUnit to import legacy audit logs.  
4. **Configure pipeline** – Define `pipeline.yaml` with system, legacy, and new stages.  

That’s it! Once complete, your project runs with Flamingock, preserving all existing change units and history.

## Original Mongock dependencies

In your `build.gradle`:

```groovy
implementation(platform("io.mongock:mongock-bom:5.5.0"))
implementation("io.mongock:mongock-standalone")
implementation("io.mongock:mongodb-sync-v4-driver")
```

## Step 1: adapt change units

Update these imports in each ChangeUnit:

| Mongock import                                 | Flamingock import                                 |
|------------------------------------------------|---------------------------------------------------|
| `io.mongock.api.annotations.ChangeUnit`        | `io.flamingock.api.annotations.ChangeUnit`        |
| `io.mongock.api.annotations.Execution`         | `io.flamingock.api.annotations.Execution`         |
| `io.mongock.api.annotations.RollbackExecution` | `io.flamingock.api.annotations.RollbackExecution` |

Legacy annotations (`@BeforeExecution`, `@RollbackBeforeExecution`) remain supported—keep them as-is for backward compatibility.

## Step 2: update application code

**Before (Mongock):**


<Tabs groupId="migration">
  <TabItem value="flamingock" label="Flamingock(new)" default>
```java
Flamingock.builder()
    .addDependency(mongoClient)
    .addDependency(mongoClient.getDatabase("test"))
    .setProperty("mongodb.databaseName", "test")
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


Key changes:
- Replace `MongockStandalone` with `Flamingock.builder()`
- Remove explicit driver setup (Flamingock auto-configures it)
- Remove package scanning in favor of pipeline config
- Inject dependencies via `.addDependency()`

For Spring Boot integration, see the [Spring Boot guide](springboot-integration/introduction).

## Step 3: create system stage

Under `src/main/resources/flamingock/pipeline.yaml` add:

```yaml
pipeline:
  systemStage:
    sourcesPackage: "io.flamingock.examples.importer.flamingock.system"
  stages:
    - name: "Legacy changes from Mongock"
      type: "legacy"
      sourcesPackage: "io.flamingock.examples.importer.flamingock.legacy"
    - name: "New MongoDB changes"
      description: "Changes to MongoDB"
      sourcesPackage: "io.flamingock.examples.importer.flamingock.mongodb"
```

Then in the `system` package, create `_0001_migration_from_mongock.yaml`:

```yaml
id: migration-from-mongock
order: 0001
template: MongoDbImporterChangeTemplate
configuration:
  origin: mongockChangeLog
```

## Configure your pipeline

Ensure your `pipeline.yaml` matches the example above. Flamingock will:
1. Run the system-stage importer  
2. Execute your migrated legacy ChangeUnits  
3. Apply any new ChangeUnits in subsequent stages  

## Run and validate

### Running the migration

```shell
./gradlew run
```

### Expected output

After running Flamingock, you should see output similar to:
```
Stage: flamingock-system-stage
	0001) id: migration-from-mongock 
		Started				✅ - OK
		Executed			✅ - OK
		Audited[execution]	        ✅ - OK
	
Stage: New MongoDB changes
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

- ✅ System stage executes the migration changeUnit successfully
- ✅ Already-applied legacy changeUnits from Mongock are not reapplied
- ✅ Previously unapplied legacy changeUnits from Mongock execute without errors
- ✅ New Flamingock changeUnits execute as expected
- ✅ All audit logs are properly created in Flamingock format
- ✅ Database changes match the expected results

---

## Why migrate rather than remove?

- **Complete audit history**: Retains all original ChangeUnits and logs.  
- **Risk mitigation**: Prevents accidental re-application of pending Mongock changes.  
- **Philosophy**: Treats migrations as code and history as part of your application.  

---

Ready to migrate? See the [pipeline & stages guide](client-configuration/pipeline-and-stages) and [ChangeUnit reference](change-units).  
Example project: https://github.com/mongock/flamingock-examples/tree/master/import-from-mongock
