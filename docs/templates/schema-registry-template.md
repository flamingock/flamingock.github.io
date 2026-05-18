---
sidebar_position: 5
title: Schema Registry Template
sidebar_label: Schema Registry Template
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Schema Registry Template Reference

:::caution Beta feature
The Schema Registry Template is available in **beta**.
:::

The Schema Registry Template (`schema-registry-template`) provides a declarative way to define Kafka Schema Registry operations in YAML format. It supports Confluent, Karapace, Apicurio, and Redpanda registries through the Confluent-compatible REST API.

## Getting started

The Schema Registry Template allows you to manage schema lifecycle declaratively in YAML instead of writing Java code. Here's a quick example:

```yaml
id: register-user-event-schema
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: user-events-value
      schemaType: AVRO
      schemaFile: user-event-v1.avsc
    rollback:
      operation: DELETE_SUBJECT
      subject: user-events-value
```

This single YAML file replaces what would typically require a Java class with annotations and Schema Registry client code. For a step-by-step guide on setting up templates, see [How to use Templates](./templates-how-to-use.md).

## Installation

### Dependency setup

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
flamingock {
    //...
    schemaregistry()
}
```
  </TabItem>
  <TabItem value="maven" label="Maven">

Requires the [Flamingock BOM](../get-started/quick-start.md) in your `<dependencyManagement>` section:

```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-java-template-schema-registry</artifactId>
</dependency>
```
  </TabItem>
</Tabs>

### Runtime dependencies

The template declares the Schema Registry client as `compileOnly` — you must provide it at runtime along with the schema-type providers for the formats you use:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
// Required — Schema Registry client
implementation("io.confluent:kafka-schema-registry-client:7.9.0")

// Add the providers for the schema formats you use:
implementation("org.apache.avro:avro:1.12.0")                        // AVRO
implementation("io.confluent:kafka-json-schema-provider:7.9.0")      // JSON
implementation("io.confluent:kafka-protobuf-provider:7.9.0")         // PROTOBUF
```

You also need the Confluent Maven repository:
```kotlin
repositories {
    mavenCentral()
    maven { url = uri("https://packages.confluent.io/maven/") }
}
```
  </TabItem>
  <TabItem value="maven" label="Maven">

```xml
<!-- Required — Schema Registry client -->
<dependency>
    <groupId>io.confluent</groupId>
    <artifactId>kafka-schema-registry-client</artifactId>
    <version>7.9.0</version>
</dependency>

<!-- Add the providers for the schema formats you use: -->
<!-- AVRO -->
<dependency>
    <groupId>org.apache.avro</groupId>
    <artifactId>avro</artifactId>
    <version>1.12.0</version>
</dependency>
<!-- JSON -->
<dependency>
    <groupId>io.confluent</groupId>
    <artifactId>kafka-json-schema-provider</artifactId>
    <version>7.9.0</version>
</dependency>
<!-- PROTOBUF -->
<dependency>
    <groupId>io.confluent</groupId>
    <artifactId>kafka-protobuf-provider</artifactId>
    <version>7.9.0</version>
</dependency>
```

You also need the Confluent Maven repository:
```xml
<repositories>
    <repository>
        <id>confluent</id>
        <url>https://packages.confluent.io/maven/</url>
    </repository>
</repositories>
```
  </TabItem>
</Tabs>

### Prerequisites

The Schema Registry Template requires:

- The [Non-transactional Target System](../target-systems/non-transactional-target-system.md) module.
- A `SchemaRegistryClient` instance (Confluent `kafka-schema-registry-client`).
- Java 17+.

## Target system setup

The Schema Registry Template uses a `NonTransactionalTargetSystem` with a `SchemaRegistryClient` added as a dependency.

### Creating the client

The template includes `SchemaRegistryClientFactory` for constructing a `SchemaRegistryClient` with optional provider auto-detection:

