---
sidebar_position: 4
title: Create your template
---

# Create your own Flamingock template


:::caution Beta feature
Templates are available in **beta**.
- You can already create **custom templates** for your own use cases.
- Flamingock is actively developing **official templates** for key technologies (Kafka, SQL, MongoDB, S3, Redis, etc.) that are currently in development and not yet production-ready.
- Expect API and behavior changes before GA.

This feature is a **sneak peek of Flamingock's future**: a low-code, reusable ecosystem on top of Changes.
:::

While official Flamingock templates are experimental, you can already build and use your own custom templates in production if needed. This page explains how.

## Introduction

[Flamingock Templates](./templates-introduction.md) allow you to encapsulate common logic and reduce boilerplate when defining change units. This document explains how to create your own templates for reuse across projects or for contribution to the Flamingock community.

## Overview of the required components

To create a template, you need:

- A Java class extending `AbstractChangeTemplate<SHARED_CONFIG, EXECUTION, ROLLBACK>`
- An `@Apply` method to perform the main change
- (Optionally) A `@Rollback` method for undo support
- A service loader registration file (`META-INF/services`)
- (Optional) Package and distribute your template

## 1. Implement the Template class

Extend `AbstractChangeTemplate<SHARED_CONFIG, APPLY, ROLLBACK>` with three generics:

- **SHARED_CONFIG**: Shared configuration that applies to both apply and rollback (e.g., database connection, common settings). Use `Void` if no shared config is needed.
- **APPLY**: The type representing the apply logic/data
- **ROLLBACK**: The type representing the rollback logic/data

**Example:**

```java
public class MongoChangeTemplate extends AbstractChangeTemplate<Void, MongoOperation, MongoOperation> {

    public MongoChangeTemplate() {
        super(MongoOperation.class);
    }

    @Apply
    public void apply(MongoDatabase db, @Nullable ClientSession clientSession) {
        validateSession(clientSession);

        if (hasStepsPayload()) {
            // Steps format: execute each step with automatic rollback on failure
            executeStepsWithRollback(db, stepsPayload, clientSession);
        } else if (applyPayload != null) {
            // Legacy simple format
            applyPayload.getOperator(db).apply(clientSession);
        }
    }

    @Rollback
    public void rollback(MongoDatabase db, @Nullable ClientSession clientSession) {
        validateSession(clientSession);

        if (hasStepsPayload()) {
            // Rollback all steps in reverse order
            rollbackAllSteps(db, stepsPayload, clientSession);
        } else if (rollbackPayload != null) {
            // Legacy simple format
            rollbackPayload.getOperator(db).apply(clientSession);
        }
    }

    private void validateSession(ClientSession clientSession) {
        if (this.isTransactional && clientSession == null) {
            throw new IllegalArgumentException(
                String.format("Transactional change[%s] requires ClientSession", changeId));
        }
    }

    private void executeStepsWithRollback(MongoDatabase db,
            List<TemplateStep<MongoOperation, MongoOperation>> steps,
            ClientSession clientSession) {
        List<TemplateStep<MongoOperation, MongoOperation>> completedSteps = new ArrayList<>();

        for (TemplateStep<MongoOperation, MongoOperation> step : steps) {
            try {
                step.getApply().getOperator(db).apply(clientSession);
                completedSteps.add(step);
            } catch (Exception e) {
                // Rollback completed steps in reverse order
                rollbackAllSteps(db, completedSteps, clientSession);
                throw e;
            }
        }
    }

    private void rollbackAllSteps(MongoDatabase db,
            List<TemplateStep<MongoOperation, MongoOperation>> steps,
            ClientSession clientSession) {
        List<TemplateStep<MongoOperation, MongoOperation>> reversed = new ArrayList<>(steps);
        Collections.reverse(reversed);

        for (TemplateStep<MongoOperation, MongoOperation> step : reversed) {
            if (step.hasRollback()) {
                step.getRollback().getOperator(db).apply(clientSession);
            }
        }
    }
}
```

