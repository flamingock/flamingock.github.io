---
title: Coming from Mongock
sidebar_position: 999
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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
Flamingock does **not** support creating new Mongock ChangeUnits going forward.  
This integration exists purely to make the migration **fast, simple and safe**.
:::

## Quick start for Mongock users

Migrating from Mongock is intentionally simple, it only requires two additional steps on top of the [standard Flamingock setup](../get-started/quick-start).

### 1. Add Mongock Support dependency

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle" default>

```kotlin
plugins {
    id("io.flamingock") version "$version"
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

## Understanding the target system for Mongock migrations

Mongock and Flamingock follow different models when interacting with external systems, so it is important to understand how the `targetSystem` defined in `@MongockSupport` fits into a Flamingock application.

### 1. How Mongock handled databases

Mongock used a **single database for everything**. There was no distinction between *audit store* and *target system*.  
A single MongoDB/DynamoDB/DocumentDB instance played both roles, storing its **audit log**, and  applying its **change units**.

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

Mongock `@ChangeUnit` classes represent historical operations that may already have been executed in production.  
To ensure a safe and predictable migration, Flamingock **treats these legacy change units as immutable artifacts**, following the same best practices we apply to Flamingock changes.

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


## How it works internally (Advanced)

Mongock support activates **when the `@MongockSupport` annotation is present**.

At compilation time, Flamingock’s annotation processor scans the entire classpath and discovers all legacy Mongock changeUnits(clases annotated with `@ChangeUnit`)

:::info 
if the annotation processor is present in your build but `@MongockSupport` is missing, Flamingock will fail fast to avoid misconfiguration.
:::

### Automatic stage structure

Flamingock creates two additional stages that always run before your Flamingock stages:

#### 1. Mongock Audit Import Stage (system stage)
Imports the Mongock audit log and converts it to Flamingock’s audit format.  
This always runs first so Flamingock can safely determine which legacy changes were already applied.

#### 2. Mongock Legacy Stage (auto-generated user stage)
Contains all Mongock `@ChangeUnit` classes that were detected during compilation.

At runtime:

- Change units **already applied** → *skipped*  
- Change units **pending** → *Flamingock executes them*  

After this stage finishes, Flamingock continues with your normal user-defined stages.


## Compatibility notes

- Works with MongoDB, DynamoDB, DocumentDB, CouchBase and other systems supported by Mongock  
- Flamingock restrictions on change IDs, order, etc. do not apply to Mongock change units because they are historical artifacts that must remain unchanged.
- Compatible with Standalone and Spring Boot runners  
- Does not interfere with your normal Flamingock stages  
- Requires no ordering rules or manual wiring — Flamingock builds the stage structure automatically  

## Summary

Migrating from Mongock is intentionally simple:

1. Add the `mongock-support` dependency  
2. Add the `@MongockSupport` annotation  

Flamingock then:

- imports the Mongock audit log  
- discovers all Mongock change units  
- skips the executed ones  
- executes the pending ones  
- and continues with your Flamingock stages  

A fast, safe and frictionless transition.
