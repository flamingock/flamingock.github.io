---
title: Integration testing
sidebar_position: 3
---

## Introduction

Integration tests verify that Flamingock executes changes correctly and maintains proper audit state. The `flamingock-test-support` module provides a BDD-style API for writing expressive, maintainable integration tests.

## Setup

Add the test support dependency:

```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-test-support</artifactId>
    <version>${flamingock.version}</version>
    <scope>test</scope>
</dependency>
```

## Core components

### FlamingockTestSupport

The entry point for all integration tests. Provides a fluent API following the Given-When-Then pattern:

```java
FlamingockTestSupport
    .givenBuilder(builder)      // Given: configure the builder
    .andExistingAudit(...)      // Given: set up existing audit state
    .whenRun()                  // When: trigger execution
    .thenExpectAuditFinalStateSequence(...)  // Then: define expectations
    .verify();                  // Execute and validate
```

### InMemoryTestKit

Provides an in-memory audit store for fast, isolated tests without external dependencies:

```java
InMemoryTestKit testKit = InMemoryTestKit.create();

try {
    FlamingockTestSupport
        .givenBuilder(testKit.createBuilder().addTargetSystem(targetSystem))
        .whenRun()
        .thenExpectAuditFinalStateSequence(APPLIED(MyChange.class))
        .verify();
} finally {
    testKit.cleanUp();
}
```

### AuditEntryDefinition

Factory methods to define expected audit entries. Two approaches are available:

**String-based** (manual):
```java
AuditEntryDefinition.APPLIED("change-id")
AuditEntryDefinition.FAILED("change-id")
AuditEntryDefinition.ROLLED_BACK("change-id")
AuditEntryDefinition.ROLLBACK_FAILED("change-id")
```

**Class-based** (auto-extracts metadata from annotations):
```java
AuditEntryDefinition.APPLIED(MyChange.class)
AuditEntryDefinition.FAILED(MyChange.class)
AuditEntryDefinition.ROLLED_BACK(MyChange.class)
AuditEntryDefinition.ROLLBACK_FAILED(MyChange.class)
```

The class-based approach automatically extracts `changeId`, `author`, `className`, `methodName`, `targetSystemId`, `order`, and `transactional` from your change annotations.

**Fluent builder** for additional fields:
```java
APPLIED(MyChange.class)
    .withAuthor("custom-author")
    .withTargetSystemId("mongodb-main")
    .withErrorTrace("Expected error message")
    .withTransactional(true)
    .withOrder("001")
```


## BDD stages

### GivenStage

Set up preconditions before execution:

```java
FlamingockTestSupport
    .givenBuilder(testKit.createBuilder().addTargetSystem(targetSystem))
    .andExistingAudit(
        APPLIED(PreviousChange1.class),
        APPLIED(PreviousChange2.class)
    )
    .whenRun()
    // ...
```

Use `andExistingAudit()` to simulate changes that were already applied in previous runs.

### WhenStage

Trigger execution and define initial expectations:

```java
.whenRun()
.thenExpectAuditFinalStateSequence(
    APPLIED(Change1.class),
    APPLIED(Change2.class)
)
```

Or expect an exception:
```java
.whenRun()
.thenExpectException(PipelineExecutionException.class, ex -> {
    assertTrue(ex.getMessage().contains("Expected error"));
})
```

### ThenStage

Chain additional expectations:

```java
.thenExpectException(PipelineExecutionException.class, null)
.andExpectAuditFinalStateSequence(
    FAILED(FailingChange.class),
    ROLLED_BACK(FailingChange.class)
)
.verify()
```


## Key concepts

### Lazy execution

All BDD methods are **intermediate operations**. Nothing executes until `verify()` is called:

```java
// This does NOT execute anything yet:
testSupport.givenBuilder(builder)
    .andExistingAudit(APPLIED(PreviousChange.class))
    .whenRun()
    .thenExpectAuditFinalStateSequence(APPLIED(NewChange.class))

// Execution happens HERE:
    .verify();
```

