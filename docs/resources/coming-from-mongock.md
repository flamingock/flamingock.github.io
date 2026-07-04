---
title: Coming from Mongock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import VersionBadge from '@site/src/components/VersionBadge';

# Coming from Mongock

Flamingock provides first-class support for teams migrating from **Mongock**.  
If your application was previously using Mongock, Flamingock allows you to transition **quickly, safely, and with minimal effort** — without rewriting any legacy migration code.

In most cases, the migration consists of only adding **one dependency and one annotation**, and Flamingock takes care of everything else.

This feature is designed to:

- **Import your existing Mongock audit log**  
- **Recognize which Mongock change units were already applied**  
- **Execute only the ones that were still pending**  
- **Let you continue using Flamingock natively for all new changes**  

:::info
Flamingock does **not** support authoring new Mongock changes (`@ChangeUnit`, `@ChangeLog`, `@ChangeSet`) going forward.  
This integration exists purely to make the migration **fast, simple and safe**. All new changes must be written as Flamingock-native `@Change` classes.
:::

## Supported Mongock versions

Flamingock's Mongock support covers both major Mongock generations:

- **Mongock v4** — legacy model based on `@ChangeLog` + `@ChangeSet`
- **Mongock v5** — `@ChangeUnit` model with `@Execution` and `@RollbackExecution`

In both cases, existing change classes are treated as immutable historical artifacts. The migration path is the same: keep legacy code untouched, import Mongock audit history, execute any pending legacy changes, and author all new work as Flamingock-native `@Change` classes.

MongoDB is the most common starting backend, but the migration model also applies to other Mongock-supported backends such as DynamoDB and Couchbase.

:::caution One-time clean build on upgrade
When migrating from Mongock to Flamingock **1.3.0** or later, run a clean build once after adding the Flamingock dependencies:

- Gradle: `./gradlew clean build`
- Maven: `mvn clean install`

This regenerates Flamingock's per-module metadata in the new incremental format. Without a clean build, the build system may skip recompiling already-compiled change classes, and the resulting metadata file will omit them — potentially causing changes to be missing at runtime. Subsequent builds are incremental as normal.
:::

## Migrate with an agentic coder

Flamingock ships a dedicated **Mongock migration skill** that lets an agentic coder perform this migration for you — increasing velocity and reducing manual errors.

Once the skill is installed in your project (see [Using Flamingock with agentic coders](./agentic-coders)), trigger the migration with a prompt such as:

> migrate from Mongock to Flamingock [VERSION]

You should see a line in the agent's output confirming the skill is in use, similar to:

```
Using flamingock-mongock-migration-skill…
```

The skill performs the same steps described manually below.

:::note
Skills are in beta.
:::

## Quick start for Mongock users

Migrating from Mongock is intentionally simple, it only requires two additional steps on top of the [standard Flamingock setup](../get-started/quick-start).

### 1. Add Mongock support dependency

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>

```kotlin
plugins {
    id("io.flamingock") version "[VERSION]"
}

flamingock {
    community()
    mongock()  // Adds Mongock migration support
}
```

  </TabItem>
  <TabItem value="maven" label="Maven">