```java
import io.flamingock.template.schemaregistry.util.SchemaRegistryClientFactory;
import io.flamingock.template.schemaregistry.util.SchemaRegistryProvider;

// Production — explicit provider, zero HTTP probes
SchemaRegistryClient client = SchemaRegistryClientFactory.create(
    "http://registry:8081", SchemaRegistryProvider.CONFLUENT);

// Local/staging — auto-detect provider
SchemaRegistryClient client = SchemaRegistryClientFactory.create("http://localhost:8081");

// With authentication
SchemaRegistryClient client = SchemaRegistryClientFactory.create(
    "http://registry:8081",
    SchemaRegistryProvider.CONFLUENT,
    Map.of("basic.auth.user.info", "user:password"),
    100);  // cache capacity
```

:::tip
Use an explicit `SchemaRegistryProvider` in production to skip HTTP probes. Use `AUTO` only for local and staging environments.
:::

### Supported providers

| Provider | Detection signal | Notes |
|----------|-----------------|-------|
| `CONFLUENT` | `GET /` returns JSON with `clusterId` | Enterprise standard |
| `KARAPACE` | `GET /` returns JSON with `karapace_version` | Aiven's drop-in replacement |
| `APICURIO` | `GET /apis/registry/v3` returns 200 | Client URL rewritten to `/apis/ccompat/v7` |
| `REDPANDA` | Falls through to CONFLUENT default | Built-in registry, Confluent-compatible |
| `AUTO` | Probes in the order above | Up to 2 HTTP requests, 5s timeout each |

### Wiring with Flamingock

```java
SchemaRegistryClient client = SchemaRegistryClientFactory.create(
    "http://localhost:8081", SchemaRegistryProvider.CONFLUENT);

FlamingockFactory.getCommunityBuilder()
    .setAuditStore(/* your audit store */)
    .addTargetSystem(new NonTransactionalTargetSystem("schema-registry")
        .addDependency(client))
    .build()
    .run();
```

The target system ID (`"schema-registry"`) must match the `targetSystem.id` in your YAML change files.

## YAML structure

The Schema Registry Template uses the **steps format** where each step contains an apply operation and an optional rollback operation.

```yaml
# Required: Unique identifier for this change
id: my-change-id

# Required: Must be false — Schema Registry operations are non-transactional
transactional: false

# Required: Template to use
template: schema-registry-template

# Required: Target system configuration
targetSystem:
  id: "schema-registry"

# Optional: Template-level configuration
configuration:
  schemaBasePath: /schemas/

# Required: List of steps, each with an apply and optional rollback
steps:
  - apply:
      operation: <REGISTER|EVOLVE|SET_SUBJECT_CONFIG|RESET_SUBJECT_CONFIG|DELETE_SUBJECT|DELETE_VERSION>
      subject: <subject-name>
      schemaType: <AVRO|JSON|PROTOBUF>    # Required for REGISTER, EVOLVE
      schemaFile: <classpath-path>         # Or use inline schema below
      schema: <inline-schema-string>      # Mutually exclusive with schemaFile
      references:                         # Only for REGISTER, EVOLVE
        - name: <reference-name>          # AVRO/JSON: fully qualified type name. PROTOBUF: imported .proto filename
          subject: <referenced-subject>   # Subject under which the referenced schema is registered
          version: <version-number>       # Version of the referenced schema
      compatibility: <mode>               # Only for SET_SUBJECT_CONFIG
      normalize: <boolean>               # Only for SET_SUBJECT_CONFIG (optional)
      compatibilityGroup: <group-name>   # Only for SET_SUBJECT_CONFIG (optional)
      validateCompatibility: true         # Only for EVOLVE (default: true)
      permanent: false                    # Only for DELETE_SUBJECT/DELETE_VERSION
    rollback:
      operation: <rollback-operation>
      subject: <subject-name>
      # ... operation-specific fields
```

### Schema loading

Schemas can be provided inline or loaded from classpath files:

- **Inline** (`schema:`): the schema content is embedded directly in the YAML.
- **File** (`schemaFile:`): the schema is loaded from the classpath. Relative paths are resolved against `schemaBasePath` (default `/schemas/`). Absolute paths starting with `/` bypass `schemaBasePath`.

`schema` and `schemaFile` are mutually exclusive — you must use one or the other for operations that require a schema.

**Path resolution examples:**

