---
sidebar_position: 3
title: Create your template
---

# Create your own Flamingock template

## Introduction

[Flamingock Templates](./templates-introduction.md) allow you to encapsulate common logic and reduce boilerplate when defining change units. This document explains how to create your own templates for reuse across projects or for contribution to the Flamingock community.

---

## Overview of the required components

To create a template, you need:

- A Java class implementing `ChangeTemplate<CONFIG>` (or extending `AbstractChangeTemplate<CONFIG>`)
- A configuration class extending `ChangeTemplateConfig`
- An `@Execution` method to perform the main change
- (Optionally) A `@RollbackExecution` method for undo support
- A service loader registration file (`META-INF/services`)
- (Optional) Package and distribute your template

---

## 1. Create a Configuration class

You must create a config class that extends `ChangeTemplateConfig<EXECUTION, ROLLBACK>`.

**Example:**

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

## 2. Implement the Template class

There are two available options:

- **Recommended:** Extend `AbstractChangeTemplate<CONFIG>` for easier setup
- **Advanced:** Implement `ChangeTemplate<CONFIG>` manually if you need total control

**Example:**

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

:::note 
See [**3. Define Execution and Rollback methods** ](./create-your-own-template#3-define-execution-and-rollback-methods) section for how to implement the core logic inside your template class using the provided configuration and dependency injection
:::

---

## 3. Define Execution and Rollback methods
Each template must include an `@Execution` method, and may optionally include a `@RollbackExecution` method.
These methods define the core logic that will be executed when Flamingock runs the corresponding change.

Inside these methods, it’s expected that you use the configuration values provided by the user in the template-based change unit.
These values are accessible via:

- `configuration.getExecution()` — for the logic/data to apply during execution
- `configuration.getRollback()` — for the logic/data to apply during rollback or undo

An example of a template for SQL:
```java
@Execution
public void execute(Connection connection) throws SQLException {
  String sql = configuration.getExecution();
  try (Statement stmt = connection.createStatement()) {
    stmt.execute(sql);
  }
}

@RollbackExecution
public void rollback(Connection connection) throws SQLException {
  String rollbackSql = configuration.getRollback();
  try (Statement stmt = connection.createStatement()) {
    stmt.execute(rollbackSql);
  }
}

```

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

In a template-based change unit (declarative format), Flamingock uses the `execution` and `rollback` sections to determine which methods to invoke in your template class.

#### Execution

- The method annotated with `@Execution` is **mandatory** for the template developer.
- The `execution` section in the declarative change unit is **mandatory** for the user.
- If the `execution` section is missing, Flamingock throws an exception at startup.

#### Rollback

- The method annotated with `@RollbackExecution` is **mandatory** for the template developer.
- The `rollback` section in the declarative changeUnit is **optional** for the user.

The behavior of rollback varies depending on context:

**Rollback during execution failure**

- If the system is **transactional** (e.g., MySQL), Flamingock relies on the system’s native transaction handling. It will not call the rollback method.
- If the system is **non-transactional**, Flamingock will:
  - Attempt to call the `@RollbackExecution` method only if the user provides a `rollback` section in the declarative file.
  - If no rollback config is provided, Flamingock skips the method call and logs the change as **FAILED**.

**Rollback during Undo operations (manual reversion)**

- If a `rollback` section is present in the declarative file, Flamingock will call the `@RollbackExecution` method — even if the change was previously applied successfully.
- If no `rollback` is provided, Flamingock skips the rollback logic, but still marks the change as **ROLLED_BACK** in the audit.

:::info
In undo operations, if rollback is not defined in the declarative file, the change is marked as reverted even though no actual rollback was executed. It’s up to the user to ensure reversibility when needed.
:::

---

## 4. Register the Template with ServiceLoader

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

## 5. Package and distribute the Template

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
- Ensure all reflective classes are registered, specially when targeting native builds.
- Group multiple templates by domain when packaging a library.

---
