---
title: Dependency Wiring (Advanced)
sidebar_position: 4
---

# Dependency wiring (advanced)

Flamingock allows you to inject dependencies into your change units so they can use services, clients, or utilities during execution. This is especially useful for **standalone applications**, where no dependency injection framework (like Spring) is present.

If you're using **Spring Boot**, Flamingock can integrate with the Spring context to resolve dependencies automatically — Please refer to the [Spring Boot Integration](/docs/springboot-integration) section for details.

This injection is handled via the **Flamingock builder** — not via YAML — and supports:

| Feature                                                    |  Supported?  |
|------------------------------------------------------------|:------------:|
| Injection by type                                          |      ✅       |
| Injection by name                                          |      ✅       |
| Constructor-level injection                                |      ✅       |
| Method-level injection(`@Execution`, `@RollbackExecution`) |      ✅       |
| Nullable parameters                                        |      ✅       |
| Lock-safe proxying                                         |      ✅       |
| Opt-out via `@NonLockGuarded` for non-critical components  |      ✅       |

---

## Registering dependencies

Flamingock provides multiple methods to register dependencies with the builder:

```java
builder
  .addDependency(clientService);                         // by type
  .addDependency("clientService", clientService);        // by name
  .addDependency(ClientService.class, clientService);    // by explicit type
  .addDependency("cs", ClientService.class, clientService); // by name and type
```

Once registered, Flamingock can inject these into your change unit methods or constructors.

---

## Injection targets

### Method injection

You can declare dependencies as parameters of `@Execution`, `@RollbackExecution`, etc.

```java
@Execution
public void run(ClientService clientService) {
  clientService.doSomething();
}
```

### Constructor injection

You can inject dependencies through constructors:

```java
public class CreateClientsTable {

  private final ClientService clientService;

  @FlamingockConstructor
  public CreateClientsTable(ClientService clientService) {
    this.clientService = clientService;
  }

  @Execution
  public void run() {
    clientService.doSomething();
  }
}
```

> If the class has only one constructor, the `@FlamingockConstructor` annotation is optional.

---

## What happens if a dependency isn’t found?

By default, Flamingock will throw a clear exception if it cannot resolve a dependency.

You can override this by marking the parameter as `@Nullable`:

```java
@Execution
public void run(@Nullable OptionalLogger logger) {
  if (logger != null) {
    logger.log("Change started");
  }
}
```

> :pushpin: Uses `jakarta.annotation.Nullable`

---

## Skipping lock verification

By default, injected dependencies are **proxy-wrapped** to check that the lock is still held before each call — this prevents unsafe execution if the lock expires.

If you're injecting something that doesn't perform critical side effects (like a local list or utility), you can opt out of this check:

```java
@Execution
public void run(@NonLockGuarded SomeHelper helper) {
  helper.doLocalStuff();
}
```
---

## :white_check_mark: Best practices

- Only inject what you need for the current change unit
- Prefer constructor injection when dependencies are shared across multiple methods
- Use `@NonLockGuarded` only when you're certain no side effects are involved
- Document your dependencies to avoid confusion in large pipelines
