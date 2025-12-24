---
title: Spring Boot testing
sidebar_position: 4
---

## Introduction

For Spring Boot applications, Flamingock provides dedicated test support that integrates with the Spring test framework. The `flamingock-springboot-test-support` module offers a seamless testing experience with automatic context configuration and the same BDD-style API.

## Setup

Add the Spring Boot test support dependency:

```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-springboot-test-support</artifactId>
    <version>${flamingock.version}</version>
    <scope>test</scope>
</dependency>
```

## Core components

### @FlamingockSpringBootTest

This annotation configures the Spring test context for Flamingock testing:

```java
@FlamingockSpringBootTest(classes = {MyApplication.class, TestConfiguration.class})
class MyFlamingockTest {
    // ...
}
```

The annotation automatically sets `flamingock.management-mode=DEFERRED`, which means:
- Flamingock does **not** auto-run on application startup
- Tests control when execution happens via `verify()`
- The builder bean is available for injection, but the runner bean is **not** created

### FlamingockSpringBootTestSupport

An autowirable bean that provides access to the BDD test flow:

```java
@Autowired
private FlamingockSpringBootTestSupport testSupport;

@Test
void shouldExecuteChanges() {
    testSupport
        .givenBuilderFromContext()  // Uses the builder auto-configured by Spring Boot
        .whenRun()
        .thenExpectAuditFinalStateSequence(APPLIED(MyChange.class))
        .verify();
}
```

:::info Prototype scope
`FlamingockSpringBootTestSupport` has **prototype scope** — a new instance is created for each injection. This is necessary because the underlying stages accumulate state and cannot be reused between tests.
:::


## BDD test flow

The Spring Boot test support uses the same BDD pattern as the standalone module:

1. **Given** (`givenBuilderFromContext()`): Get the builder configured by Spring Boot
2. **When** (`whenRun()`): Trigger execution
3. **Then** (`thenExpectAuditFinalStateSequence()`): Define expectations
4. **Verify** (`verify()`): Execute and validate

### Using givenBuilderFromContext()

This method retrieves the Flamingock builder that was auto-configured by Spring Boot based on your application properties:

```java
testSupport
    .givenBuilderFromContext()  // Gets the Spring-configured builder
    .andExistingAudit(
        APPLIED(PreviousChange.class)
    )
    .whenRun()
    .thenExpectAuditFinalStateSequence(
        APPLIED(PreviousChange.class)  // Unchanged
    )
    .verify();
```


## Complete examples

### Basic test

```java
import io.flamingock.springboot.testsupport.FlamingockSpringBootTest;
import io.flamingock.springboot.testsupport.FlamingockSpringBootTestSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static io.flamingock.support.domain.AuditEntryDefinition.APPLIED;

@ExtendWith(SpringExtension.class)  // Required for Spring Boot 2.0.x
@FlamingockSpringBootTest(classes = {MyApplication.class, TestConfiguration.class})
class SpringBootFlamingockTest {

    @Autowired
    private FlamingockSpringBootTestSupport testSupport;

    @Test
    void shouldExecuteChanges() {
        testSupport
            .givenBuilderFromContext()
            .whenRun()
            .thenExpectAuditFinalStateSequence(
                APPLIED(CreateUsersTableChange.class),
                APPLIED(SeedInitialDataChange.class)
            )
            .verify();
    }
}
```

:::tip Spring Boot 2.1+
For Spring Boot 2.1.0 and later, `@ExtendWith(SpringExtension.class)` is not required — it's automatically included.
:::

### Testing with existing audit state

```java
@Test
void shouldSkipAlreadyAppliedChanges() {
    testSupport
        .givenBuilderFromContext()
        .andExistingAudit(
            APPLIED(CreateUsersTableChange.class)  // Simulate already applied
        )
        .whenRun()
        .thenExpectAuditFinalStateSequence(
            APPLIED(CreateUsersTableChange.class)  // Should be unchanged
        )
        .verify();
}
```

### Testing exception handling

```java
@Test
void shouldHandleFailureAndRollback() {
    testSupport
        .givenBuilderFromContext()
        .whenRun()
        .thenExpectException(PipelineExecutionException.class, ex -> {
            assertTrue(ex.getMessage().contains("Expected error"));
        })
        .andExpectAuditFinalStateSequence(
            FAILED(FailingChange.class),
            ROLLED_BACK(FailingChange.class)
        )
        .verify();
}
```


## Key concepts

### Deferred management mode

When using `@FlamingockSpringBootTest`, Flamingock is configured with `management-mode=DEFERRED`. This prevents automatic execution on startup and gives your tests full control over when changes are applied.

### Lazy execution

Like the standalone module, all BDD methods are intermediate operations. Nothing executes until `verify()` is called:

```java
// This does NOT execute anything yet:
testSupport.givenBuilderFromContext()
    .andExistingAudit(APPLIED(PreviousChange.class))
    .whenRun()
    .thenExpectAuditFinalStateSequence(APPLIED(NewChange.class))

// Execution happens HERE:
    .verify();
```

### AuditEntryDefinition

The same `AuditEntryDefinition` factory methods are available:

**String-based:**
```java
APPLIED("change-id")
FAILED("change-id")
ROLLED_BACK("change-id")
ROLLBACK_FAILED("change-id")
```

**Class-based** (recommended — auto-extracts metadata):
```java
APPLIED(MyChange.class)
FAILED(MyChange.class)
ROLLED_BACK(MyChange.class)
ROLLBACK_FAILED(MyChange.class)
```

**With additional fields:**
```java
APPLIED(MyChange.class)
    .withAuthor("custom-author")
    .withTargetSystemId("mongodb-main")
```


## Best practices

- **Use `@FlamingockSpringBootTest`** instead of `@SpringBootTest` to get automatic DEFERRED mode configuration
- **Use class-based `AuditEntryDefinition`** when possible — it validates more fields and catches annotation misconfigurations
- **Keep test classes focused** — each test class should test a specific aspect of your change execution
- **Use `andExistingAudit()`** to test idempotency and re-run scenarios
- **Test failure scenarios** — verify that rollback behavior works correctly in your Spring context
- **Leverage Spring's test slicing** — use `@FlamingockSpringBootTest` with specific configuration classes to load only what you need
