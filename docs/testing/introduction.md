---
title: Testing Flamingock
sidebar_position: 1
---

## Introduction

This section provides guidance on how to test applications that use **Flamingock**, including strategies for validating your change logic, ensuring proper execution coordination, and maintaining audit and rollback guarantees.

Whether you are running Flamingock in a local development environment, as part of CI pipelines, or through framework integrations like Spring Boot, testing is a key part of ensuring consistency and reliability across deployments.

Flamingock is not limited to database systems — it supports a wide range of targets (e.g., message brokers, file systems, APIs). Your testing strategy should reflect the behavior of the underlying systems you integrate with.


## Test support framework

Flamingock provides a **BDD-style test support framework** that simplifies integration testing with a fluent Given-When-Then API. The framework is available in two modules:

| Module | Use case |
|--------|----------|
| `flamingock-test-support` | Standalone/programmatic tests without Spring |
| `flamingock-springboot-test-support` | Spring Boot integration tests |

Both modules share the same BDD API for defining expectations and validating results. See [BDD test API](./flamingock-bdd-api.md) for the complete API reference.


## What to test

There are **three primary levels** at which Flamingock-related functionality can be tested:

### 1. Unit test: Change logic
Isolate and test the logic inside your `@Apply` and `@Rollback` methods without involving Flamingock's runtime or audit mechanism.

- Use mocks for dependencies (e.g., `MongoTemplate`, `DynamoDbClient`, `S3Client`)
- Focus on business correctness and expected side effects
- No audit logs or locking are involved

See [Unit testing your change units](./unit-testing.md)


### 2. Integration test: Flamingock execution
Run Flamingock end-to-end using the test support framework to verify:

- Execution of changes and audit log persistence
- Rollback behavior on failure
- Correct handling of previously applied changes
- Use `FlamingockTestSupport`
- Validate changes using the Flamingock BDD API

See [Integration testing Flamingock](./integration-testing.md)


### 3. Spring Boot integration
For applications using **Spring Boot**, test how Flamingock integrates with your app lifecycle:

- Use `@FlamingockSpringBootTest` to configure test context with deferred execution
- Use autowired `FlamingockSpringBootTestSupport` to control when Flamingock runs
- Validate changes using the Flamingock BDD API

See [Testing with Spring Boot](./springboot-integration-testing.md)
