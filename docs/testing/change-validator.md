---
title: Change validator
sidebar_position: 1.5
---
import VersionBadge from '@site/src/components/VersionBadge';

# Change validator <VersionBadge version="1.2.0" />

`ChangeValidator` is a fluent assertion utility for verifying that a change class carries the correct annotations. It reads metadata via reflection — `@Change`, `@TargetSystem`, `@Recovery`, `@Apply`, and `@Rollback` — and asserts that the values match your expectations.

All assertions use a **soft-assertion pattern**: each chained call queues an assertion, and `validate()` executes them all together, collecting every failure into a single `AssertionError`. This means you see all problems at once rather than stopping at the first mismatch.

:::info Eager checks at construction
`ChangeValidator.of(MyChange.class)` immediately verifies that the class has `@Change` and at least one `@Apply` method. If either is absent, an `IllegalArgumentException` is thrown before any chained assertions run.
:::

## When to use it

Add `ChangeValidator` to your test class alongside business-logic tests.

- Catches annotation mistakes (wrong id, missing rollback, wrong target system) before running any container or runtime
- Requires no external system, no Flamingock runtime, and no test framework — pure reflection
- Pairs naturally with the unit-testing approach described in [Unit testing your change units](./unit-testing.md)


## Dependency

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="maven" label="Maven">

```xml
<dependency>
  <groupId>io.flamingock</groupId>
  <artifactId>flamingock-test-support</artifactId>
  <version>VERSION</version>
  <scope>test</scope>
</dependency>
```

</TabItem>
<TabItem value="gradle" label="Gradle (Kotlin DSL)">

```kotlin
testImplementation("io.flamingock:flamingock-test-support:VERSION")
```

</TabItem>
</Tabs>


## Usage

Entry point: `ChangeValidator.of(MyChange.class)` — returns a `CodeBasedChangeValidator` ready for chaining.

```java
@Test
void validate_createCollection() {
    ChangeValidator.of(_0001__CreateCollectionChange.class)
        .withId("create-collection")
        .withAuthor("flamingock-team")
        .withOrder("0001")
        .isNotTransactional()
        .withTargetSystem("mongodb-target-system")
        .hasRollbackMethod()
        .validate();
}
```


## Available assertions

| Method | What it checks | Notes |
|--------|---------------|-------|
| `withId(String)` | `@Change.id` equals expected | |
| `withAuthor(String)` | `@Change.author` equals expected | |
| `withOrder(String)` | Order extracted from class name via `_ORDER__Name` convention | Fails if class name doesn't follow the convention |
| `withTargetSystem(String)` | `@TargetSystem.id` equals expected | Fails if no `@TargetSystem` annotation is present |
| `withRecovery(RecoveryStrategy)` | `@Recovery.strategy` equals expected | Defaults to `MANUAL_INTERVENTION` when annotation is absent |
| `isTransactional()` | `@Change.transactional == true` | |
| `isNotTransactional()` | `@Change.transactional == false` | |
| `hasRollbackMethod()` | At least one method annotated `@Rollback` exists | Only directly declared methods are checked |
| `validate()` | Runs all queued assertions; throws `AssertionError` listing every failure. Silent on success. | Terminal — call last |


## Naming convention for order extraction

The `withOrder` assertion extracts the order from the class simple name using the `_ORDER__DescriptiveName` pattern:

| Class name | Extracted order |
|------------|----------------|
| `_0001__CreateCollection` | `"0001"` |
| `_0002__InsertDocument` | `"0002"` |
| `_20250101_01__InitSchema` | `"20250101_01"` |

If the class name does not follow this convention, `withOrder` reports a failure explaining that the order could not be extracted.


## Error reporting

All failures are collected and thrown together as a single `AssertionError`:

```
CodeBasedChangeValidator failed for _0001__CreateCollectionChange:
  - withId: expected "create-users" but was "create-collection"
  - isTransactional: expected transactional=true but was false
```

This ensures every annotation problem is visible in a single test run rather than requiring repeated fixes to uncover subsequent failures.