| `schemaBasePath` | `schemaFile` | Resolved classpath path |
|------------------|-------------|------------------------|
| `/schemas/` | `user-event-v1.avsc` | `/schemas/user-event-v1.avsc` |
| `/schemas/` | `/custom/event.avsc` | `/custom/event.avsc` |
| `/events/avro/` | `order.avsc` | `/events/avro/order.avsc` |

### Rollback behavior

When a step fails during execution:
1. All previously successful steps are rolled back in reverse order.
2. Steps without rollback operations are skipped during rollback.
3. For `DELETE_VERSION` rollbacks, the schema is automatically derived from the apply payload — you don't need to specify it again.
4. If an `EVOLVE` was a no-op (the schema was already registered), its `DELETE_VERSION` rollback is skipped to avoid deleting a pre-existing version.

## Configuration

The template supports optional configuration via the `configuration` field:

```yaml
id: register-with-custom-path
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
configuration:
  schemaBasePath: /schemas/events/
steps:
  - apply:
      operation: REGISTER
      subject: user-events-value
      schemaType: AVRO
      schemaFile: user-event-v1.avsc
    rollback:
      operation: DELETE_SUBJECT
      subject: user-events-value
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schemaBasePath` | String | `/schemas/` | Classpath base path prepended to relative `schemaFile` paths. Absolute paths (starting with `/`) bypass this setting. |

## Supported operations

### REGISTER

Registers the first version of a schema under a subject. This operation enforces that the subject does not already have versions — if versions exist, it fails with an error directing the user to use `EVOLVE` instead.

```yaml
- apply:
    operation: REGISTER
    subject: user-events-value
    schemaType: AVRO
    schemaFile: user-event-v1.avsc
  rollback:
    operation: DELETE_SUBJECT
    subject: user-events-value
```

**With schema references:**

The `name` field follows the schema format's referencing convention:

- **AVRO / JSON**: the fully qualified type name as it appears in the referencing schema (e.g. `io.flamingock.Address`).
- **PROTOBUF**: the filename used in the `import` statement of the referencing `.proto` file (e.g. `address.proto`).

The referenced subject must already be registered — typically in an earlier change within the same stage.

```yaml
- apply:
    operation: REGISTER
    subject: order-events-value
    schemaType: AVRO
    schemaFile: order-event.avsc
    references:
      - name: io.flamingock.Address
        subject: address-value
        version: 1
  rollback:
    operation: DELETE_SUBJECT
    subject: order-events-value
```

:::caution Engine support for AVRO references
Confluent, Apicurio, and Redpanda support schema references for all three formats.

**Karapace 3.x rejects Avro references** with HTTP 422 and `errorCode 44302` (`Schema references are not supported for 'AVRO' schema type`). This is enforced server-side in Karapace's schema validation path, before any version is persisted — so neither the template nor the Confluent client can work around it.

Why: Avro reference resolution requires the server-side parser to merge referenced type definitions into the parsing context of the referencing schema (Avro identifies cross-schema types by fully qualified name, not by file/import like Protobuf). Confluent's server-side Java Avro stack does this merge; Karapace's Avro path does not. JSON Schema and Protobuf are unaffected because their reference models are simpler — `$ref` URIs and `import` filenames resolved without re-parsing referenced types into a shared symbol table.

Workarounds, in order of preference:

1. **Switch engines** if you need Avro references — Confluent, Apicurio, or Redpanda all support them.
2. **Inline the referenced types** into each referencing Avro schema (no `references:` block). You lose the registry-level dependency record, but the schema parses standalone. Suitable when the reference graph is shallow and reuse is mostly editorial.
3. **Use Protobuf or JSON Schema** for cross-schema models on Karapace.

The template intentionally does not silently rewrite `references:` into inlined types — that would lose the dependency metadata the user explicitly asked for, and break consumers that look up references via the registry (e.g. Avro `SpecificAvroSerde` with reference resolution).

