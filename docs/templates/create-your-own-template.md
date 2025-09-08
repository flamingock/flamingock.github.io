---
sidebar_position: 3
title: Create your template
---

# Create your own Flamingock template


:::caution Beta feature
Templates are available in **beta**.  
- You can already create **custom templates** for your own use cases.  
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.  
- Expect API and behavior changes before GA.  

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of ChangeUnits.
:::

While official Flamingock templates are experimental, you can already build and use your own custom templates in production if needed. This page explains how.

## Introduction

[Flamingock Templates](./templates-introduction.md) allow you to encapsulate common logic and reduce boilerplate when defining change units. This document explains how to create your own templates for reuse across projects or for contribution to the Flamingock community.

---

## Overview of the required components

To create a template, you need:

- A Java class extending `AbstractChangeTemplate<SHARED_CONFIG, EXECUTION, ROLLBACK>`
- An `@Execution` method to perform the main change
- (Optionally) A `@RollbackExecution` method for undo support
- A service loader registration file (`META-INF/services`)
- (Optional) Package and distribute your template

---

## 1. Implement the Template class

Extend `AbstractChangeTemplate<SHARED_CONFIG, EXECUTION, ROLLBACK>` with three generics:

- **SHARED_CONFIG**: Shared configuration that applies to both execution and rollback (e.g., database connection, common settings). Use `Void` if no shared config is needed.
- **EXECUTION**: The type representing the execution logic/data
- **ROLLBACK**: The type representing the rollback logic/data  

**Example:**

```java
public class MongoChangeTemplate extends AbstractChangeTemplate<Void, MongoOperation, MongoOperation> {

    public MongoChangeTemplate() {
        super(MongoOperation.class);
    }

    @Execution
    public void execute(MongoDatabase db, @Nullable ClientSession clientSession) {
        if (this.isTransactional && clientSession == null) {
            throw new IllegalArgumentException(String.format("Transactional changeUnit[%s] requires transactional ecosystem with ClientSession", changeId));
        }
        executeOp(db, execution, clientSession);
    }

    @RollbackExecution
    public void rollback(MongoDatabase db, @Nullable ClientSession clientSession) {
        if (this.isTransactional && clientSession == null) {
            throw new IllegalArgumentException(String.format("Transactional changeUnit[%s] requires transactional ecosystem with ClientSession", changeId));
        }
        executeOp(db, rollback, clientSession);
    }

    private void executeOp(MongoDatabase db, MongoOperation op, ClientSession clientSession) {
        op.getOperator(db).apply(clientSession);
    }
}
```

#### Important notes
- Access your execution and rollback data directly via `this.execution` and `this.rollback` fields.
- Access shared configuration via `this.configuration` field (if using a non-Void shared config type).
- If your template references custom types, make sure to register them for reflection—especially for **GraalVM** native builds. When extending `AbstractChangeTemplate`, you can pass your custom types to the superclass constructor to ensure proper reflection support.

