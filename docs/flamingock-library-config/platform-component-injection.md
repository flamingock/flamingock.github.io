---
title: Platform component injection
sidebar_position: 4
---

# Platform component injection

In addition to injecting dependencies into your change units, Flamingock allows you to register **platform-level components**. These are required for Flamingock's internal operations, such as framework integration, driver setup, or future extensions like observability.

These components are not part of the change unit logic — they help Flamingock integrate and operate effectively within your application's runtime environment.

---

## When is this needed?

You may need to register platform components when:

- **Framework integration** is required  
  For example, when integrating with Spring Boot, you must provide `ApplicationContext` and `ApplicationEventPublisher` so Flamingock can hook into the application lifecycle.

- **Database access in Community Edition drivers**  
  Some drivers (like MongoDB or DynamoDB) require the database client to be explicitly provided.

- **System integrations like logging or observability** *(coming soon)*  
  Future features like OpenTelemetry or event monitoring may rely on externally provided components.

- **Custom modules or platform bridges**  
  If you're building your own Flamingock modules or integrating with external systems, you might need to provide platform services explicitly.

:::info
  Each integration (e.g., Spring Boot, database integration, etc.) will clearly document if and how platform components need to be registered. You don’t need to guess — check the relevant integration section for guidance.
:::

---

## Registering platform dependencies

Platform components are registered using the same `addDependency(...)` API used for change unit dependencies:

```java
builder
  .addDependency(applicationContext)
  .addDependency(applicationEventPublisher);
```
:::tip
If a component is relevant for both Flamingock internal operations and for injection into change units, you only need to register it once.
:::


---

## See also

- [ChangeUnit dependency injection](changeunit-dependency-injection.md) — for injecting services directly into change units  
- [Spring Boot integration](../frameworks/springboot-integration/introduction.md) — for automated platform wiring in Spring apps