```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>mongock-support</artifactId>
    <version>${flamingock.version}</version>
</dependency>

<!-- Annotation processor -->
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
                        <artifactId>mongock-support</artifactId>
                        <version>${flamingock.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

  </TabItem>
</Tabs>


### 2. Add `@MongockSupport`

Place the annotation in any configuration class (typically your application class):

```java
@MongockSupport(targetSystem = "mongodb-target-system")
public class Application { }
```
:::info
The **`targetSystem` field** refers to the **ID of a target system that you register in Flamingock** as part of your normal application setup.  
If you are not familiar with how target systems are registered, see [Configuring Target Systems](../target-systems/introduction).
:::
The target system you register must point to the same database that Mongock previously used.

Flamingock will use this target system to:

- import Mongock’s audit log,  
- execute any Mongock change units that were not yet applied, and  
- continue applying any new Flamingock changes that target this system.

A full explanation of why this is required (and how Mongock’s model differs from Flamingock’s) is provided in the section [Understanding the target system for Mongock migrations](#understanding-the-target-system-for-mongock-migrations) below.

**That’s all you need to activate Mongock support.** From there, Flamingock handles the detection of legacy changes, audit import, and stage ordering automatically.

### Optional configuration <VersionBadge version="1.1.0" />

The `@MongockSupport` annotation includes optional fields you can use to configure how Flamingock reads Mongock’s audit log. All fields accept **literal values** or **property placeholders**.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `skipImport` <br/> <VersionBadge version="1.2.0" /> | `String` | "" | Determines whether Mongock audit import is skipped. Supports literal values and placeholders. Allowed values are `true`, `false`, or empty. When empty (default), it is treated as `false` (import enabled). When `true`, import is skipped. |
| `origin` | `String` | "" | The Mongock audit origin to read from. Supports literal values and placeholders. When empty (default), Flamingock uses Mongock’s default origin value. **Only applies when `skipImport` is `false`.** |
| `emptyOriginAllowed` | `String` | "" | Whether Flamingock should allow an empty origin during import. Supports literal values and placeholders. Allowed values are `true`, `false`, or empty. When empty (default), it is treated as `false`, and Flamingock will fail if the origin is empty. **Only applies when `skipImport` is `false`.** |
| `ignoreUnknownEntries` <br/> <VersionBadge version="1.4.0" /> | `String` | "" | Whether Flamingock should ignore Mongock audit entries that do not match any change in the current Flamingock pipeline. Supports literal values and placeholders. Allowed values are `true`, `false`, or empty. When empty (default), it is treated as `false`, and Flamingock will fail if no matching change is found. When `true`, unmatched entries are ignored during audit-history import. **Only applies when `skipImport` is `false`.** |

:::info
`origin` value by Mongock driver:

- **MongoDB**: collection name.
- **DynamoDB**: table name.
- **Couchbase**: either the collection name (implicit `_default` scope) or `{scope}.{collection}` (for example, `"myscope.mycollection"`).
:::

Example:

```java
@MongockSupport(
    targetSystem = "mongodb-target-system",
    skipImport = "false", // optional
    origin = "customChangeLog", // optional
    emptyOriginAllowed = "true", // optional
    ignoreUnknownEntries = "true" // optional
)
public class Application { }
```

By default, Flamingock uses **strict import behaviour**: if an audit entry does not match any change in the current Flamingock pipeline, the import fails. When `ignoreUnknownEntries` is set to `true`, Flamingock switches to a **relaxed import mode** and ignores those unmatched entries so the import can continue.

:::caution Intended for legacy shared-origin scenarios
This option exists to help with historical migration cases where a Mongock audit origin contains mixed entries that do not belong to the current application or service. It is a tolerance mechanism, not the primary recommended setup.

The expected model remains that each application or service uses its own independent audit origin: for example, a separate MongoDB collection, DynamoDB table, or Couchbase collection.
:::

:::tip Property placeholders
Configuration values can be set by referencing properties in the Flamingock context using the format `${my.custom.property:defaultValue}`.
:::

## Understanding the target system for Mongock migrations

Mongock and Flamingock follow different models when interacting with external systems, so it is important to understand how the `targetSystem` defined in `@MongockSupport` fits into a Flamingock application.

### 1. How Mongock handled databases

Mongock used a **single database for everything**. There was no distinction between *audit store* and *target system*.  
A single MongoDB/DynamoDB/DocumentDB/Couchbase instance played both roles, storing its **audit log** and applying its **change units**.

### 2. How Flamingock handles external systems

Flamingock separates responsibilities:

- the **audit store** records the execution history.  
- one or more **target systems** are where change units are applied.

These are independent concepts in Flamingock, even though in many practical setups the audit store is instantiated from one of the target systems.  
(See: [Audit Store vs Target System](../get-started/audit-store-vs-target-system))

### 3. Why Mongock migrations reuse a target system

When migrating from Mongock, Flamingock needs to interact with the same system that Mongock previously used for:

1. retrieving its audit log, and  
2. applying its changes.

Since Mongock used one database for both responsibilities, Flamingock reuses **one of your registered target systems** (the one that corresponds to Mongock’s previous database) to cover both roles during the migration.

This allows Flamingock to:

- **import Mongock’s audit log** from that system, and  
- **execute any pending Mongock change units** against the correct system.

### 4. What you need to configure

In your Flamingock application:

- you will register one or more target systems depending on your needs,  
- and the `targetSystem` field in `@MongockSupport` must reference the **ID of the target system that represents the database Mongock used**.

Flamingock will then:

- read the legacy Mongock audit log from that system,  
- skip Mongock change units that were already applied,  
- execute any Mongock change units that were pending, and  
- continue applying any new Flamingock change units **that target this specific system**.

### 5. Summary

Using one of your target systems to support Mongock migrations ensures:

- compatibility with Mongock’s original single-database model,  
- correct import of the legacy audit log,  
- correct execution of pending legacy changes,  
- and a smooth transition into using Flamingock’s multi–target-system architecture.

For more details about configuring target systems in Flamingock, see [Target Systems](../target-systems/introduction) and [Audit Store vs Target System](../get-started/audit-store-vs-target-system).


## Treat legacy Mongock change units as immutable

Mongock `@ChangeUnit` classes (v5) and `@ChangeLog` / `@ChangeSet` classes (v4) represent historical operations that may already have been executed in production.  
To ensure a safe and predictable migration, Flamingock **treats these legacy classes as immutable artifacts**, following the same best practices we apply to Flamingock changes.

**Immutability implies:**

- not modifying internal logic  
- not renaming classes or packages  
- not changing `id`, `order` or author  
- not relocating, splitting or merging them  
- not altering annotations or structure  

Although Flamingock may technically detect modified classes, the migration logic **assumes** they remain unchanged.  
If they diverge from what Mongock originally executed, Flamingock cannot guarantee correct audit mapping or behaviour.

Preserving immutability ensures:

- consistent audit import  
- correct skip/execute decisions  
- chronological integrity  
- reproducible migrations across environments  

Treat legacy Mongock changes as **immutable historical records**.


## Annotation mapping for new changes

Legacy Mongock classes remain untouched. For **new** changes written after the migration bridge is in place, use the Flamingock-native annotations. Direct mapping for teams coming from Mongock v5:

| Mongock                  | Flamingock               |
| ------------------------ | ------------------------ |
| `@ChangeUnit`            | `@Change`                |
| `@Execution`             | `@Apply`                 |
| `@RollbackExecution`     | `@Rollback`              |
| `@ChangeUnitConstructor` | `@FlamingockConstructor` |

For Mongock v4 users, the move is conceptual rather than a direct rename:

- `@ChangeLog` and `@ChangeSet` remain in place as legacy code.
- New Flamingock work is authored as standalone `@Change` classes (no `@ChangeLog` wrapper).

## Mongock v4 vs v5 vs Flamingock model comparison

Migration decisions are easier to reason about when the programming model differences are made explicit.

| Topic                    | Mongock v4                                 | Mongock v5                                       | Flamingock                                 |
| ------------------------ | ------------------------------------------ | ------------------------------------------------ | ------------------------------------------ |
| Main unit                | `@ChangeLog` + `@ChangeSet`                | `@ChangeUnit` class                              | `@Change` class                            |
| Execution method         | `@ChangeSet` method                        | `@Execution`                                     | `@Apply`                                   |
| Rollback method          | old model / environment-dependent behavior | `@RollbackExecution`                             | `@Rollback`                                |
| Pre-execution hook       | not part of the same primary model         | `@BeforeExecution` + `@RollbackBeforeExecution`  | model the intent explicitly in Flamingock  |
| Spring-specific wrapper  | `MongockTemplate` in Spring Mongo setups   | direct dependency injection into `@ChangeUnit`   | direct dependency injection into `@Change` |
| Audit default            | `mongockChangeLog`                         | `mongockChangeLog`                               | `flamingockAuditLog`                       |
| Lock default             | `mongockLock`                              | `mongockLock`                                    | `flamingockLock`                           |
| Spring Boot runner       | old Spring integration model               | `MongockSpringboot` / standalone runner          | `ApplicationRunner` or `InitializingBean`  |
| Main architectural model | database migration tool                    | cleaner ChangeUnit model, still database-centric | explicit Target System + Audit Store       |

Practical recommendation:

- If you are on **Mongock v4**, leave old `@ChangeLog` / `@ChangeSet` code alone.
- If you are on **Mongock v5**, leave old `@ChangeUnit` code alone too.
- In both cases, author **new** work as Flamingock `@Change` classes once the migration bridge is active.

## Edge cases to review before migrating

Some Mongock features need explicit review during the migration. Validate behaviour per feature before rolling out to production:

- `@BeforeExecution`
- `@RollbackBeforeExecution`
- `runAlways`
- `systemVersion`
- `MongockTemplate` (Spring MongoDB wrapper)

These are migration-sensitive and should be verified against a realistic pre-production dataset that includes Mongock audit history.

## Validating the migration

After the first Flamingock run against a copy of your Mongock audit history, verify:

- **Audit import completed** — Mongock audit entries appear in the Flamingock audit store. Default MongoDB collection names are `mongockChangeLog` (Mongock) and `flamingockAuditLog` (Flamingock); compare configured names if customised.
- **Already-executed changes were skipped** — no legacy change re-runs during the transition.
- **Pending legacy changes were applied** — previously-pending Mongock change units now appear as executed.
- **No gaps or duplicates** — final Flamingock audit state matches the expected executed set.

## Production recommendations

Treat the first production Flamingock run as a controlled migration event, not a routine startup:

- **Test against real history** — use a copy of production Mongock audit entries, executed history, pending changes, and realistic lock/startup timing.
- **Plan the rollout** — observable release, clear logs, controlled timing, rollback plan at the platform level.
- **Do not bundle unrelated refactors** — avoid mixing the Mongock migration with framework upgrades, driver changes, or package moves. Isolate the change to make failures diagnosable.

## How it works internally (Advanced)

Mongock support activates **when the `@MongockSupport` annotation is present**.

At compilation time, Flamingock’s annotation processor scans the entire classpath and discovers all legacy Mongock changes (classes annotated with `@ChangeUnit` or `@ChangeLog`).

:::info 
If the annotation processor is present in your build but `@MongockSupport` is missing, Flamingock will fail fast to avoid misconfiguration.
:::

### Automatic stage structure

Flamingock creates two additional stages that always run before your Flamingock stages:

#### 1. Mongock Audit Import Stage (system stage)
Imports the Mongock audit log and converts it to Flamingock’s audit format.  
This always runs first so Flamingock can safely determine which legacy changes were already applied.

#### 2. Mongock Legacy Stage (auto-generated user stage)
Contains all Mongock `@ChangeUnit` (v5) and `@ChangeLog` (v4) classes that were detected during compilation.

At runtime:

- Change units **already applied** → *skipped*  
- Change units **pending** → *Flamingock executes them*  

After this stage finishes, Flamingock continues with your normal user-defined stages.


## Compatibility notes

- Works with MongoDB, DynamoDB, DocumentDB, Couchbase and other systems supported by Mongock  
- Flamingock restrictions on change IDs, order, etc. do not apply to Mongock change units because they are historical artifacts that must remain unchanged.
- Compatible with Standalone and Spring Boot runners  
- Does not interfere with your normal Flamingock stages  
- Requires no ordering rules or manual wiring — Flamingock builds the stage structure automatically  

## Summary

Migrating from Mongock is intentionally simple. Two paths:

- **Agentic coder** — install the Flamingock Mongock migration skill and prompt the agent (see [Migrate with an agentic coder](#migrate-with-an-agentic-coder)).
- **Manual** — two steps on top of the standard Flamingock setup:
  1. Add Mongock support (Gradle plugin flag `mongock()` or Maven `mongock-support` artifact + annotation processor).
  2. Add the `@MongockSupport` annotation.

Flamingock then:

- imports the Mongock audit log  
- discovers all Mongock change units  
- skips the executed ones  
- executes the pending ones  
- and continues with your Flamingock stages  

A fast, safe and frictionless transition.
