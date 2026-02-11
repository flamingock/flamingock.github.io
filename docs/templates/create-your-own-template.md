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

## Template hierarchy

Flamingock provides a template class hierarchy to support different use cases:

```
ChangeTemplate (interface)
    │
    AbstractChangeTemplate (abstract base class)
        │
        ├── AbstractSimpleTemplate - for single-step changes
        │
        └── AbstractSteppableTemplate - for multi-step changes
```

### Choosing the right base class

| Base class | Use case | YAML format |
|------------|----------|-------------|
| `AbstractSimpleTemplate` | Single operation with optional rollback | `apply:` / `rollback:` |
| `AbstractSteppableTemplate` | Multiple operations with per-step rollbacks | `steps:` with paired apply/rollback |

## Overview of the required components

To create a template, you need:

- A Java class extending one of the abstract template classes
- An `@Apply` method to perform the main change
- (Optionally) A `@Rollback` method for undo support
- A service loader registration file (`META-INF/services`)
- (Optional) Package and distribute your template

## 1. Implement the template class

### Option A: AbstractSimpleTemplate (for single-step changes)

Use `AbstractSimpleTemplate` when your template processes a single apply/rollback operation pair.

**Generic parameters:**
- **SHARED_CONFIG**: Shared configuration (use `Void` if not needed)
- **APPLY**: The type representing the apply payload
- **ROLLBACK**: The type representing the rollback payload

**Example - Simple SQL template:**

```java
public class SqlTemplate extends AbstractSimpleTemplate<Void, String, String> {

    public SqlTemplate() {
        super();
    }

    @Apply
    public void apply(Connection connection) throws SQLException {
        if (hasStep()) {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute(getApply());
            }
        }
    }

    @Rollback
    public void rollback(Connection connection) throws SQLException {
        if (hasRollback()) {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute(getRollback());
            }
        }
    }
}
```

**Key methods from AbstractSimpleTemplate:**
- `setStep(TemplateStep<APPLY, ROLLBACK>)` - Sets the step (called by framework)
- `getStep()` - Returns the TemplateStep
- `hasStep()` - Checks if a step is set
- `getApply()` - Convenience method to get apply payload from step
- `getRollback()` - Convenience method to get rollback payload from step
- `hasRollback()` - Checks if rollback is defined in the step

### Option B: AbstractSteppableTemplate (for multi-step changes)

Use `AbstractSteppableTemplate` when your template processes multiple operations, each with its own apply and optional rollback.

**Example - MongoDB template:**

```java
public class MongoChangeTemplate extends AbstractSteppableTemplate<Void, MongoOperation, MongoOperation> {

    public MongoChangeTemplate() {
        super(MongoOperation.class);
    }

    @Apply
    public void apply(MongoDatabase db, @Nullable ClientSession clientSession) {
        if (hasSteps()) {
            executeStepsWithRollback(db, getSteps(), clientSession);
        }
    }

    @Rollback
    public void rollback(MongoDatabase db, @Nullable ClientSession clientSession) {
        if (hasSteps()) {
            rollbackAllSteps(db, getSteps(), clientSession);
        }
    }

    private void executeStepsWithRollback(MongoDatabase db,
            List<TemplateStep<MongoOperation, MongoOperation>> steps,
            ClientSession clientSession) {
        List<TemplateStep<MongoOperation, MongoOperation>> completedSteps = new ArrayList<>();

        for (int i = 0; i < steps.size(); i++) {
            TemplateStep<MongoOperation, MongoOperation> step = steps.get(i);
            try {
                step.getApply().getOperator(db).apply(clientSession);
                completedSteps.add(step);
            } catch (Exception e) {
                // Rollback completed steps in reverse order
                rollbackAllSteps(db, completedSteps, clientSession);
                throw new RuntimeException("Step " + (i + 1) + " failed", e);
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
                try {
                    step.getRollback().getOperator(db).apply(clientSession);
                } catch (Exception e) {
                    // Log error but continue rollback
                }
            }
        }
    }
}
```

**Key methods from AbstractSteppableTemplate:**
- `setSteps(List<TemplateStep<APPLY, ROLLBACK>>)` - Sets the steps list (called by framework)
- `getSteps()` - Returns the list of TemplateStep objects
- `hasSteps()` - Checks if steps are set and not empty

### Common fields from AbstractChangeTemplate

All template classes inherit these fields from `AbstractChangeTemplate`:
- `changeId` - The unique identifier for the change
- `isTransactional` - Whether the change runs in a transaction
- `configuration` - Shared configuration (if using non-Void config type)

#### Important notes

**Reflection support:**

If your template references custom types, make sure to register them for reflection—especially for **GraalVM** native builds. When extending the abstract classes, you can pass your custom types to the superclass constructor:

```java
public MongoChangeTemplate() {
    super(MongoOperation.class);  // Register MongoOperation for reflection
}
```

## 2. Define execution and rollback methods

Each template must include an `@Apply` method, and may optionally include a `@Rollback` method. These methods define the core logic that will be executed when Flamingock runs the corresponding change.

### The TemplateStep class

The `TemplateStep<APPLY, ROLLBACK>` class represents a single step in a change. Each step pairs an apply operation with an optional rollback operation:

```java
public class TemplateStep<APPLY, ROLLBACK> {
    public APPLY getApply();           // Required: the apply payload
    public ROLLBACK getRollback();     // Optional: the rollback payload (may be null)
    public boolean hasRollback();      // Check if rollback is defined
}
```

**Rollback behavior in steppable templates:**
- When a step fails, all previously successful steps should be rolled back in reverse order
- Steps without rollback operations are skipped during rollback
- Rollback errors should be logged but shouldn't stop the rollback process for remaining steps

### Example: Kafka topic template (simple)

:::info
This is an illustrative example to demonstrate the template structure.
:::

```java
public class KafkaTopicTemplate extends AbstractSimpleTemplate<Void, TopicConfig, String> {

    public KafkaTopicTemplate() {
        super(TopicConfig.class);
    }

    @Apply
    public void apply(AdminClient adminClient) throws Exception {
        if (hasStep()) {
            TopicConfig config = getApply();
            var newTopic = new NewTopic(
                config.getName(),
                config.getPartitions(),
                config.getReplicationFactor()
            );
            newTopic.configs(config.getConfigs());
            adminClient.createTopics(List.of(newTopic)).all().get();
        }
    }

    @Rollback
    public void rollback(AdminClient adminClient) throws Exception {
        if (hasRollback()) {
            adminClient.deleteTopics(List.of(getRollback())).all().get();
        }
    }
}
```

### Example with shared configuration

When you need to share configuration between apply and rollback (such as connection details, common settings, etc.), you can use a non-Void shared configuration type:

:::info
This is an illustrative example to demonstrate the shared configuration pattern.
:::

```java
public class S3BucketTemplate extends AbstractSimpleTemplate<S3ConnectionConfig, BucketCreationRequest, String> {

    public S3BucketTemplate() {
        super(S3ConnectionConfig.class, BucketCreationRequest.class);
    }

    @Apply
    public void apply() {
        if (hasStep()) {
            // Access shared configuration for AWS connection
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                .withRegion(this.configuration.getRegion())
                .withCredentials(this.configuration.getCredentialsProvider())
                .build();

            // Create bucket using apply configuration
            var request = new CreateBucketRequest(getApply().getBucketName())
                .withCannedAcl(getApply().getAcl());

            s3Client.createBucket(request);
        }
    }

    @Rollback
    public void rollback() {
        if (hasRollback()) {
            // Use the same shared configuration for rollback
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                .withRegion(this.configuration.getRegion())
                .withCredentials(this.configuration.getCredentialsProvider())
                .build();

            // Delete bucket using rollback bucket name
            s3Client.deleteBucket(getRollback());
        }
    }
}
```

This pattern is useful when:
- Both apply and rollback need the same configuration data (AWS credentials, region, etc.)
- You want to avoid duplicating connection details or common settings
- The template needs different data for apply vs rollback operations

### Injecting dependencies into template methods

Template methods (such as those annotated with `@Apply` and `@Rollback`) support method-level dependency injection using the same mechanism as change units.

Template classes do not support constructor injection. All dependencies must be injected as parameters in the `@Apply` and `@Rollback` methods.

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

### Mapping between template-based change file and template methods

Flamingock automatically maps the YAML content to the corresponding template methods:
- For `AbstractSimpleTemplate`: `apply:` and `rollback:` fields are wrapped into a `TemplateStep` and set via `setStep()`
- For `AbstractSteppableTemplate`: `steps:` list is parsed and set via `setSteps()`

## 3. Register the template with ServiceLoader

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

## 4. Package and distribute the template

Depending on your target:

### Internal templates (private)
- No special packaging needed.
- Keep your template class inside your application.

### Public templates (contributing to the community)
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

- **Choose the right base class**: Use `AbstractSimpleTemplate` for single operations, `AbstractSteppableTemplate` for multi-step changes.
- **Always provide an `@Rollback` method** if rollback or undo is expected.
- **In steppable templates**, implement automatic rollback of completed steps when a step fails.
- **Use `Void`** for generics when that type is not needed (e.g., `<Void, String, String>` for simple SQL templates).
- **Use shared configuration** when both apply and rollback need the same configuration data.
- **Document your template's purpose** and generic types clearly for users.
- **Ensure all custom types are registered for reflection** by passing them to the superclass constructor, especially when targeting native builds.
- **Group multiple templates by domain** when packaging a library.

