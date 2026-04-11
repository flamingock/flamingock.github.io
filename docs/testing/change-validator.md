---
title: Change validator
sidebar_position: 1.5
---
import VersionBadge from '@site/src/components/VersionBadge';

# Change validator <VersionBadge version="1.2.0" variant="title" />

`ChangeValidator` is a fluent assertion utility for verifying that change units carry the correct metadata — both code-based change **classes** and YAML **template-based change files**. It reads metadata via reflection or YAML parsing and asserts that the values match your expectations.

All assertions use a **soft-assertion pattern**: each chained call queues an assertion, and `validate()` executes them all together, collecting every failure into a single `AssertionError`. This means you see all problems at once rather than stopping at the first mismatch.

:::info Eager checks at construction
Both factory methods validate the change eagerly before any chained assertions run:

- `ChangeValidator.of(MyChange.class)` immediately verifies that the class has `@Change` and at least one `@Apply` method. If either is absent, an `IllegalArgumentException` is thrown.
- `ChangeValidator.of(yamlPath)` immediately verifies that the file exists, that `id` and `template` are present and non-empty, and that either an `apply` field or a `steps` list is present. If any check fails, an `IllegalArgumentException` is thrown.
:::

## When to use it

Add `ChangeValidator` to your test class alongside business-logic tests.

- Catches mistakes (wrong id, missing rollback, wrong target system, wrong template name) before running any container or runtime
- Requires no external system, no Flamingock runtime, and no test framework — pure reflection or YAML parsing
- Pairs naturally with the unit-testing approach described in [Unit testing your change units](./unit-testing.md)


> For setup instructions, see [Testing Flamingock — Setup](./introduction.md#setup).


## Usage — code-based changes

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


## Usage — template-based changes

Entry point: `ChangeValidator.of(Paths.get(...))` — returns a `TemplateBasedChangeValidator` ready for chaining.

**Simple template** (single `apply` / optional `rollback`):

```java
@Test
void validate_createUsersCollection() {
    ChangeValidator.of(Paths.get("src/test/java/.../changes/_0001__create_users_collection.yaml"))
        .withId("create-users-collection")
        .withOrder("0001")
        .withTemplateName("MongoChangeTemplate")
        .isNotTransactional()
        .withTargetSystem("mongodb")
        .hasRollback()
        .validate();
}
```

**Multi-step template** (`steps` list):

```java
@Test
void validate_stepBasedChange() {
    ChangeValidator.of(Paths.get("src/test/java/.../changes/_0005__step_based_change.yaml"))
        .withId("step-based-change")
        .withOrder("0005")
        .withTemplateName("MongoChangeTemplate")
        .withStepCount(3)
        .hasRollbackForStep(0)
        .hasRollbackForStep(1)
        .validate();
}
```


## Available assertions

### Shared (code-based and template-based)

| Method | What it checks | Notes |
|--------|----------------|-------|
| `withId(String)` | Change id equals expected | |
| `withAuthor(String)` | Author equals expected | |
| `withOrder(String)` | Order extracted from name via `_ORDER__Name` convention | Fails if name doesn't follow the convention |
| `withTargetSystem(String)` | Target system id equals expected | Fails if no target system is declared |
| `withRecovery(RecoveryStrategy)` | Recovery strategy equals expected | Defaults to `MANUAL_INTERVENTION` when not declared |
| `isTransactional()` | Transactional is `true` | Default is `true` for both change types |
| `isNotTransactional()` | Transactional is `false` | |
| `validate()` | Runs all queued assertions; throws `AssertionError` listing every failure. Silent on success. | Terminal — call last |

### Code-based only

| Method | What it checks | Notes |
|--------|----------------|-------|
| `hasRollbackMethod()` | At least one method annotated `@Rollback` exists | Only directly declared methods are checked |

### Template-based only

| Method | What it checks | Notes |
|--------|----------------|-------|
| `withTemplateName(String)` | The `template` field equals expected | |
| `withStepCount(int)` | The `steps` list has exactly this many entries | Fails with descriptive error on simple templates |
| `hasRollback()` | Simple: top-level `rollback` field present. Multi-step: all steps have a `rollback` field. | Reports the first failing step index for multi-step |
| `hasRollbackForStep(int)` | The step at the given 0-based index has a `rollback` field | Fails with descriptive error on simple templates |


## Naming convention for order extraction

The `withOrder` assertion extracts the order from the class simple name or the file name (without extension) using the `_ORDER__DescriptiveName` pattern:

| Name | Extracted order |
|------|----------------|
| `_0001__CreateCollection` (class) | `"0001"` |
| `_0002__seed_users.yaml` (file) | `"0002"` |
| `_20250101_01__InitSchema` | `"20250101_01"` |

If the name does not follow this convention, `withOrder` reports a failure explaining that the order could not be extracted.


## Error reporting

All failures are collected and thrown together as a single `AssertionError`:

```
TemplateBasedChangeValidator failed for _0001__create_users_collection:
  - withId: expected "create-users" but was "create-users-collection"
  - isTransactional: expected transactional=true but was false
```

```
CodeBasedChangeValidator failed for _0001__CreateCollectionChange:
  - withId: expected "create-users" but was "create-collection"
  - isTransactional: expected transactional=true but was false
```

This ensures every problem is visible in a single test run rather than requiring repeated fixes to uncover subsequent failures.