Upstream tracking: see Karapace's open issues on Avro reference support.
:::

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | String | Yes | Must be `REGISTER` |
| `subject` | String | Yes | Schema registry subject name |
| `schemaType` | String | Yes | One of: `AVRO`, `JSON`, `PROTOBUF` |
| `schema` | String | Conditional | Inline schema content. Mutually exclusive with `schemaFile` |
| `schemaFile` | String | Conditional | Classpath path to schema file. Mutually exclusive with `schema` |
| `references` | List | No | Schema references for schemas that depend on other registered schemas |

One of `schema` or `schemaFile` is required.

:::caution Subject must be new
`REGISTER` will fail if the subject already has versions. Use `EVOLVE` to add new versions to an existing subject.
:::

**Typical rollback:** `DELETE_SUBJECT`

---

### EVOLVE

Registers a new version of an existing subject. Optionally validates compatibility before registering. This operation enforces that the subject already exists — if it doesn't, it fails with an error directing the user to use `REGISTER` instead.

```yaml
- apply:
    operation: EVOLVE
    subject: user-events-value
    schemaType: AVRO
    schemaFile: user-event-v2.avsc
    validateCompatibility: true
  rollback:
    operation: DELETE_VERSION
    subject: user-events-value
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | String | Yes | — | Must be `EVOLVE` |
| `subject` | String | Yes | — | Schema registry subject name |
| `schemaType` | String | Yes | — | One of: `AVRO`, `JSON`, `PROTOBUF` |
| `schema` | String | Conditional | — | Inline schema content. Mutually exclusive with `schemaFile` |
| `schemaFile` | String | Conditional | — | Classpath path to schema file. Mutually exclusive with `schema` |
| `references` | List | No | — | Schema references for schemas that depend on other registered schemas |
| `validateCompatibility` | boolean | No | `true` | When `true`, calls `testCompatibility()` before `register()`. An incompatible schema throws an error before any state is modified |

:::caution Subject must exist
`EVOLVE` will fail if the subject does not exist. Use `REGISTER` for initial schema registration.
:::

:::info No-op safety
If the exact schema is already registered under the subject, `EVOLVE` is a no-op — no new version is created. In this case, the schema is **not** cached for rollback, ensuring that a `DELETE_VERSION` rollback won't accidentally delete a pre-existing version.
:::

**Typical rollback:** `DELETE_VERSION` (schema automatically derived from apply payload — no need to specify it in the rollback)

---

### SET_SUBJECT_CONFIG

Sets subject-level configuration including compatibility mode and optional normalization settings.

```yaml
- apply:
    operation: SET_SUBJECT_CONFIG
    subject: user-events-value
    compatibility: FULL
  rollback:
    operation: RESET_SUBJECT_CONFIG
    subject: user-events-value
```

**With optional fields:**

```yaml
- apply:
    operation: SET_SUBJECT_CONFIG
    subject: user-events-value
    compatibility: FULL_TRANSITIVE
    normalize: true
    compatibilityGroup: myGroup
  rollback:
    operation: RESET_SUBJECT_CONFIG
    subject: user-events-value
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | String | Yes | Must be `SET_SUBJECT_CONFIG` |
| `subject` | String | Yes | Schema registry subject name |
| `compatibility` | String | Yes | The compatibility mode to set (see table below) |
| `normalize` | boolean | No | Whether schema normalization is enabled for the subject |
| `compatibilityGroup` | String | No | The compatibility group for the subject |

**Compatibility modes:**

| Mode | Guarantee |
|------|-----------|
| `BACKWARD` | New consumers can read data produced by old schema (default) |
| `FORWARD` | Old consumers can read data produced by new schema |
| `FULL` | Both backward and forward compatible |
| `NONE` | No compatibility checks |
| `BACKWARD_TRANSITIVE` | Backward against **all** prior versions |
| `FORWARD_TRANSITIVE` | Forward against **all** prior versions |
| `FULL_TRANSITIVE` | Full against **all** prior versions |

**Typical rollback:** `RESET_SUBJECT_CONFIG` (reverts to global defaults) or `SET_SUBJECT_CONFIG` with the previous values

---

### RESET_SUBJECT_CONFIG

Removes **all** subject-level configuration overrides (compatibility, normalize, compatibilityGroup), reverting the subject to global defaults. This is an all-or-nothing operation — individual fields cannot be selectively reset.

