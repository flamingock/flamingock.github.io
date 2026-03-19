---
sidebar_position: 3
title: Create your template
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import VersionBadge from '@site/src/components/VersionBadge';

# Create your own Flamingock template <VersionBadge version="1.2.0" />


:::caution Beta feature
Templates are available in **beta**.
- You can already create **custom templates** for your own use cases.
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.
- Expect API and behavior changes before GA.

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of Changes.
:::

While official Flamingock templates are experimental, you can already build and use your own custom templates in production if needed. This page explains how.

## Introduction

[Flamingock Templates](./templates-introduction.md) allow you to encapsulate common logic and reduce boilerplate when defining change units. This document explains how to create your own templates for reuse across projects or for contribution to the Flamingock community.

## Dependency

Creating a template requires the `flamingock-core-api` artifact on the classpath. This dependency is transitively included by the core Flamingock library, so you only need to declare it explicitly when the template lives in its own dedicated module (e.g., a reusable template library):

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation(platform("io.flamingock:flamingock-community-bom:$version"))
implementation("io.flamingock:flamingock-sql-template")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-sql-template</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

## Overview of the required components

Here is the simplest possible template — a skeleton showing only the structural components:

```java
@ChangeTemplate(name = "MyTemplate")
public class MyTemplate extends AbstractChangeTemplate<TemplateVoid, TemplateString, TemplateString> {

    @Apply
    public void apply() {
        // Use this.applyPayload to perform the change
    }

    @Rollback
    public void rollback() {
        // Use this.rollbackPayload to undo the change
    }
}
```

Each component is explained in detail in the sections below:

