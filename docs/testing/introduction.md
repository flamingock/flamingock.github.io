---
title: Testing Flamingock
sidebar_position: 1
---

## Testing Flamingock

This section provides guidance on how to test applications that use **Flamingock**, including strategies for validating your change logic, ensuring proper execution coordination, and maintaining audit and rollback guarantees.

Whether you are running Flamingock in a local development environment, as part of CI pipelines, or through framework integrations like Spring Boot, testing is a key part of ensuring consistency and reliability across deployments.

Flamingock is not limited to database systems — it supports a wide range of targets (e.g., message brokers, file systems, APIs). Your testing strategy should reflect the behavior of the underlying systems you integrate with.

---

## What to test

There are **three primary levels** at which Flamingock-related functionality can be tested:

### 1. Unit test: Change logic
Isolate and test the logic inside your `@Execution` and `@RollbackExecution` methods without involving Flamingock’s runtime or audit mechanism.

- Use mocks for dependencies (e.g., `MongoTemplate`, `DynamoDbClient`, `S3Client`)
- Focus on business correctness and expected side effects
- No audit logs or locking are involved

👉 See [Unit testing your change units](./unit-test.md)

---

### 2. Integration test: Flamingock execution
Run Flamingock end-to-end in a controlled environment to verify:

- Execution of the `@Execution` method
- Audit log persistence
- Rollback behavior on failure

This usually requires a real or containerized backend system (e.g., using **Testcontainers**).

👉 See [Integration testing Flamingock](./integration-test.md)

---

### 3. Spring Boot integration
For applications using **Spring Boot**, test how Flamingock integrates with your app lifecycle:

- Use `@SpringBootTest` to validate full configuration
- Confirm that changes run on startup
- Optionally inject mocks to verify execution paths

👉 See [Testing with Spring Boot](./spring-boot.md)
