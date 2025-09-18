---
title: Unit Testing
sidebar_position: 2
---

## Introduction

Unit tests focus on verifying the internal logic of a **single change unit**, without relying on any external system.  
They are fast, isolated, and ideal for validating:

- That the `@Apply` method performs the correct logic
- That the `@Rollback` method compensates properly on failure
- That injected dependencies are used as expected (using mocks or fakes)

Unit tests are most useful when your change unit contains business logic, computation, validation, or decisions.


## Example: Creating an S3 bucket

Suppose you have a change unit that creates an Amazon S3 bucket:

```java
@Change(id = "create-bucket", order = "0001", author = "dev-team")
public class _0001_CreateS3BucketChange {

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


## Writing a unit test

To unit test this class, we use JUnit and a mocking library (e.g., Mockito).  
We'll mock the `S3Client` and verify the correct calls were made.

```java
class _0001_CreateS3BucketChangeTest {

  private final S3Client s3Client = mock(S3Client.class);
  private final CreateS3BucketChange change = new CreateS3BucketChange();

  @Test
  void shouldCallCreateBucketOnExecution() {
    var s3Client = mock(S3Client.class);
    new _0001_CreateS3BucketChange().apply(s3Client);

    verify(s3Client).createBucket(argThat(req ->
        req.bucket().equals("flamingock-test-bucket")));
  }

  @Test
  void shouldCallDeleteBucketOnRollback() {
    var s3Client = mock(S3Client.class);
    new _0001_CreateS3BucketChange().rollback(s3Client);
    
    verify(s3Client).deleteBucket(argThat(req ->
        req.bucket().equals("flamingock-test-bucket")));
  }
}
```


## ✅ Best practices

- Use mocks or fakes to isolate the dependencies used in your change unit
- Focus only on the logic inside the `@Apply` and `@Rollback` methods
- Keep assertions specific and minimal — check that the right dependencies are called
- Avoid testing Flamingock itself (e.g., locking or audit behavior — that’s handled in integration tests)
- Use descriptive test names like `shouldCallCreateBucketOnExecution()` for readability  
