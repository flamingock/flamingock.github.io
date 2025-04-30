---
sidebar_position: 3
title: Create your template
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Create Your Own Flamingock Template

## Introduction

Flamingock Templates allow you to encapsulate common logic and reduce boilerplate when defining system changes.  
This page explains how to create your own templates for reuse across projects or for contribution to the Flamingock community.

> Need a refresher on what templates are? See the [Templates Overview](/docs/templates/templates-overview.md).

---

## Overview of the Required Components

To create a template, you need:

- A Java class implementing `ChangeTemplate<CONFIG>` (or extending `AbstractChangeTemplate<CONFIG>`)
- A configuration class extending `ChangeTemplateConfig`
- An `@Execution` method to perform the main change
- (Optionally) A `@RollbackExecution` method for undo support
- A service loader registration file (`META-INF/services`)
- (Optional) Package and distribute your template

---

## :one: Create a Configuration Class

You must create a config class that extends `ChangeTemplateConfig<EXECUTION, ROLLBACK>`.

Example:

```java
public class MongoChangeTemplateConfig  extends ChangeTemplateConfig<MongoOperation, MongoOperation> {

  public MongoChangeTemplateConfig(MongoOperation execution, MongoOperation rollback) {
    super(execution, rollback);
  }

  public MongoChangeTemplateConfig() {
    super();
  }
}
```
---

## :two: Implement the Template Class

You have two options:

- **Recommended:** Extend `AbstractChangeTemplate<CONFIG>` for easier setup
- **Advanced:** Implement `ChangeTemplate<CONFIG>` manually if you need total control

Example:

```java
public class MongoChangeTemplate extends AbstractChangeTemplate<MongoChangeTemplateConfig> {

    public MongoChangeTemplate() {
        super(MongoChangeTemplateConfig.class, MongoOperation.class);
    }

    @Execution
    public void execute(MongoDatabase db, @Nullable ClientSession clientSession) {
      //TODO: Logic for execution. It should use configuration.getExecution()
    }

    @RollbackExecution
    public void rollback(MongoDatabase db, @Nullable ClientSession clientSession) {
        //TODO: Logic for rollback. It should use configuration.getRollback()
    }

}
```

#### Important notes
- The `@Execution` method is mandatory, while `@RollbackExecution` is optional.
- The `setConfiguration()` method is already implemented in `AbstractChangeTemplate`, but you can override it for custom behavior.
- If needed, validate your configuration inside the overridden `setConfiguration()` method.
- If your config class references custom types, make sure to register them for reflection—especially for **GraalVM** native builds. When extending `AbstractChangeTemplate`, you can pass both the config class and any referenced types to the superclass constructor to ensure proper reflection support.


---

## 3️⃣ Define Execution and Rollback Methods

### Mapping Between template-base changeUnit file and Template Methods

The `execution` and `rollback` sections inside your template-base changeUnit directly map to the `@Execution` and `@RollbackExecution` methods in your template:

- If `execution` is present in the template-base changeUnit:
  - Flamingock will call the `@Execution` method.
  - If `execution` is missing, Flamingock **throws an exception** at startup.

- If `rollback` is present in the template-base changeUnit:
  - Flamingock will attempt to call the `@RollbackExecution` method.
  - Behavior depends on context:
    - During **normal execution failures**:
      - Only called if the system is **non-transactional**.
      - In transactional systems (e.g., MySQL), the rollback method is skipped because the database transaction handles it.
    - During **Undo Operations**:
      - Called even if the original change was successful, allowing manual reversal.

- If `rollback` is missing in the template-base changeUnit:
  - Flamingock does not call the rollback method.
  - If an execution failure occurs, Flamingock logs the change as **FAILED**.

---

## 4️⃣ Register the Template with ServiceLoader

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

> Group templates by domain or technology for better maintainability.

---

## 5️⃣ Package and Distribute the Template

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

- Use `AbstractChangeTemplate` unless your case requires full customization.
- Always provide an `@RollbackExecution` method if rollback or undo is expected.
- Document configuration fields clearly for users.
- Ensure all reflective classes are registered when targeting native builds.
- Group multiple templates by domain when packaging a library.

---