:::note 
See [**2. Define Execution and Rollback methods** ](./create-your-own-template#2-define-execution-and-rollback-methods) section for how to implement the core logic inside your template class using the execution/rollback data and dependency injection
:::

---

## 2. Define Execution and Rollback methods
Each template must include an `@Execution` method, and may optionally include a `@RollbackExecution` method.
These methods define the core logic that will be executed when Flamingock runs the corresponding change.

Inside these methods, it’s expected that you use the data provided by the user in the template-based change unit through the following fields:

- `this.execution` — the execution logic/data to apply during execution
- `this.rollback` — the rollback logic/data to apply during rollback or undo  
- `this.configuration` — shared configuration data (if using a non-Void shared config type)

An example of a template for Kafka topic management:

:::info
This is an illustrative example to demonstrate the template structure. Real Kafka templates would use different parameters and configuration structures based on actual requirements.
:::

```java
public class KafkaTopicTemplate extends AbstractChangeTemplate<Void, TopicConfig, String> {

    public KafkaTopicTemplate() {
        super(TopicConfig.class);
    }

    @Execution
    public void execute(AdminClient adminClient) throws Exception {
        // Create topic using the execution configuration
        NewTopic newTopic = new NewTopic(
            this.execution.getName(),
            this.execution.getPartitions(),
            this.execution.getReplicationFactor()
        );
        newTopic.configs(this.execution.getConfigs());
        
        adminClient.createTopics(List.of(newTopic)).all().get();
    }

    @RollbackExecution
    public void rollback(AdminClient adminClient) throws Exception {
        // Delete topic using the rollback topic name
        adminClient.deleteTopics(List.of(this.rollback)).all().get();
    }
}
```

### Example with Shared Configuration

When you need to share configuration between execution and rollback (such as connection details, common settings, etc.), you can use a non-Void shared configuration type:

:::info
This is an illustrative example to demonstrate the shared configuration pattern. Real S3 templates would use different parameters and configuration structures based on actual AWS SDK requirements.
:::

```java
public class S3BucketTemplate extends AbstractChangeTemplate<S3ConnectionConfig, BucketCreationRequest, String> {

    public S3BucketTemplate() {
        super(S3ConnectionConfig.class, BucketCreationRequest.class);
    }

    @Execution
    public void execute() {
        // Access shared configuration for AWS connection
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(this.configuration.getRegion())
            .withCredentials(this.configuration.getCredentialsProvider())
            .build();
        
        // Create bucket using execution configuration
        CreateBucketRequest request = new CreateBucketRequest(this.execution.getBucketName())
            .withCannedAcl(this.execution.getAcl());
        
        if (this.execution.getEncryption() != null) {
            // Apply encryption settings
            request.withObjectLockEnabledForBucket(this.execution.getEncryption().isEnabled());
        }
        
        s3Client.createBucket(request);
    }

    @RollbackExecution
    public void rollback() {
        // Use the same shared configuration for rollback
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(this.configuration.getRegion())
            .withCredentials(this.configuration.getCredentialsProvider())
            .build();
        
        // Delete bucket using rollback bucket name
        s3Client.deleteBucket(this.rollback);
    }
}
```

This pattern is useful when:
- Both execution and rollback need the same configuration data (AWS credentials, region, etc.)
- You want to avoid duplicating connection details or common settings
- The template needs different data for execution vs rollback operations

### Injecting dependencies into Template methods
Template methods (such as those annotated with `@Execution` and `@RollbackExecution`) support method-level dependency injection using the same mechanism as change units.

Template classes do not support constructor injection.
All dependencies must be injected as parameters in the `@Execution` and `@RollbackExecution` methods.

You can inject any registered dependency as a method parameter:

```java
@Execution
public void execute(MongoDatabase db, ClientService clientService) {
  clientService.doSomething();
}
```
:::info
Flamingock will apply lock-safety guards unless you annotate the parameter with `@NonLockGuarded`.
:::

### Mapping between template-base changeUnit file and template methods

For details on how Flamingock maps the `execution` and `rollback` sections in your declarative change unit to the methods in your template class, refer to the [Template mapping](template-mapping-section.md) documentation.


---

## 3. Register the Template with ServiceLoader

Templates are discovered automatically at runtime using Java’s `ServiceLoader` system.

Steps:
1. Create a file at:

```
src/main/resources/META-INF/services/io.flamingock.core.api.template.ChangeTemplate
```

2. List the fully qualified class names of all templates in the file:

```plaintext
io.flamingock.template.kafka.CreateTopicTemplate
io.flamingock.template.kafka.UpdateTopicConfigTemplate
io.flamingock.template.kafka.DeleteTopicTemplate
```

:::tip 
Group templates by domain or technology for better maintainability.
:::

---

## 4. Package and distribute the Template

Depending on your target:

### Internal Templates (Private)
- No special packaging needed.
- Keep your template class inside your application.

### Public Templates (Contributing to the Community)
- Package your template as a JAR.
- Notify the Flamingock team via [development@flamingock.io](mailto:development@flamingock.io) or GitHub.
- Submit your template for validation.

#### Validation Requirements:
- Clear and justified use case
- Name must align and not conflict with existing templates
- Technically correct and production-grade implementation
- Public classes must be Javadoc-documented
- Submit a Pull Request adding the template's documentation to [flamingock.github.io](https://github.com/flamingock/flamingock.github.io)

---

## ✅ Best Practices

- Use `AbstractChangeTemplate<SHARED_CONFIG, EXECUTION, ROLLBACK>` with the appropriate generic types for your use case.
- Always provide an `@RollbackExecution` method if rollback or undo is expected.
- Use `Void` for generics when that type is not needed (e.g., `<Void, String, String>` for simple SQL templates).
- Use shared configuration (`<ConfigType, Void, Void>`) when both execution and rollback need the same configuration data.
- Document your template's purpose and generic types clearly for users.
- Ensure all custom types are registered for reflection by passing them to the superclass constructor, especially when targeting native builds.
- Group multiple templates by domain when packaging a library.

---
