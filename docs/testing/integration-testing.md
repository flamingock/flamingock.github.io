---
title: Integration Testing
sidebar_position: 3
---

## Introduction

Integration tests ensure that Flamingock operates correctly in a real environment by executing Changes against live systems. Flamingock uses a **dual-system** that separates:

- **Target systems**: Where business changes are applied (databases, APIs, cloud services)
- **Audit stores**: Where execution tracking and metadata are persisted (separate from target systems)

Integration tests should validate the complete pipeline:

- Change execution against target systems
- Audit log persistence in audit stores
- Distributed lock acquisition
- Recovery and rollback capabilities


## Example: Creating an S3 bucket

Suppose you have a Change that creates an Amazon S3 bucket (target system) while using MongoDB as the audit store:

```java
@TargetSystem(id = "aws-s3")
@Change(id = "create-bucket", author = "dev-team")
public class _0001__CreateS3Bucket {

  @Apply
  public void apply(S3Client s3Client) {
    s3Client.createBucket(CreateBucketRequest.builder()
        .bucket("flamingock-test-bucket")
        .build());
  }

  @Rollback
  public void rollback(S3Client s3Client) {
    s3Client.deleteBucket(DeleteBucketRequest.builder()
        .bucket("flamingock-test-bucket")
        .build());
  }
}
```


## Integration test with Testcontainers

To test this change end-to-end, we will:

1. Spin up a MongoDB container to be used as Flamingock’s audit backend
2. Using **S3 as the target system** (where business changes are applied)
3. Using **MongoDB as the audit store** (where execution metadata is tracked)
4. Configure Flamingock and execute it
5. Validating both systems independently

```java
@Testcontainers
class FlamingockIntegrationTest {

    @Container
    static final MongoDBContainer mongoContainer = new MongoDBContainer("mongo:6.0");

    @Container
    static final LocalStackContainer localstack = new LocalStackContainer(DockerImageName.parse("localstack/localstack:latest"))
            .withServices(LocalStackContainer.Service.S3);

    @Test
    void shouldExecuteChangeAgainstTargetSystemAndAuditToStore() {
        // Configure S3 client (target system)
        S3Client s3Client = S3Client.builder()
                .endpointOverride(localstack.getEndpointOverride(LocalStackContainer.Service.S3))
                .credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(localstack.getAccessKey(), localstack.getSecretKey())))
                .region(Region.US_EAST_1)
                .build();

        // Configure MongoDB client
        MongoClient mongoClient = MongoClients.create(mongoContainer.getReplicaSetUrl());

        // Configure target systems
        var s3TargetSystem = new NonTransactionalTargetSystem("aws-s3")
                .addDependency(s3Client);

        // Configure Flamingock with target system and audit store
        Runner runner = Flamingock.builder()
                .setAuditStore(new MongoDBSyncAuditStore(mongoClient, 'flamingock-test-db'))
                .addTargetSystem(s3TargetSystem)
                .build();

        // Execute Flamingock
        runner.execute();

        // ✅ Verify the target system (S3) received the change
        ListBucketsResponse buckets = s3Client.listBuckets();
        boolean bucketExists = buckets.buckets().stream()
                .anyMatch(b -> b.name().equals("flamingock-test-bucket"));
        assertTrue(bucketExists, "Expected S3 bucket was not created in target system");

        // ✅ Verify the audit store (MongoDB) tracked the execution
        MongoCollection<Document> auditCollection = auditDatabase.getCollection("flamingockAuditLog");

        Document auditEntry = auditCollection.find(
            new Document("changeId", "create-bucket")
                .append("state", "EXECUTED")
        ).first();
        
        assertNotNull(auditEntry, "Change execution was not tracked in audit store");
        assertEquals("create-bucket", auditEntry.getString("changeId"));
        assertEquals("EXECUTED", auditEntry.getString("state"));
    }
}
```


## ✅ Best practices

- **Use @TargetSystem annotation**: Always annotate Changes with their target system identifier
- **Separate concerns**: Test target system changes and audit store persistence independently
- **Use real containers**: Testcontainers provides realistic test environments for both target systems and audit stores
- **Test failure scenarios**: Verify that audit integrity is maintained even when target systems fail
- **Validate dual-architecture**: Ensure changes reach target systems and tracking reaches audit stores
- **Clean up properly**: Reset both target systems and audit stores between tests
- **Use appropriate audit stores**: Choose audit stores based on your operational requirements, not target system constraints
- **Test recovery**: Verify that Flamingock can recover and continue from audit store state when target systems are restored
