---
title: Integration testing
sidebar_position: 3
---

## Introduction

Integration tests verify that Flamingock executes changes correctly against real systems. The `flamingock-test-support` module provides a BDD-style API for writing expressive, maintainable integration tests.

The recommended approach is to use your **production Flamingock builder** with containerized backends (via Testcontainers), ensuring your tests match real-world behavior.

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

## FlamingockTestSupport

The entry point for standalone integration tests. Use `givenBuilder()` to pass your configured Flamingock builder:

```java
FlamingockTestSupport
    .givenBuilder(builder)      // Your production builder
    .andExistingAudit(...)      // Optional: set up existing audit state
    .whenRun()                  // Trigger execution
    .thenExpectAuditFinalStateSequence(...)  // Define expectations
    .verify();                  // Execute and validate
```

See [BDD test API](./flamingock-bdd-api.md) for details on `andExistingAudit()`, validators, and `AuditEntryDefinition`.


## Alternative: in-memory testing

For faster tests where audit store persistence doesn't matter, you can use the in-memory components:

### InMemoryTestBuilder

Creates a pre-configured builder with an in-memory audit store:

```java
import io.flamingock.support.InMemoryTestBuilder;

@Test
void fastTestWithInMemoryAudit() {
    var builder = InMemoryTestBuilder.create()
            .addTargetSystem(new NonTransactionalTargetSystem("kafka").addDependency(kafkaClient))
            .addStage(new Stage("kafka-changes").addCodePackage("com.myapp.changes.kafka"));

    FlamingockTestSupport
            .givenBuilder(builder)
            .whenRun()
            .thenExpectAuditFinalStateSequence(
                    APPLIED(CreateTopicChange.class)
            )
            .verify();
}
```

### InMemoryTestAuditStore

You can also use your production builder configured with all target systems, stages, and dependencies, and just override the audit store. This lets you test with your exact production configuration without needing a real audit store backend:

```java
import io.flamingock.support.InMemoryTestAuditStore;

@Test
void reuseProductionBuilderWithInMemoryAudit() {
    // Retrieve your production builder (already configured with target systems, stages, etc.)
    var builder = MyAppFlamingockConfig.createBuilder();

    // Override only the audit store for testing
    builder.setAuditStore(new InMemoryTestAuditStore());

    FlamingockTestSupport
            .givenBuilder(builder)
            .whenRun()
            .thenExpectAuditFinalStateSequence(
                    APPLIED(MyChange.class)
            )
            .verify();
}
```

:::tip When to use in-memory
Use in-memory components when:
- You want faster test execution
- The audit store behavior is not relevant to the test
- You're testing target system interactions only

Use Testcontainers when:
- You need to verify audit persistence behavior
- You want tests that match production exactly
- You're testing recovery or idempotency scenarios
:::

## Complete example with Testcontainers

This example tests a change that creates an S3 bucket, using MongoDB as the audit store:

```java
//other imports
import io.flamingock.core.Flamingock;
import io.flamingock.support.FlamingockTestSupport;
import io.flamingock.targetsystem.nontransactional.NonTransactionalTargetSystem;
import static io.flamingock.support.domain.AuditEntryDefinition.*;

@Testcontainers
class S3IntegrationTest {

    @Container
    static final MongoDBContainer mongoContainer = new MongoDBContainer("mongo:6.0");

    @Container
    static final LocalStackContainer localstack = new LocalStackContainer(
            DockerImageName.parse("localstack/localstack:latest"))
            .withServices(LocalStackContainer.Service.S3);

    private S3Client s3Client;
    private MongoClient mongoClient;

    @BeforeAll
    void setup() {
        // Configure S3 client (target system)
        s3Client = S3Client.builder()
                .endpointOverride(localstack.getEndpointOverride(LocalStackContainer.Service.S3))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                localstack.getAccessKey(),
                                localstack.getSecretKey())))
                .region(Region.US_EAST_1)
                .build();

        // Configure MongoDB client (audit store)
        mongoClient = MongoClients.create(mongoContainer.getReplicaSetUrl());
    }

    @Test
    void shouldExecuteS3BucketCreation() {
        // Configure target system with S3 client as dependency
        NonTransactionalTargetSystem s3TargetSystem = new NonTransactionalTargetSystem("aws-s3")
                .addDependency(s3Client);

        // Build Flamingock with production configuration
        var builder = Flamingock.builder()
                .setAuditStore(new MongoDBSyncAuditStore(mongoClient, "flamingock-test-db"))
                .addTargetSystem(s3TargetSystem)
                .addStage(new Stage("s3-changes").addCodePackage("com.myapp.changes.s3"));

        // Test using BDD API
        FlamingockTestSupport
                .givenBuilder(builder)
                .whenRun()
                .thenExpectAuditFinalStateSequence(
                        APPLIED(CreateS3BucketChange.class)
                )
                .verify();

        // Optionally verify the actual target system state
        boolean bucketExists = s3Client.listBuckets().buckets().stream()
                .anyMatch(b -> b.name().equals("flamingock-test-bucket"));
        assertTrue(bucketExists, "S3 bucket was not created");
    }

    @Test
    void shouldSkipAlreadyAppliedChanges() {
        var builder = Flamingock.builder()
                .setAuditStore(new MongoDBSyncAuditStore(mongoClient, "flamingock-test-db"))
                .addTargetSystem(new NonTransactionalTargetSystem("aws-s3").addDependency(s3Client))
                .addStage(new Stage("s3-changes").addCodePackage("com.myapp.changes.s3"));

        FlamingockTestSupport
                .givenBuilder(builder)
                .andExistingAudit(
                        APPLIED(CreateS3BucketChange.class)  // Simulate already applied
                )
                .whenRun()
                .thenExpectAuditFinalStateSequence(
                        APPLIED(CreateS3BucketChange.class)  // Should remain unchanged
                )
                .verify();
    }

    @Test
    void shouldHandleFailureWithRollback() {
        var builder = Flamingock.builder()
                .setAuditStore(new MongoDBSyncAuditStore(mongoClient, "flamingock-test-db"))
                .addTargetSystem(new NonTransactionalTargetSystem("aws-s3").addDependency(s3Client))
                .addStage(new Stage("failing-changes").addCodePackage("com.myapp.changes.failing"));

        FlamingockTestSupport
                .givenBuilder(builder)
                .whenRun()
                .thenExpectException(PipelineExecutionException.class, ex -> {
                    assertTrue(ex.getMessage().contains("Intentional failure"));
                })
                .andExpectAuditFinalStateSequence(
                        FAILED(FailingChange.class),
                        ROLLED_BACK(FailingChange.class)
                )
                .verify();
    }
}
```


## Best practices

- **Use your production builder** — configure Flamingock the same way you do in production, but point to containerized backends
- **Use Testcontainers** — provides realistic, isolated test environments for both target systems and audit stores
- **Test failure scenarios** — verify that rollback behavior works correctly
- **Test idempotency** — use `andExistingAudit()` to simulate re-runs and verify changes are skipped appropriately
- **Verify target system state** — optionally check that the actual target system received the expected changes