- [`@ChangeTemplate` annotation](#the-changetemplate-annotation) — controls template identity and behavior
- [Template class and generics](#1-template-class-and-generics) — `AbstractChangeTemplate<SHARED_CONFIG, APPLY, ROLLBACK>`
- [`@Apply` and `@Rollback` methods](#2-apply-and-rollback-methods) — core execution logic with dependency injection
- [ServiceLoader registration](#3-register-the-template-with-serviceloader) — how Flamingock discovers your template
- [Packaging and distribution](#4-package-and-distribute-the-template) — internal use vs. community contribution

## The `@ChangeTemplate` annotation

Every template class **must** be annotated with `@ChangeTemplate`. This annotation is how Flamingock discovers your template and controls its behavior.

```java
@ChangeTemplate(name = "MyTemplate", multiStep = false, rollbackPayloadRequired = true)
public class MyTemplate extends AbstractChangeTemplate<TemplateVoid, TemplateString, TemplateString> {
    // ...
}
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `String` | *(required)* | The template identifier. YAML files reference your template by this name in the `template:` field. This decouples the template identity from the Java class name. |
| `multiStep` | `boolean` | `false` | Controls the YAML structure the template expects. `false` (simple template) expects root-level `apply`/`rollback`. `true` (multi-step template) expects a `steps` array. |
| `rollbackPayloadRequired` | `boolean` | `true` | Controls whether YAML authors **must** provide rollback data. Default: `true`. See [Understanding rollback behavior](#advanced-understanding-rollback-behavior) for the full implications. |

### How template resolution works

When Flamingock processes a YAML change like:

```yaml
template: SqlTemplate
```

It looks up the template class registered with `@ChangeTemplate(name = "SqlTemplate")`. The `name` attribute is the key — not the Java class name.

## 1. Template class and generics

Extend `AbstractChangeTemplate<SHARED_CONFIG, APPLY, ROLLBACK>` with three generics. All three must implement `TemplatePayload` — the interface that enables load-time validation and transaction support metadata:

- **SHARED_CONFIG**: Configuration shared between apply and rollback (e.g., connection settings). Use `TemplateVoid` when not needed.
- **APPLY**: The payload type for the apply operation.
- **ROLLBACK**: The payload type for the rollback operation.

For simple types, Flamingock provides built-in wrappers: `TemplateVoid` (no data) and `TemplateString` (raw string). For structured payloads, implement `TemplatePayload` directly — see [transaction support metadata](#advanced-transaction-support-metadata-in-payloads) for details on what `validate()` and `getInfo()` enable.

**Example:**

```java
@ChangeTemplate(name = "SqlTemplate")
public class SqlTemplate extends AbstractChangeTemplate<TemplateVoid, TemplateString, TemplateString> {

    @Apply
    public void apply(Connection connection) throws SQLException {
        // this.applyPayload (TemplateString) contains the SQL from the YAML "apply" field
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(this.applyPayload.getValue());
        }
    }

    @Rollback
    public void rollback(Connection connection) throws SQLException {
        // this.rollbackPayload (TemplateString) contains the SQL from the YAML "rollback" field
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(this.rollbackPayload.getValue());
        }
    }
}
```

In this example, `SHARED_CONFIG` is `TemplateVoid` because no shared configuration is needed. When you use a different type instead, the framework populates `this.configuration` from the YAML `configuration:` field before calling `@Apply` or `@Rollback`. See [section 2](#2-apply-and-rollback-methods) for a full example with shared configuration.

#### Important notes
- Access your apply and rollback data directly via `this.applyPayload` and `this.rollbackPayload` fields.
- Access shared configuration via `this.configuration` field (if using a non-`TemplateVoid` shared config type).
- If your template references custom types, make sure to register them for reflection—especially for **GraalVM** native builds. When extending `AbstractChangeTemplate`, you can pass your custom types to the superclass constructor to ensure proper reflection support.

:::note
See [**2. `@Apply` and `@Rollback` methods**](#2-apply-and-rollback-methods) for how to implement the core logic inside your template class using the apply/rollback data and dependency injection
:::

## 2. `@Apply` and `@Rollback` methods

:::caution
The `@Rollback` method is **required**. Template registration will fail at startup if the class is missing a `@Rollback` method.
:::

- `this.applyPayload` — the apply logic/data to apply during the apply phase
- `this.rollbackPayload` — the rollback logic/data to apply during rollback or undo
- `this.configuration` — shared configuration data (if using a non-`TemplateVoid` shared config type)

*Illustrative, non-production example:*

<Tabs groupId="template_yaml">
  <TabItem value="template" label="Template class">

```java
@ChangeTemplate(name = "KafkaTopicTemplate")
public class KafkaTopicTemplate
        extends AbstractChangeTemplate<KafkaConnectionConfig, TopicCreationRequest, TopicDeletionRequest> {
    // All three generic types implement TemplatePayload

    public KafkaTopicTemplate() {
        super(KafkaConnectionConfig.class, TopicCreationRequest.class, TopicDeletionRequest.class);
    }

    @Apply
    public void apply(AdminClient adminClient) throws Exception {
        // this.configuration — shared Kafka connection config
        // this.applyPayload — topic creation request from YAML "apply" field
        NewTopic newTopic = new NewTopic(
            this.applyPayload.getName(),
            this.applyPayload.getPartitions(),
            this.applyPayload.getReplicationFactor()
        );
        adminClient.createTopics(List.of(newTopic)).all().get();
    }

    @Rollback
    public void rollback(AdminClient adminClient) throws Exception {
        // this.rollbackPayload — topic deletion request from YAML "rollback" field
        adminClient.deleteTopics(List.of(this.rollbackPayload.getName())).all().get();
    }
}
```

  </TabItem>
  <TabItem value="yaml" label="Change YAML">

```yaml
id: create-orders-topic
template: KafkaTopicTemplate
targetSystem:
  id: "kafka-system"
configuration:
  bootstrapServers: "localhost:9092"
apply:
  name: orders
  partitions: 6
  replicationFactor: 3
rollback:
  name: orders
```

  </TabItem>
</Tabs>

> `configuration` is populated into `this.configuration` before `@Apply` or `@Rollback` is called. When shared configuration isn’t needed, use `TemplateVoid` as the first generic (as shown in [section 1](#1-template-class-and-generics)).

### Injecting dependencies into Template methods

Templates use the **same dependency injection mechanism as change units** — all dependencies are injected as method parameters, not via the constructor:

```java
@Apply
public void apply(MongoDatabase db, ClientService clientService) {
    clientService.doSomething();
}
```

Use `@Nullable` for optional dependencies — the parameter won’t cause a failure if the dependency is not registered in the context.

:::info
Flamingock will apply lock-safety guards unless you annotate the parameter with `@NonLockGuarded`.
:::

### Creating a multi-step template

Use `@ChangeTemplate(multiStep = true)` when your target technology requires **structured payloads per operation**. Technologies like MongoDB or Kafka need distinct parameters for each operation (create collection, create index, etc.), so each operation is naturally represented as a separate step. Simple templates (`multiStep = false`) are the right choice when the template is inherently single-operation, or when the payload format is free-form and can naturally express multiple operations (like SQL strings).

When `multiStep = true`:
- YAML authors define a `steps` array instead of root-level `apply`/`rollback`
- Before each step execution, Flamingock sets `this.applyPayload` and `this.rollbackPayload` with the step's data, so your `@Apply` and `@Rollback` methods access the current step's payloads via those fields
- On failure at step N, previously successful steps are rolled back in **reverse order** (N, N-1, ..., 0)
- Steps without rollback data are skipped during rollback

<Tabs groupId="template_yaml">
  <TabItem value="template" label="Template class">

```java
@ChangeTemplate(name = "MongoChangeTemplate", multiStep = true)
public class MongoChangeTemplate extends AbstractChangeTemplate<TemplateVoid, MongoOperation, MongoOperation> {

    public MongoChangeTemplate() {
        super(MongoOperation.class);
    }

    @Apply
    public void apply(MongoDatabase db, @Nullable ClientSession clientSession) {
        // Called once per step with the step's applyPayload
        executeOp(db, applyPayload, clientSession);
    }

    @Rollback
    public void rollback(MongoDatabase db, @Nullable ClientSession clientSession) {
        // Called once per step (in reverse) with the step's rollbackPayload
        executeOp(db, rollbackPayload, clientSession);
    }

    private void executeOp(MongoDatabase db, MongoOperation op, ClientSession clientSession) {
        op.getOperator(db).apply(clientSession);
    }
}
```

  </TabItem>
  <TabItem value="yaml" label="Change YAML">

```yaml
id: setup-orders-collection
template: MongoChangeTemplate
targetSystem:
  id: "mongodb-system"
steps:
  - apply:
      type: createCollection
      collection: orders
    rollback:
      type: dropCollection
      collection: orders
  - apply:
      type: createIndex
      collection: orders
      keys: { orderId: 1 }
    rollback:
      type: dropIndex
      collection: orders
      index: orderId_1
```

  </TabItem>
</Tabs>

## 3. Register the Template with ServiceLoader

Templates are discovered automatically at runtime using Java’s `ServiceLoader` system.

### Direct registration

Create a file at:

```
src/main/resources/META-INF/services/io.flamingock.api.template.ChangeTemplate
```

List the fully qualified class names of all templates in the file:

```plaintext
io.flamingock.template.kafka.CreateTopicTemplate
io.flamingock.template.kafka.UpdateTopicConfigTemplate
io.flamingock.template.kafka.DeleteTopicTemplate
```

## 4. Package and distribute the Template

Depending on your target:

### Internal Templates (private)
- No special packaging needed.
- Keep your template class inside your application.

### Public Templates (contributing to the Community)
- Package your template as a JAR.
- Notify the Flamingock team via [development@flamingock.io](mailto:development@flamingock.io) or GitHub.
- Submit your template for validation.

#### Validation requirements:
- Clear and justified use case
- Name must align and not conflict with existing templates
- Technically correct and production-grade implementation
- Public classes must be Javadoc-documented
- Submit a Pull Request adding the template's documentation to [flamingock.github.io](https://github.com/flamingock/flamingock.github.io)

## Advanced: understanding rollback behavior

Rollback is a critical part of every template. This section explains when rollback runs, what outcomes are possible, and how the `rollbackPayloadRequired` flag connects to it all.

### When rollback is triggered

Rollback runs in two scenarios:

1. **Apply failure (automatic)** — when the `@Apply` method throws an exception **and the change is non-transactional** (the target system doesn't support transactions, or the change is explicitly flagged as non-transactional), Flamingock automatically calls the `@Rollback` method to undo the change. For transactional changes, the rollback is handled natively.
2. **CLI undo operation (manual)** — an operator explicitly requests reverting an already-committed change via the Flamingock CLI.

### Two possible outcomes

Every rollback execution ends in one of two states:

| Outcome | What happened | Next Flamingock run |
|---------|---------------|---------------------|
| `ROLLED_BACK` | The `@Rollback` method completed without throwing an exception. | Re-applies the change as if nothing happened. |
| `ROLLBACK_FAILED` | The `@Rollback` method threw an exception. | Requires **manual intervention** before proceeding. |

### What the template developer controls

The `@Rollback` method body decides the outcome. If it completes normally — even as a no-op — the result is `ROLLED_BACK`. If it throws an exception, the result is `ROLLBACK_FAILED`. This gives the template developer full control over how rollback behaves.

### Connection to `rollbackPayloadRequired`

The `rollbackPayloadRequired` flag (set in the [`@ChangeTemplate` annotation](#the-changetemplate-annotation)) controls whether YAML authors must provide rollback data:

- **`true` (default)** — YAML authors must supply a `rollback` field. The template needs external input to know what to undo.
- **`false`** — the `@Rollback` method derives everything it needs from internal state (apply data, configuration, etc.) or performs a fixed strategy.

The `@Rollback` method is **always required** regardless of this flag — the flag only controls whether YAML authors must provide *data* for it.

### When to set `rollbackPayloadRequired = false`

Set this to `false` when:
- The rollback logic can derive everything it needs from the apply data and shared configuration
- The rollback uses a fixed strategy regardless of input
- The operation is inherently idempotent and doesn't need explicit rollback data

### CLI rollback chain

The CLI undo operation runs rollbacks in sequence. If any `@Rollback` method throws an exception, the chain stops immediately (fail-fast). This means a `ROLLBACK_FAILED` result doesn't just affect one change — it halts the entire undo operation.

## Advanced: understanding load-time validation

Flamingock validates all template-based changes at **pipeline load time**, before any changes are executed. This catches configuration errors early and provides clear error messages.

**Identity validation:**
- Change `id` must be non-null and non-empty
- Source file name must be present

**Order validation:**
- For sorted stages, the change must include an order (extracted from the filename prefix, e.g., `_0001__create_users.yaml`)
- Order must contain at least 3 alphanumeric characters

**Template registration validation:**
- The template referenced in the YAML must be registered via SPI
- The template class must have a `@ChangeTemplate` annotation with a non-empty name
- The template class must have a `@Rollback` method

**Structure validation:**
- Simple templates (`multiStep = false`): YAML must have `apply`, may have `rollback`, must **not** have `steps`
- Multi-step templates (`multiStep = true`): YAML must have `steps`, must **not** have root-level `apply` or `rollback`

**Payload validation:**
- `apply` payloads must not be null (always validated)
- `rollback` payloads must not be null when the template has `rollbackPayloadRequired = true` (the default)
- For multi-step templates: each step's `apply` is validated; each step's `rollback` is validated per the template's `rollbackPayloadRequired` setting

If validation fails, Flamingock reports a clear error with details about which change and which field caused the issue.

## Advanced: transaction support metadata in payloads

Template payloads carry metadata about whether they support transactions. This allows Flamingock to **infer** the `transactional` flag when YAML authors omit it — reducing boilerplate and preventing misconfiguration.

### Metadata via `TemplatePayload`

As described in [section 1](#1-template-class-and-generics), all generic types must implement `TemplatePayload`. The key metadata method is `getInfo()`, which returns `TemplatePayloadInfo` — this is how the framework knows what the payload supports.

```java
public interface TemplatePayload {
    List<TemplatePayloadValidationError> validate(TemplateValidationContext context);
    TemplatePayloadInfo getInfo();
}
```

### `supportsTransactions` — three-valued semantics

The `TemplatePayloadInfo.supportsTransactions` field uses three-valued logic:

| Value | Meaning |
|-------|---------|
| `null` (default) | No claim — framework treats as `true` |
| `true` | Explicitly supports transactions |
| `false` | Explicitly does **not** support transactions |

### Inference rules

When a YAML change omits the `transactional` field, Flamingock infers it from the apply payloads:

- If **any** apply payload declares `supportsTransactions = false` → the change is inferred as **non-transactional**
- Otherwise → the change is inferred as **transactional**
- An **explicit** `transactional` value in YAML always takes precedence over inference
- Only **apply** payloads participate in inference (not rollback)

### Validation

If a YAML change explicitly sets `transactional: true` but an apply payload declares `supportsTransactions = false`, Flamingock raises a **validation error at load time**. This catches the contradiction early — before any change executes.

### Example: a payload that declares non-transactional support

```java
public class DdlOperation implements TemplatePayload {

    private String type;
    private String collection;

    @Override
    public List<TemplatePayloadValidationError> validate(TemplateValidationContext context) {
        // validation logic...
        return Collections.emptyList();
    }

    @Override
    public TemplatePayloadInfo getInfo() {
        TemplatePayloadInfo info = new TemplatePayloadInfo();
        info.setSupportsTransactions(false);
        return info;
    }
}
```

With this payload, YAML authors can safely omit `transactional` — Flamingock will infer `false` automatically.

### Note about wrapper types

Flamingock's built-in `TemplateString` (used by the SQL Template) makes **no claim** about transaction support — it returns a default `TemplatePayloadInfo`. This means SQL changes default to transactional when `transactional` is omitted, which is the expected behavior for most SQL operations.

## ✅ Best Practices

- Always annotate your template class with `@ChangeTemplate(name = "...")` — choose a descriptive, stable name since YAML authors depend on it.
- Use `AbstractChangeTemplate<SHARED_CONFIG, APPLY, ROLLBACK>` with the appropriate generic types for your use case.
- Always provide both `@Apply` and `@Rollback` methods — both are required for template registration.
- Set `rollbackPayloadRequired = false` only when rollback logic can derive what it needs from the apply data or doesn't need external input (see [Understanding rollback behavior](#advanced-understanding-rollback-behavior)).
- Choose `multiStep = true` when the target technology requires structured payloads per operation; use simple templates when the payload format can naturally express multiple operations or is inherently single-operation.
- Use `TemplateVoid` for generics when that type is not needed (e.g., `<TemplateVoid, TemplateString, TemplateString>` for simple SQL templates).
- Use shared configuration (`<ConfigType, Apply, Rollback>`) when both apply and rollback need the same configuration data.
- Document your template's purpose, generic types, and expected YAML structure clearly for users.
- Ensure all custom types are registered for reflection by passing them to the superclass constructor, especially when targeting native builds.
- Group multiple templates by domain when packaging a library.
- Implement `TemplatePayload` in custom payload types and declare `supportsTransactions(false)` for non-transactional operations — this enables automatic inference of the `transactional` flag for YAML authors.
