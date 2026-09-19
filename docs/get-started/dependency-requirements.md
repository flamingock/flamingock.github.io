---
title: Dependency requirements and compatibility
sidebar_position: 20
---

# Dependency requirements and compatibility

This page summarizes the external dependencies commonly needed for Flamingock features. For detailed setup examples, follow the links in the table.

## Application-owned dependencies

These are verified minimums or compatibility notes, not a promise that every patch release works.

| Feature | Required dependency | Minimum | Details |
|---|---|---|---|
| [MongoDB Sync target system](../target-systems/mongodb-target-system.md) | MongoDB Java sync driver | `4.0.0+` | The application supplies the driver; see the linked target-system setup. |
| [DynamoDB target system](../target-systems/dynamodb-target-system.md) | AWS SDK DynamoDB Enhanced | `2.25.0+` | The application supplies the SDK; see the linked target-system setup. |
| [Couchbase target system](../target-systems/couchbase-target-system.md) | Couchbase Java Client | `3.6.0+` | The application supplies the client; see the linked target-system setup. |
| [MongoDB Spring Data target system](../target-systems/mongodb-springdata-target-system.md) | Spring Data MongoDB | `3.1.x–4.x` | Use a compatible Spring Boot/driver release train; see the linked target-system setup. |
| [SQL target system](../target-systems/sql-target-system.md) | SQL JDBC driver and `DataSource` | Application-supplied | See the linked target-system setup. |
| [GraalVM support](../frameworks/graalvm.md) | GraalVM/native-image tooling | Only when the feature is used | See the linked framework setup. |

## If your application already manages these libraries

This section applies only when your application already manages Jackson or an SLF4J provider. These are compatibility notes, not dependencies to add for Flamingock.

| Library | Compatibility guidance |
|---|---|
| Jackson | Keep `jackson-core`, `jackson-databind`, and `jackson-annotations` aligned. The conservative verified floor for the full Maven/KAPT consumer path is `2.16.0`; `2.15.0` fails KAPT. This is not an absolute minimum for every integration. |
| SLF4J provider | Optional for execution. If selected, use a 2.x provider. When no compatible 2.x provider exists, SLF4J 2.x ignores a 1.7.x provider and logging falls back to NOP. |

## Related documentation

- [Quick start](./quick-start.md)
- [Gradle plugin](./gradle-plugin.md)
- [Execution report logging](../flamingock-library-config/execution-report.md)
- [Target systems](../target-systems/introduction.md), including [MongoDB Sync](../target-systems/mongodb-target-system.md), [MongoDB Spring Data](../target-systems/mongodb-springdata-target-system.md), [DynamoDB](../target-systems/dynamodb-target-system.md), [Couchbase](../target-systems/couchbase-target-system.md), and [SQL](../target-systems/sql-target-system.md)
- [Audit stores](../audit-stores/introduction.md), including [MongoDB](../audit-stores/community/mongodb-audit-store.md), [DynamoDB](../audit-stores/community/dynamodb-audit-store.md), [Couchbase](../audit-stores/community/couchbase-audit-store.md), and [SQL](../audit-stores/community/sql-audit-store.md)
- Framework docs: [Spring Boot integration](../frameworks/springboot-integration/introduction.md) and [GraalVM support](../frameworks/graalvm.md)
