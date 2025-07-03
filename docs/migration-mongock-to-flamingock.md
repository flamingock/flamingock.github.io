---
title: Upgrade from Mongock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrade from Mongock to Flamingock

This guide walks you through upgrading your existing Mongock-powered project to Flamingock with *zero data loss* and *minimal code changes*, all within the same codebase.

## Upgrade steps

Upgrading involves four straightforward steps:

1. **Adapt change units** – update imports from `io.mongock` → `io.flamingock`
2. **Update application code** – switch Mongock API calls to the Flamingock builder
3. **Create system stage** – add a template-based ChangeUnit to import legacy audit entries
4. **Configure pipeline** – define your `pipeline.yaml` with system, legacy, and new stages

That’s it! Once complete, your project runs on Flamingock and preserves all your existing ChangeUnits and history.

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

### Legacy support

- `@BeforeExecution` and `@RollbackBeforeExecution` from `io.mongock.api` are supported for backward compatibility
- **For migrated change units**: Keep them **exactly as they are** - do not split or modify beyond import changes to maintain immutability
- **For new change units**: Avoid using `@BeforeExecution` and `@RollbackBeforeExecution`. Instead, use dedicated `@Execution` and `@RollbackExecution` methods for better separation of concerns

:::warn
**Keep method bodies and signatures identical**—Flamingock will pick up your existing logic unchanged.
:::
## Step 2: update application code

<Tabs groupId="upgrade">
  <TabItem value="flamingock" label="Flamingock(new)" default>
```java
Flamingock.builder()
    .addDependency(mongoClient)
    .addDependency(mongoClient.getDatabase("test"))
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

## Step 3: Create a system stage to import the history

Add a template-based change unit in the system stage package to import the audit log from Mongock. Create a YAML file (e.g., `_0001_migration_from_mongock.yaml`) with the following structure:

```yaml
id: migration-from-mongock
order: 0001
template: MongoDbImporterChangeTemplate
configuration:
  origin: mongockChangeLog
  failOnEmptyOrigin: true
```

**Configuration parameters:**
- **id**: Choose how you want to identify this change unit
- **order**: Should be the first one (0001) as this is typically the first system stage change unit
- **template**: Must be `MongoDbImporterChangeTemplate`
- **origin**: The collection/table where Mongock's audit log is stored (typically `mongockChangeLog`)
- **failOnEmptyOrigin**: (default true) prevents silent mis-configurations
- 
## Step 4: Configure pipeline

The Flamingock pipeline configuration (`resources/flamingock/pipeline.yaml`) requires two key stages:

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

### Key configuration elements:

1. **System Stage**: Contains the migration change unit that imports Mongock change logs and transforms them to Flamingock audit logs
2. **Legacy Stage**: Contains your migrated change units from Mongock (type: "legacy")
3. **Regular Stages**: For new Flamingock-native change units

## Run and validate

### Running the upgrade

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
