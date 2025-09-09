---
title: Integration Testing
sidebar_position: 3
---

## Introduction

Integration tests ensure that Flamingock operates correctly in a real environment by executing changes against live systems — such as databases, cloud APIs, or internal services. 

These tests involve spinning up the actual backend system and running Flamingock end-to-end:

- Change unit execution
- Audit log persistence
- Distributed lock acquisition

Integration tests should be used to validate that the full pipeline behaves as expected — from execution to rollback.


## Example: Creating an S3 bucket

Suppose you have a change unit that creates an Amazon S3 bucket:

```java
@Change(id = "create-bucket", order = "0001", author = "dev-team")
public class _0001_CreateS3BucketChange {

  @Execution
  public void execute(S3Client s3Client) {
    s3Client.createBucket(CreateBucketRequest.builder()
        .bucket("flamingock-test-bucket")
        .build());
  }

  @RollbackExecution
  public void rollback(S3Client s3Client) {
    s3Client.deleteBucket(DeleteBucketRequest.builder()
        .bucket("flamingock-test-bucket")
        .build());
  }
}
```


## Integration test with Testcontainers

To test this change end-to-end, we will:

1. Spin up a **MongoDB container** to be used as Flamingock’s audit backend
2. Inject a real **S3 client** (mocked, localstack, or real AWS)
3. Configure Flamingock and execute it

```java
class IntegrationTest {

    static final MongoDBContainer mongoContainer = new MongoDBContainer("mongo:6.0");

    @BeforeAll
    static void initMongo() {
        mongoContainer.start();
    }

    @AfterAll
    static void tearDown() {
        mongoContainer.stop();
    }

    @Test
    void shouldExecuteChangeAgainstS3AndAuditToMongo() {
        S3Client s3Client = S3Client.builder()
                .region(Region.EU_WEST_1)
                .build();

        MongoClient mongoClient = MongoClients.create(mongoContainer.getReplicaSetUrl());

        Runner runner = Flamingock.builder()
                .addDependency(s3Client)
                .addDependency(mongoClient)
                .setProperty("mongodb.databaseName", "test-db")
                .build();

        runner.execute();

        // ✅ Verify the S3 bucket was created
        ListBucketsResponse buckets = s3Client.listBuckets();
        boolean bucketExists = buckets.buckets().stream()
                .anyMatch(b -> b.name().equals("flamingock-test-bucket"));
        assertTrue(bucketExists, "Expected S3 bucket was not found");

        // ✅ Verify the change was audited in MongoDB
        MongoDatabase db = mongoClient.getDatabase("test-db");
        MongoCollection<Document> auditCollection = db.getCollection("flamingockAuditLogs");

        Document document = new Document("changeId", "create-bucket")
                .append("state","EXECUTED");
        Document auditEntry = auditCollection.find(document).first();
        assertNotNull(auditEntry, "Flamingock audit log entry was not found in MongoDB");
    }

}
```


## ✅ Best practices

- Use Testcontainers to spin up a real audit backend (e.g., MongoDB) — this avoids the need for manual test setup
- Run Flamingock fully using `.build().execute()` — don’t call internal methods manually
- Clean up the backend between tests or isolate data with unique test identifiers
- Validate changes by checking the actual target system or using custom assertions
- Use integration tests sparingly — unit tests are faster and should cover most logic