### Selective field validation

The validator only checks fields that are **set** in the definition:
- `APPLIED("my-change")` validates only `changeId` and `state`
- `APPLIED(MyChange.class)` validates `changeId`, `state`, `author`, `className`, `methodName`, `targetSystemId`, `order`, `transactional`
- `.withXxx()` methods add additional fields to validate

### Final states only

The audit log may contain multiple entries per change (e.g., `STARTED` then `APPLIED`). The validator filters out intermediate states and only validates final outcomes:

| State | Meaning |
|-------|---------|
| `APPLIED` | Change successfully applied |
| `FAILED` | Change execution failed |
| `ROLLED_BACK` | Change was rolled back after failure |
| `ROLLBACK_FAILED` | Rollback itself failed |

### Exact count matching

`thenExpectAuditFinalStateSequence()` requires an **exact count match** — if 3 changes executed, you must provide exactly 3 definitions. Order is preserved: expected[0] must match actual[0], etc.


## Complete examples

### Basic success scenario

```java
import io.flamingock.core.kit.inmemory.InMemoryTestKit;
import io.flamingock.support.FlamingockTestSupport;
import io.flamingock.targetsystem.nontransactional.NonTransactionalTargetSystem;
import org.junit.jupiter.api.Test;

import static io.flamingock.support.domain.AuditEntryDefinition.*;

class BasicIntegrationTest {

    @Test
    void shouldExecuteChangesSuccessfully() {
        InMemoryTestKit testKit = InMemoryTestKit.create();

        try {
            NonTransactionalTargetSystem targetSystem = new NonTransactionalTargetSystem("kafka");

            FlamingockTestSupport
                .givenBuilder(testKit.createBuilder().addTargetSystem(targetSystem))
                .whenRun()
                .thenExpectAuditFinalStateSequence(
                    APPLIED(CreateTopicsChange.class),
                    APPLIED(SetupConsumerGroupsChange.class)
                )
                .verify();
        } finally {
            testKit.cleanUp();
        }
    }
}
```

### Testing with existing audit state

```java
@Test
void shouldSkipAlreadyAppliedChanges() {
    InMemoryTestKit testKit = InMemoryTestKit.create();

    try {
        FlamingockTestSupport
            .givenBuilder(testKit.createBuilder()
                .addTargetSystem(new NonTransactionalTargetSystem("mongodb")))
            .andExistingAudit(
                APPLIED(CreateTopicsChange.class)  // Simulate already applied
            )
            .whenRun()
            .thenExpectAuditFinalStateSequence(
                APPLIED(CreateTopicsChange.class)  // Should be unchanged
            )
            .verify();
    } finally {
        testKit.cleanUp();
    }
}
```

### Testing failure and rollback

```java
@Test
void shouldHandleFailureAndRollback() {
    InMemoryTestKit testKit = InMemoryTestKit.create();

    try {
        FlamingockTestSupport
            .givenBuilder(testKit.createBuilder()
                .addTargetSystem(new NonTransactionalTargetSystem("elasticsearch")))
            .whenRun()
            .thenExpectException(PipelineExecutionException.class, ex -> {
                assertTrue(ex.getMessage().contains("Intentional failure"));
            })
            .andExpectAuditFinalStateSequence(
                FAILED(FailingChange.class),
                ROLLED_BACK(FailingChange.class)
            )
            .verify();
    } finally {
        testKit.cleanUp();
    }
}
```


## Best practices

- **Use `InMemoryTestKit`** for fast, isolated tests without external dependencies
- **Use class-based `AuditEntryDefinition`** when possible — it validates more fields and catches annotation misconfigurations
- **Always call `testKit.cleanUp()`** in a finally block to reset state between tests
- **Test failure scenarios** — verify that rollback behavior works correctly
- **Test idempotency** — use `andExistingAudit()` to simulate re-runs and verify changes are skipped appropriately
- **Keep assertions focused** — validate what's important for each test case using selective field validation
