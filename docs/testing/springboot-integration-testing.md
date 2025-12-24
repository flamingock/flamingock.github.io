---
title: Spring Boot testing
sidebar_position: 4
---

## Introduction

For Spring Boot applications, Flamingock provides dedicated test support that integrates with the Spring test framework. The `flamingock-springboot-test-support` module uses the same BDD API as the standalone module, but with Spring-specific components for easier integration.

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

## @FlamingockSpringBootTest

This annotation is a composed annotation that includes `@SpringBootTest` with the property `flamingock.management-mode=DEFERRED` pre-configured:

```java
@FlamingockSpringBootTest
class MyFlamingockTest {
    // ...
}
```

This is equivalent to:

```java
@SpringBootTest(properties = "flamingock.management-mode=DEFERRED")
class MyFlamingockTest {
    // ...
}
```

The `DEFERRED` management mode means:
- Flamingock does **not** auto-run on application startup
- Tests control when execution happens via `verify()`
- The builder bean is available for injection, but the runner bean is **not** created

The annotation also exposes common `@SpringBootTest` attributes like `classes` and `webEnvironment`:

```java
@FlamingockSpringBootTest(
    classes = {MyApplication.class, TestConfig.class},
    webEnvironment = SpringBootTest.WebEnvironment.NONE
)
class MyFlamingockTest {
    // ...
}
```

## FlamingockSpringBootTestSupport

An autowirable bean that provides access to the BDD test flow:

```java
@Autowired
private FlamingockSpringBootTestSupport testSupport;
```

### givenBuilderFromContext()

This method retrieves the Flamingock builder that was auto-configured by Spring Boot based on your application properties:

```java
testSupport
    .givenBuilderFromContext()  // Gets the Spring-configured builder
    .andExistingAudit(...)      // Optional: set up existing audit state
    .whenRun()                  // Trigger execution
    .thenExpectAuditFinalStateSequence(...)  // Define expectations
    .verify();                  // Execute and validate
```

See [BDD test API](./flamingock-bdd-api.md) for details on `andExistingAudit()`, validators, and `AuditEntryDefinition`.

:::info Prototype scope
`FlamingockSpringBootTestSupport` has **prototype scope** — a new instance is created for each injection. This is necessary because the underlying stages accumulate state and cannot be reused between tests.
:::


## Complete example

```java
//other imports
import io.flamingock.springboot.testsupport.FlamingockSpringBootTest;
import io.flamingock.springboot.testsupport.FlamingockSpringBootTestSupport;

import static io.flamingock.support.domain.AuditEntryDefinition.*;

@ExtendWith(SpringExtension.class)  // Required for Spring Boot 2.0.x. For Spring Boot > 2.1.x, can be omitted
@FlamingockSpringBootTest
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

    @Test
    void shouldSkipAlreadyAppliedChanges() {
        testSupport
            .givenBuilderFromContext()
            .andExistingAudit(
                APPLIED(CreateUsersTableChange.class)  // Simulate already applied
            )
            .whenRun()
            .thenExpectAuditFinalStateSequence(
                APPLIED(CreateUsersTableChange.class)  // Should remain unchanged
            )
            .verify();
    }

    @Test
    void shouldHandleFailureWithRollback() {
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
}
```

:::tip Spring Boot 2.1+
For Spring Boot 2.1.0 and later, `@ExtendWith(SpringExtension.class)` is not required — it's automatically included.
:::


## Best practices

- **Use `@FlamingockSpringBootTest`** instead of `@SpringBootTest` to get automatic DEFERRED mode configuration
- **Use class-based `AuditEntryDefinition`** when possible — it validates more fields and catches annotation misconfigurations
- **Keep test classes focused** — each test class should test a specific aspect of your change execution
- **Use `andExistingAudit()`** to test idempotency and re-run scenarios
- **Test failure scenarios** — verify that rollback behavior works correctly in your Spring context
- **Leverage Spring's test slicing** — use `@FlamingockSpringBootTest` with specific configuration classes to load only what you need
