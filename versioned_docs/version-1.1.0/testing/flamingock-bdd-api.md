---
title: Flamingock BDD API
sidebar_position: 2.5
---

## Introduction

Flamingock's test support framework provides a fluent BDD-style API for writing integration tests. This API is shared between standalone and Spring Boot tests — once you understand these concepts, you can apply them in either context.

The API follows a **Given-When-Then** pattern:

```java
FlamingockTestSupport
    .givenBuilder(builder)                           // Given: configure the builder
    .andExistingAudit(APPLIED(PreviousChange.class)) // Given: set up existing audit state
    .whenRun()                                       // When: trigger execution
    .thenExpectAuditFinalStateSequence(...)          // Then: define expectations
    .verify();                                       // Execute and validate
```

:::info Lazy execution
All methods are **intermediate operations** — nothing executes until `verify()` is called. This allows you to build complex test scenarios before running them.
:::


## AuditEntryDefinition

Factory methods to define expected audit entries. Import statically for cleaner tests:

```java
import static io.flamingock.support.domain.AuditEntryDefinition.*;
```

### String-based (manual)

Specify the change ID directly:

```java
APPLIED("change-id")
FAILED("change-id")
ROLLED_BACK("change-id")
ROLLBACK_FAILED("change-id")
```

### Class-based (recommended)

Pass the change class to auto-extract metadata from annotations:

```java
APPLIED(MyChange.class)
FAILED(MyChange.class)
ROLLED_BACK(MyChange.class)
ROLLBACK_FAILED(MyChange.class)
```

This approach automatically extracts:
- `changeId` from `@Change` annotation
- `author` from `@Change` annotation
- `className` and `methodName`
- `targetSystemId` from `@TargetSystem` annotation
- `order` and `transactional`

### Fluent builder

Add or override specific fields:

```java
APPLIED(MyChange.class)
    .withAuthor("custom-author")
    .withTargetSystemId("mongodb-main")
    .withErrorTrace("Expected error message")
    .withTransactional(true)
    .withOrder("001")
```

### Selective field validation

The validator only checks fields that are **set** in the definition:

| Definition | Fields validated |
|------------|------------------|
| `APPLIED("my-change")` | `changeId`, `state` |
| `APPLIED(MyChange.class)` | `changeId`, `state`, `author`, `className`, `methodName`, `order`, `transactional`, `targetSystemId`, `recoveryStrategy` |
| `APPLIED("id").withAuthor("x")` | `changeId`, `state`, `author` |


## WhenStage

The `whenRun()` method marks the transition from setup to expectations:

```java
.givenBuilder(builder)
.andExistingAudit(APPLIED(PreviousChange.class))
.whenRun()  // Transition point
.thenExpect...
```


## Validators

### ExpectAuditFinalStateSequence

Validates the final audit state after execution:

```java
.whenRun()
.thenExpectAuditFinalStateSequence(
    APPLIED(Change1.class),
    APPLIED(Change2.class)
)
.verify();
```

**Behavior:**
- Validates only **final states**: `APPLIED`, `FAILED`, `ROLLED_BACK`, `ROLLBACK_FAILED`
- Filters out intermediate states like `STARTED`
- Requires **exact count match** — if 3 changes executed, provide exactly 3 definitions
- Preserves **order** — expected[0] must match actual[0], etc.

### ExpectException

Expects an exception to be thrown during execution:

```java
.whenRun()
.thenExpectException(PipelineExecutionException.class, ex -> {
    assertTrue(ex.getMessage().contains("Expected error"));
})
.verify();
```

If you don't need to validate the exception details, use the single-parameter overload:

```java
.thenExpectException(PipelineExecutionException.class)
```

## Final states

The audit log may contain multiple entries per change (e.g., `STARTED` then `APPLIED`). Validators filter out intermediate states and only consider final outcomes:

| State | Meaning |
|-------|---------|
| `APPLIED` | Change successfully applied |
| `FAILED` | Change execution failed |
| `ROLLED_BACK` | Change was rolled back after failure |
| `ROLLBACK_FAILED` | Rollback itself failed |


## Complete example

```java
import static io.flamingock.support.domain.AuditEntryDefinition.*;

@Test
void shouldHandlePartialFailureWithRollback() {
    FlamingockTestSupport
        .givenBuilder(builder)
        .andExistingAudit(
            APPLIED(InitialSetupChange.class)  // Already applied in previous run
        )
        .whenRun()
        .thenExpectException(PipelineExecutionException.class, ex -> {
            assertThat(ex.getMessage()).contains("Intentional failure");
        })
        .andExpectAuditFinalStateSequence(
            APPLIED(InitialSetupChange.class),  // Unchanged from precondition
            APPLIED(SuccessfulChange.class),    // New change succeeded
            FAILED(FailingChange.class),        // This change failed
            ROLLED_BACK(FailingChange.class)    // And was rolled back
        )
        .verify();
}
```
