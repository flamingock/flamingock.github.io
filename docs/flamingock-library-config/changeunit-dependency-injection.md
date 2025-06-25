---
title: ChangeUnit dependency injection
sidebar_position: 3
---

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

Platform changeUnit dependencies  are registered using the method `addDependency(...)` :
```java
builder
  .addDependency(clientService);                         
```
Once registered, Flamingock can inject the requested dependency into your change unit methods or constructors.
```java
@Execution
public void execute(ClientService clientService) {
    // ChangeUnit's logic
}
```
### Using name and explicit type
Let’s say you have a base class `PaymentProcessor`, with two implementations: `StripePaymentProcessor` and `PaypalPaymentProcessor`.

Now imagine you're injecting both implementations like this:
```java
addDependency(new StripePaymentProcessor());
addDependency(new PaypalPaymentProcessor());
```

If a change unit method requests either `StripePaymentProcessor` or `PaypalPaymentProcessor` specifically, Flamingock will inject the correct one.

But if the method requests the general type `PaymentProcessor`, Flamingock cannot guarantee which of the two will be used.

To solve this, Flamingock provides two mechanisms:

#### Named dependency
You can register each implementation with a name:
```java
builder
  .addDependency("stripe", new StripePaymentProcessor())
  .addDependency("paypal", new PaypalPaymentProcessor());
```

Then use the `javax.inject.@Named` annotation in your method:
```java
@Execution
public void execute(@Named("stripe") PaymentProcessor processor) {
  processor.charge(...);
}
```

#### Explicit typing the dependency
Alternatively, you can register a specific instance for the general type, to ensure the right one is used by default:
```java
builder.addDependency(PaymentProcessor.class, new StripePaymentProcessor());
```
Now, any method requesting a `PaymentProcessor` will receive the Stripe implementation — unless a named one is requested instead.


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

:::note 
If the class has only one constructor, the `@FlamingockConstructor` annotation is optional.
:::
---

## What happens if a dependency isn’t found?

By default, Flamingock will throw a clear exception if it cannot resolve a dependency.

You can override this by marking the parameter as `@Nullable`:

```java
import io.flamingock.core.api.annotations.Nullable;

@Execution
public void run(@Nullable OptionalLogger logger) {
  if (logger != null) {
    logger.log("Change started");
  }
}
```

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