:::note
The `MongoChangeTemplate` supports both the **steps format** (recommended) and the **legacy simple format** for backward compatibility. The `hasStepsPayload()` method checks which format is being used.
:::

#### Important notes

**Accessing payload data:**

- **Steps format (recommended)**: Use `this.stepsPayload` to access the list of `TemplateStep<APPLY, ROLLBACK>` objects. Each step contains an `apply` payload and an optional `rollback` payload.
- **Legacy format**: Access `this.applyPayload` and `this.rollbackPayload` fields directly.
- Use `hasStepsPayload()` to check which format is being used.
- Access shared configuration via `this.configuration` field (if using a non-Void shared config type).

:::warning Deprecation notice
The fields `applyPayload` and `rollbackPayload` are **deprecated** and will be removed in a future release. New templates should use the `stepsPayload` field with `TemplateStep` objects instead. The steps format provides better rollback control with paired apply/rollback operations.
:::

**Reflection support:**

- If your template references custom types, make sure to register them for reflection—especially for **GraalVM** native builds. When extending `AbstractChangeTemplate`, you can pass your custom types to the superclass constructor to ensure proper reflection support.

:::note
See [**2. Define Execution and Rollback methods** ](#2-define-execution-and-rollback-methods) section for how to implement the core logic inside your template class using the apply/rollback data and dependency injection
:::

## 2. Define Execution and Rollback methods
Each template must include an `@Apply` method, and may optionally include a `@Rollback` method.
These methods define the core logic that will be executed when Flamingock runs the corresponding change.

Inside these methods, access the data provided by the user in the template-based change unit through the following fields:

**Steps format (recommended):**
- `this.stepsPayload` — list of `TemplateStep<APPLY, ROLLBACK>` objects, each containing:
  - `step.getApply()` — the apply payload for this step
  - `step.getRollback()` — the rollback payload for this step (may be null)
  - `step.hasRollback()` — check if rollback is defined
- `hasStepsPayload()` — check if the change uses steps format

**Legacy format (deprecated):**
- `this.applyPayload` — the apply logic/data to apply during apply phase
- `this.rollbackPayload` — the rollback logic/data to apply during rollback or undo

**Shared configuration:**
- `this.configuration` — shared configuration data (if using a non-Void shared config type)

### The TemplateStep class

The `TemplateStep<APPLY, ROLLBACK>` class represents a single step in a step-based change. Each step pairs an apply operation with an optional rollback operation:

```java
public class TemplateStep<APPLY, ROLLBACK> {
    public APPLY getApply();           // Required: the apply payload
    public ROLLBACK getRollback();     // Optional: the rollback payload (may be null)
    public boolean hasRollback();      // Check if rollback is defined
}
```

**Rollback behavior in steps format:**
- When a step fails, all previously successful steps should be rolled back in reverse order
- Steps without rollback operations are skipped during rollback
- Rollback errors should be logged but shouldn't stop the rollback process for remaining steps

An example of a template for Kafka topic management:

:::info
This is an illustrative example to demonstrate the template structure. Real Kafka templates would use different parameters and configuration structures based on actual requirements.
:::

```java
public class KafkaTopicTemplate extends AbstractChangeTemplate<Void, TopicConfig, String> {

    public KafkaTopicTemplate() {
        super(TopicConfig.class);
    }

    @Apply
    public void apply(AdminClient adminClient) throws Exception {
        // Create topic using the apply configuration
        var newTopic = new NewTopic(
            this.applyPayload.getName(),
            this.applyPayload.getPartitions(),
            this.applyPayload.getReplicationFactor()
        );
        newTopic.configs(this.applyPayload.getConfigs());

        adminClient.createTopics(List.of(newTopic)).all().get();
    }

    @Rollback
    public void rollback(AdminClient adminClient) throws Exception {
        // Delete topic using the rollback topic name
        adminClient.deleteTopics(List.of(this.rollbackPayload)).all().get();
    }
}
```

### Example with shared configuration

When you need to share configuration between apply and rollback (such as connection details, common settings, etc.), you can use a non-Void shared configuration type:

:::info
This is an illustrative example to demonstrate the shared configuration pattern. Real S3 templates would use different parameters and configuration structures based on actual AWS SDK requirements.
:::

```java
public class S3BucketTemplate extends AbstractChangeTemplate<S3ConnectionConfig, BucketCreationRequest, String> {

    public S3BucketTemplate() {
        super(S3ConnectionConfig.class, BucketCreationRequest.class);
    }

    @Apply
    public void apply() {
        // Access shared configuration for AWS connection
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(this.configuration.getRegion())
            .withCredentials(this.configuration.getCredentialsProvider())
            .build();

        // Create bucket using apply configuration
        var request = new CreateBucketRequest(this.applyPayload.getBucketName())
            .withCannedAcl(this.applyPayload.getAcl());

        if (this.applyPayload.getEncryption() != null) {
            // Apply encryption settings
            request.withObjectLockEnabledForBucket(this.applyPayload.getEncryption().isEnabled());
        }

        s3Client.createBucket(request);
    }

    @Rollback
    public void rollback() {
        // Use the same shared configuration for rollback
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withRegion(this.configuration.getRegion())
            .withCredentials(this.configuration.getCredentialsProvider())
            .build();

        // Delete bucket using rollback bucket name
        s3Client.deleteBucket(this.rollbackPayload);
    }
}
```

This pattern is useful when:
- Both apply and rollback need the same configuration data (AWS credentials, region, etc.)
- You want to avoid duplicating connection details or common settings
- The template needs different data for apply vs rollback operations

### Injecting dependencies into Template methods
Template methods (such as those annotated with `@Apply` and `@Rollback`) support method-level dependency injection using the same mechanism as change units.

Template classes do not support constructor injection.
All dependencies must be injected as parameters in the `@Apply` and `@Rollback` methods.

You can inject any registered dependency as a method parameter:

```java
@Apply
public void apply(MongoDatabase db, ClientService clientService) {
  clientService.doSomething();
}
```
:::info
Flamingock will apply lock-safety guards unless you annotate the parameter with `@NonLockGuarded`.
:::

### Mapping between template-base change file and template methods

Flamingock automatically maps the `apply` and `rollback` sections in your declarative change unit to the corresponding methods in your template class.

## 3. Register the Template with ServiceLoader

Templates are discovered automatically at runtime using Java's `ServiceLoader` system.

Steps:
1. Create a file at:

```
src/main/resources/META-INF/services/io.flamingock.api.template.ChangeTemplate
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

## 4. Package and distribute the Template

Depending on your target:

### Internal Templates (private)
- No special packaging needed.
- Keep your template class inside your application.

### Public Templates (contributing to the Community)
- Package your template as a JAR.
- Notify the Flamingock team via [development@flamingock.io](mailto:development@flamingock.io) or GitHub.
- Submit your template for validation.

#### Validation requirements:
- Clear and justified use case
- Name must align and not conflict with existing templates
- Technically correct and production-grade implementation
- Public classes must be Javadoc-documented
- Submit a Pull Request adding the template's documentation to [flamingock.github.io](https://github.com/flamingock/flamingock.github.io)

## Best practices

- Use `AbstractChangeTemplate<SHARED_CONFIG, APPLY, ROLLBACK>` with the appropriate generic types for your use case.
- **Use the steps format** with `stepsPayload` and `TemplateStep` for new templates. This provides fine-grained rollback control.
- **Support both formats** in your template for backward compatibility: check `hasStepsPayload()` and handle both `stepsPayload` and legacy `applyPayload`/`rollbackPayload`.
- Always provide an `@Rollback` method if rollback or undo is expected.
- In steps format, implement automatic rollback of completed steps when a step fails.
- Use `Void` for generics when that type is not needed (e.g., `<Void, String, String>` for simple SQL templates).
- Use shared configuration (`<ConfigType, Void, Void>`) when both apply and rollback need the same configuration data.
- Document your template's purpose and generic types clearly for users.
- Ensure all custom types are registered for reflection by passing them to the superclass constructor, especially when targeting native builds.
- Group multiple templates by domain when packaging a library.