```yaml
- apply:
    operation: RESET_SUBJECT_CONFIG
    subject: user-events-value
  rollback:
    operation: SET_SUBJECT_CONFIG
    subject: user-events-value
    compatibility: FULL
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | String | Yes | Must be `RESET_SUBJECT_CONFIG` |
| `subject` | String | Yes | Schema registry subject name |

:::tip Selective config changes
`RESET_SUBJECT_CONFIG` resets **all** subject-level settings at once. If you only need to change specific fields while preserving others, use `RESET_SUBJECT_CONFIG` followed by `SET_SUBJECT_CONFIG` with the desired values. For example, to change only the compatibility mode while preserving other settings, first reset, then set the fields you want:

```yaml
steps:
  - apply:
      operation: RESET_SUBJECT_CONFIG
      subject: user-events-value
  - apply:
      operation: SET_SUBJECT_CONFIG
      subject: user-events-value
      compatibility: FULL_TRANSITIVE
      normalize: true
```
:::

**Typical rollback:** `SET_SUBJECT_CONFIG` with the previous configuration values

---

### DELETE_SUBJECT

Deletes all versions of a subject. By default this is a **soft delete** — the subject is hidden from listings but preserved internally. Set `permanent: true` for a hard delete.

```yaml
- apply:
    operation: DELETE_SUBJECT
    subject: user-events-value
```

**With hard delete:**

```yaml
- apply:
    operation: DELETE_SUBJECT
    subject: user-events-value
    permanent: true
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | String | Yes | — | Must be `DELETE_SUBJECT` |
| `subject` | String | Yes | — | Schema registry subject name |
| `permanent` | boolean | No | `false` | `true` for hard delete (irreversible), `false` for soft delete |

This operation is idempotent — if the subject is already deleted, it is skipped.

:::info Soft delete vs hard delete
**Soft delete** (default): the subject is hidden but preserved internally. Version numbers are not reset on re-registration.

**Hard delete** (`permanent: true`): permanently removes all data. The template automatically performs the required soft delete first (Confluent API constraint), then the hard delete. Hard delete allows clean re-registration with version numbering starting from 1.
:::

---

### DELETE_VERSION

Deletes a specific schema version identified by its schema fingerprint.

**As an apply operation** (schema must be specified to identify the version):

```yaml
- apply:
    operation: DELETE_VERSION
    subject: user-events-value
    schemaType: AVRO
    schemaFile: user-event-v2.avsc
```

**As a rollback operation** (schema automatically derived from the apply payload):

```yaml
- apply:
    operation: EVOLVE
    subject: user-events-value
    schemaType: AVRO
    schemaFile: user-event-v2.avsc
  rollback:
    operation: DELETE_VERSION
    subject: user-events-value
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | String | Yes | — | Must be `DELETE_VERSION` |
| `subject` | String | Yes | — | Schema registry subject name |
| `schema` | String | Conditional | — | Required when used as apply. Optional as rollback (auto-derived) |
| `schemaFile` | String | Conditional | — | Same as `schema` |
| `schemaType` | String | Conditional | — | Required when `schema` or `schemaFile` is set |
| `permanent` | boolean | No | `false` | `true` for hard delete (irreversible), `false` for soft delete |

This operation is idempotent — if the version is already deleted, it is skipped.

:::note Rollback auto-derivation
When used as a rollback for `REGISTER` or `EVOLVE`, the schema is automatically resolved from the apply payload. If `EVOLVE` was a no-op (the schema was already registered), the rollback is skipped entirely to avoid deleting a pre-existing version.
:::

## Schema types

| Type | Format | Provider dependency |
|------|--------|-------------------|
| `AVRO` | Apache Avro (`.avsc` files) | `org.apache.avro:avro` |
| `JSON` | JSON Schema (`.json` files) | `io.confluent:kafka-json-schema-provider` |
| `PROTOBUF` | Protocol Buffers (`.proto` files) | `io.confluent:kafka-protobuf-provider` |

## Complete examples

### Example 1: Register key and value schemas for a topic

A common pattern is to register both key and value schemas for a Kafka topic in a single change:

```yaml
id: register-payment-topic-schemas
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: payment-events-key
      schemaType: AVRO
      schema: '{"type":"string"}'
    rollback:
      operation: DELETE_SUBJECT
      subject: payment-events-key
  - apply:
      operation: REGISTER
      subject: payment-events-value
      schemaType: AVRO
      schemaFile: payment-event.avsc
    rollback:
      operation: DELETE_SUBJECT
      subject: payment-events-value
