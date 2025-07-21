---
title: Upgrade from Mongock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrade from Mongock to Flamingock

Flamingock is the next evolution of Mongock. **Upgrading** from Mongock to Flamingock involves two main pillars:

1. **Audit-store import** – Flamingock automatically copies Mongock’s _changeLog_ collection/table into its own audit store so historical executions are preserved.
2. **Library swap** – Your application stops calling the Mongock API and starts calling Flamingock. Existing ChangeUnits stay in place; only their annotation imports change.

Because the codebase remains the same and ChangeUnits are kept intact, we call this an _upgrade_, not a migration.

---

## Upgrade steps (at a glance)

1. **Update ChangeUnit imports** – Replace Mongock annotations with Flamingock equivalents.
2. **Upgrade application code** – Replace Mongock API usage with the Flamingock builder(or Spring annotation).
3. **Create system stage** – Add a template-based ChangeUnit that imports legacy audit records.
4. **Configure pipeline** – Point Flamingock to your legacy and new ChangeUnit packages.

That’s it! Once complete, Flamingock runs with your full history intact.


## Step1: Update artefacts

Replace the Mongock artefacts with Flamingock ones.

- Mongock
```groovy
implementation(platform("io.mongock:mongock-bom:5.5.0"))
implementation("io.mongock:mongock-standalone")
implementation("io.mongock:mongodb-sync-v4-driver")
```

- Flamingock
```groovy
implementation(platform("io.flamingock:flamingock-cloud-bom:$flamingockVersion"))
implementation("io.flamingock:flamingock-ce-mongodb-sync")
annotationProcessor("io.flamingock:flamingock-processor:$flamingockVersion")
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

For Spring Boot integration, see the [Spring Boot guide](../frameworks/springboot-integration/introduction.md).

## Step 3: Create system stage

The system stage is a special stage handled by Flamingock for system-level operations. In this upgrade context, you'll create a template-based change unit in the system stage package to handle audit records migration. 

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

Configure Flamingock using the `@EnableFlamingock` annotation. Add this annotation to any class in your application:

```java
@EnableFlamingock(
    stages = {
        @Stage(type = SYSTEM, location = "com.yourapp.flamingock.system"),
        @Stage(type = LEGACY, location = "com.yourapp.mongock"),
        @Stage(location = "com.yourapp.flamingock.changes")
    }
)
public class FlamingockConfig {
    // Configuration class
}
```

### Configuration explained:

**Stage types and usage:**

1. **System stage** - A special stage for framework-level changeUnits handled by Flamingock itself. In this context, it contains the changeUnit(provided by flamingock team) that copies Mongock’s audit data into Flamingock’s store
2. **Legacy stage** - Designed specifically for the changeUnits that originally came from the legacy tool (here, Mongock). Flamingock treats it as read-only: it runs only the units that never executed under Mongock and skips those already recorded in the imported audit history. Do **not** add new ChangeUnits to this stage.
3. **Standard stage** (default): For new Flamingock-native change units. This is where all your new application changes should be added going forward

- For advanced stage configurations and multi-stage scenarios, see the [setup & stages guide](../flamingock-library-config/setup-and-stages)

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

## Why upgrade instead of removing or starting fresh?

- **Preserve your audit trail** – Every historical ChangeUnit and its execution log remains intact for compliance and debugging.
- **Avoid unintended re-runs** – Flamingock imports Mongock’s history, so previously-executed ChangeUnits are never applied twice.
- **Keep change-as-code semantics** – The act of migrating the audit store itself is handled as a versioned change, reinforcing the idea that history is part of your application.
- **Future continuity** – Teams and tools that rely on Mongock’s records can transition seamlessly; dashboards and reports will show an unbroken timeline.



---

Ready to upgrade? See the [pipeline & stages guide](../flamingock-library-config/setup-and-stages.md) and [ChangeUnit reference](../flamingock-library-config/changeunits-deep-dive.md).  

**Complete example project**: https://github.com/mongock/flamingock-examples/tree/master/import-from-mongock
