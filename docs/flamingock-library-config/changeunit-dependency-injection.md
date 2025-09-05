---
title: ChangeUnit dependency injection
sidebar_position: 45
---

# ChangeUnit Dependency Injection

Flamingock provides a sophisticated dependency injection system that automatically resolves dependencies for ChangeUnits from multiple sources. Understanding this system is crucial for building maintainable and well-structured changes.

## How dependency resolution works

Flamingock uses a **hierarchical resolution strategy** that searches for dependencies in this order:

1. **Target system context** - Dependencies provided by the specific target system
2. **General application context** - Shared dependencies registered globally direcntly in the builder  
3. **Framework context** - When using Spring Boot, beans from the Spring container

This approach ensures that system-specific dependencies are properly scoped while allowing shared utilities to be available everywhere.

:::info
**Target System Integration**: Each ChangeUnit declares a target system via `@TargetSystem("system-name")`. The target system automatically provides its core dependencies without manual registration.  
See [Target System Configuration](./target-system-configuration.md) for details.
:::

## Supported injection features

Dependency injection is configured via the **Flamingock builder** and target system registration, supporting:

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

## Target system dependencies

**Target systems automatically provide their core dependencies** without manual registration. When you register a target system, its primary dependencies become available to all ChangeUnits targeting that system.

### Creating and registering the target system
First, you create and register a target system with its dependencies:

```java
// Register Kafka Schema Registry target system with its dependencies
SchemaRegistryClient schemaRegistryClient = new CachedSchemaRegistryClient("http://localhost:8081", 100);
KafkaTemplate<String, Object> kafkaTemplate = new KafkaTemplate<>(producerFactory);

DefaultTargetSystem schemaRegistrySystem = new DefaultTargetSystem("kafka-schema-registry")
    .addDependency(schemaRegistryClient)
    .addDependency(kafkaTemplate)
    .addDependency("schemaValidator", schemaValidatorService);

FlamingockStandalone
    .addTargetSystems(schemaRegistrySystem)
    .build()
    .run();
```

### Linking ChangeUnits to the target system
Then, ChangeUnits targeting that system automatically receive the registered dependencies:

```java
@TargetSystem("kafka-schema-registry")
@ChangeUnit(id = "register-user-schema", order = "001", author = "team")
public class RegisterUserSchema {
    
    @Execution
    public void execute(SchemaRegistryClient schemaRegistryClient,
                       KafkaTemplate<String, Object> kafkaTemplate,
                       @Named("schemaValidator") SchemaValidatorService validator) {
        // Dependencies injected automatically from "kafka-schema-registry" target system
        String userSchemaJson = loadUserSchema();
        validator.validateSchema(userSchemaJson);
        
        Schema userSchema = new Schema.Parser().parse(userSchemaJson);
        schemaRegistryClient.register("user-events-value", userSchema);
    }
}
```


## Registering additional dependencies

For shared or globally-scoped dependencies, use the `addDependency(...)` method in the builder:

```java
builder
  .addDependency(clientService)                          // Shared service
  .addDependency("emailService", emailServiceImpl);     // Named dependency
```

These dependencies are available to all ChangeUnits as fallbacks when not provided by the target system:

```java
@TargetSystem("user-database")
@ChangeUnit(id = "notify-users", order = "002", author = "team")
public class NotifyUsers {
    
    @Execution
    public void execute(MongoDatabase database,      // From target system
                       EmailService emailService) { // From general context
        // Both dependencies resolved automatically
        List<User> users = findUsers(database);
        emailService.notifyUsers(users);
    }
}
```
## Resolving ambiguous dependencies

When multiple implementations exist for the same interface, you need to be explicit about which one to use.



### Example scenario
You have a `PaymentProcessor` interface with two implementations:

```java
addDependency(new StripePaymentProcessor());
addDependency(new PaypalPaymentProcessor());
```

Requesting `PaymentProcessor` directly would be ambiguous. Flamingock provides two solutions:

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

:::info
**Target systems can solve many ambiguity issues naturally**. By registering different implementations in separate target systems, each ChangeUnit automatically gets the right implementation for its context without manual disambiguation.
:::

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

## Best practices

- **Leverage target system dependencies**: Use target system auto-injection for database connections, clients, and system-specific tools
- **Keep dependencies scoped**: Don't register target system-specific dependencies globally - let each target system provide its own
- **Only inject what you need** for the current change unit
- **Prefer constructor injection** when dependencies are shared across multiple methods  
- **Use `@NonLockGuarded` carefully** - only when you're certain no side effects are involved
- **Document complex dependency chains** to avoid confusion in large applications