```

### Example 2: Schema evolution lifecycle

A typical progression across multiple change files — register a schema, evolve it, and tighten compatibility:

**`_0001__register_user_event.yaml`**

```yaml
id: register-user-event-schema
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: user-events-value
      schemaType: AVRO
      schemaFile: user-event-v1.avsc
    rollback:
      operation: DELETE_SUBJECT
      subject: user-events-value
```

**`_0002__evolve_user_event.yaml`**

```yaml
id: add-timestamp-field
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: EVOLVE
      subject: user-events-value
      schemaType: AVRO
      schemaFile: user-event-v2.avsc
    rollback:
      operation: DELETE_VERSION
      subject: user-events-value
```

**`_0003__set_subject_config.yaml`**

```yaml
id: set-subject-config
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: SET_SUBJECT_CONFIG
      subject: user-events-value
      compatibility: FULL
    rollback:
      operation: RESET_SUBJECT_CONFIG
      subject: user-events-value
```

### Example 3: Inline schema and multiple formats

**Inline Avro schema (no external file needed):**

```yaml
id: register-inline-schema
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: inline-events-value
      schemaType: AVRO
      schema: >
        {"type":"record","name":"InlineEvent","namespace":"io.flamingock.test",
        "fields":[{"name":"id","type":"string"},{"name":"message","type":"string"}]}
    rollback:
      operation: DELETE_SUBJECT
      subject: inline-events-value
```

**JSON Schema:**

```yaml
id: register-product-event-json-schema
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: product-events-value
      schemaType: JSON
      schemaFile: product-event.json
    rollback:
      operation: DELETE_SUBJECT
      subject: product-events-value
```

**Protobuf:**

```yaml
id: register-order-event-protobuf-schema
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: order-events-value
      schemaType: PROTOBUF
      schemaFile: order-event.proto
    rollback:
      operation: DELETE_SUBJECT
      subject: order-events-value
```

### Example 4: Schema references across subjects

Register a referenced schema first, then a schema that depends on it. The template fetches the referenced schema content from the registry at apply time so cross-schema types resolve during parsing.

**`address-ref.proto`** (referenced schema content):

```proto
syntax = "proto3";
package io.flamingock.examples;

message Address {
  string street = 1;
  string city   = 2;
}
```

**`customer-event-ref.proto`** (referencing schema content):

```proto
syntax = "proto3";
package io.flamingock.examples;

import "address-ref.proto";

message CustomerEvent {
  string customer_id = 1;
  io.flamingock.examples.Address address = 2;
}
```

**`_0001__register_address.yaml`**

```yaml
id: register-address-proto
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: address-value
      schemaType: PROTOBUF
      schemaFile: address-ref.proto
    rollback:
      operation: DELETE_SUBJECT
      subject: address-value
```

**`_0002__register_customer_with_ref.yaml`**

```yaml
id: register-customer-event-with-ref
transactional: false
template: schema-registry-template
targetSystem:
  id: "schema-registry"
steps:
  - apply:
      operation: REGISTER
      subject: customer-events-value
      schemaType: PROTOBUF
      schemaFile: customer-event-ref.proto
      references:
        - name: address-ref.proto         # MUST match the proto import statement
          subject: address-value
          version: 1
    rollback:
      operation: DELETE_SUBJECT
      subject: customer-events-value
```

## File naming convention

Change files are executed in alphabetical order. Use a numeric prefix to control execution order:

```
_0001__register_user_event.yaml
_0002__evolve_user_event.yaml
_0003__set_subject_config.yaml
_0004__register_product_event_json.yaml
```
