---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Custom injections

Flamingock primarily adopts a code-first approach for managing changes, which offers several advantages—one of the most powerful being the ability to inject any bean into your change classes.

This flexibility proves especially useful in scenarios such as:

- Retrieving data from a third-party system as part of the migration process
- Leveraging Spring Data repositories to interact with your database
- Executing additional operations during the migration (e.g., sending a notification), while ensuring that the transaction is aborted if the operation fails


## Use Cases

- Use existing repositories and services within migrations
- Inject application configuration properties
- Apply logging or monitoring at migration time
- Share domain logic between your application and migration scripts

## How It Works

Flamingock leverages your framework’s Dependency Injection (DI) container (e.g., Spring, Micronaut, Jakarta) to resolve and inject dependencies into your **ChangeUnit**.

**ChangeUnit** can use **constructor injection**, **field injection**, or **setter injection**, just like any other class managed by your DI container.

:::tip
All components you want to inject must be managed by the same IoC context as the Flamingock runner.
:::

## Example (Spring-based)

Let's say you have a domain service:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
        ```java
    @ChangeUnit(id = "myChangeUnit", order = "001", author = "dev")
    public class MyChangeUnit {

        private final MyDomainService myDomainService;

        public MyChangeUnit(MyDomainService myDomainService) {
            this.myDomainService = myDomainService;
        }

        @Execution
        public void changeSetExecution() {
            myDomainService.doSomethingUseful();
        }
    }
    ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin" default>
            ```Kotlin 
            @ChangeUnit(id = "myChangeUnit", order = "001", author = "dev")
    class MyChangeUnit(private val myDomainService: MyDomainService) {

        @Execution
        fun changeSetExecution() {
            myDomainService.doSomethingUseful()
        }
    }
    ```
</TabItem>
</Tabs>

You can inject it into your **ChangeUnit** like this:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
        ```java
        @ChangeUnit(id = "myChangeUnit", order = "001", author = "dev")
        public class MyChangeUnit {

            private final MyDomainService myDomainService;

            public MyChangeUnit(MyDomainService myDomainService) {
                this.myDomainService = myDomainService;
            }

            @Execution
            public void changeSetExecution() {
                myDomainService.doSomethingUseful();
            }
        }
        ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin" default>
        ```Kotlin 
        @ChangeUnit(id = "myChangeUnit", order = "001", author = "dev")
        class MyChangeUnit(private val myDomainService: MyDomainService) {

            @Execution
            fun changeSetExecution() {
                myDomainService.doSomethingUseful()
            }
        }
    ```
</TabItem>
</Tabs>

Flamingock will automatically inject `MyDomainService` when instantiating the **ChangeUnit**.

## Advanced usage

You can inject multiple services, repositories, or even configuration values:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
        ```java
            @ChangeUnit(id = "advancedChange", order = "002", author = "dev")
            public class AdvancedChangeUnit {

                @Autowired
                private MyRepository repository;

                @Value("${my.config.property}")
                private String configProperty;

                @Execution
                public void execute() {
                    // Use repository and configProperty during migration
                }
            }
        ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin" default>
        ```Kotlin 
            import org.springframework.beans.factory.annotation.Autowired
            import org.springframework.beans.factory.annotation.Value

            @ChangeUnit(id = "advancedChange", order = "002", author = "dev")
            class AdvancedChangeUnit {

                @Autowired
                private lateinit var repository: MyRepository

                @Value("\${my.config.property}")
                private lateinit var configProperty: String

                @Execution
                fun execute() {
                    // Use repository and configProperty during migration
                }
            }
    ```
</TabItem>
</Tabs>

## Advanced: Proxy explanation

Flamingock leverages **proxies** as part of its internal lock mechanism to ensure that all operations executed within a **ChangeUnit** are **safely synchronized**. This is critical for maintaining migration consistency, especially in distributed or concurrent environments.

### Why proxies?

By default, **all dependencies injected into a ChangeUnit are proxied**. This proxy layer allows Flamingock to enforce synchronization rules around database access and lifecycle events without requiring manual coordination from developers.

This behavior is transparent, but it's an essential part of how Flamingock guarantees consistency during migration execution.

### Goals of the proxy instrumentation

The Flamingock proxy mechanism serves two primary purposes:

1. **Intercept method calls**:  
   Flamingock intercepts calls to injected services in order to ensure the **lock is acquired before any critical operation** begins. This protects against race conditions in concurrent environments.

2. **Propagate proxy behavior**:  
   The returned object from any injected service is also a **proxied instance**, ensuring that **any subsequent calls** to those methods (within the same or other **ChangeUnits**) **continue to respect the locking constraints**.

### What this means for you

- When a service is injected into a **ChangeUnit**, you are likely working with a **proxy object**, not the concrete class.
- These proxies are automatically managed by Flamingock in coordination with your DI framework (Spring, Micronaut, etc.).
- This ensures **database access is synchronized**, and that **locking behavior is consistently applied** throughout the lifecycle of the **ChangeUnit** execution.

This mechanism is fundamental to Flamingock's safety guarantees, allowing developers to write migrations using familiar services without worrying about thread-safety or concurrency issues at the database level.

Flamingock's proxy-based approach ensures robust, safe execution of migrations—even in highly concurrent environments—while letting developers write clean, dependency-injected **ChangeUnits** as usual.

:::tip
By default, Flamingock won't return a proxied object if one of the following conditions is in place: The returned object is a primitive type, String, Class type, wrapper type or any object in a package prefixed by"java.", "com.sun.", "javax.", "jdk.internal." or "sun."
:::


## Relaxing lock guarding: `@NonLockGuarded`

By default, Flamingock applies a **conservative lock strategy** to ensure safe and consistent execution of all change units. This means that any component injected into a change unit is **proxied** and **lock-guarded** to prevent concurrent access to the database.

This is the recommended approach in most cases, as it balances **safety**, **simplicity**, and **performance**.

However, Flamingock is designed with flexibility in mind. If needed, you can **fine-tune how locking is applied** by using the `@NonLockGuarded` annotation.

### What does `@NonLockGuarded` do?

This annotation tells Flamingock to **relax the locking constraints** for a specific component — either on a parameter, class, or method level. It allows you to opt-out of the proxy-based locking behavior when you know a component doesn't require it.

### Available modes

`@NonLockGuarded` can be applied with three different modes:

#### `RETURN`

This mode tells Flamingock to lock-guard the **injected bean**, but not the **object it returns**. Useful when you trust the returned object not to interact with the database.

```java
@Execution
public void execution(@NonLockGuarded(RETURN) RevampRepository repository) {
    RevampDocument doc = repository.findById("abc"); // doc is not proxied
}
```

#### `METHOD`

With this mode, Flamingock **does not lock-guard the injected bean**, but still **proxies the object it returns** to ensure downstream safety.

```java
@Execution
public void execution(@NonLockGuarded(METHOD) RevampRepository repository) {
    RevampDocument doc = repository.findById("abc"); // doc is still proxied
}
```

#### `NONE`

Completely disables proxying: neither the injected bean nor the returned object is guarded by Flamingock’s lock mechanism. Use this only when you're confident there's **no database interaction** and **no side effects**.

```java
@Execution
public void execution(@NonLockGuarded(NONE) RevampRepository repository) {
    // Fully unguarded usage
}
```

---

## Where can you apply `@NonLockGuarded`?

Flamingock lets you apply this annotation at **three different levels**:

### 1. On a ChangeUnit parameter

This lets you relax locking **just for one usage** of a bean. Ideal when most usages are guarded, but specific operations are known to be safe without it.

```java
@ChangeUnit(id = "clientInit", order = "001", author = "flamingock")
public class ClientInitializerChangeUnit {

    @Execution
    public void dataInitializer(@NonLockGuarded ClientRepository clientRepository) {
        // This call bypasses the lock mechanism
    }
}
```

### 2. On a class

Applying `@NonLockGuarded` at the **type level** disables proxying for **all instances** of that class. Use this when you're confident the class doesn't interact with the database and should **never be proxied**.

```java
@NonLockGuarded
public class MyCustomBeanImpl implements MyCustomBean {
    // This bean will never be proxied
}
```

### 3. On a method

You can also annotate specific methods to **opt out of lock guarding** at the method level. This means the method call itself will not be intercepted, though returned objects may still be.

```java
public class MyCustomBeanImpl implements MyCustomBean {

    @NonLockGuarded
    public MyCustomBean accessAndReturnProxyableObject() {
        return new MyCustomBeanImpl(); // This method will not be lock-guarded
    }
}
```

---

## Use with care

Disabling lock guarding can improve performance or reduce overhead in non-critical paths, but it should be done **carefully and intentionally**. Always make sure that:

- The component doesn't perform database operations that require coordination.
- The relaxation won’t compromise consistency in concurrent executions.

---

By using `@NonLockGuarded`, Flamingock gives you fine-grained control over how locking is applied during migrations, allowing advanced users to balance safety and performance as needed.


## Notes and best practices

- **Scoping:** Make sure your beans are properly scoped for the migration context (e.g., singleton or stateless).
- **Idempotency:** Services used within **ChangeUnit** should be safe to run multiple times unless the execution strategy is configured to avoid that.
- **Lifecycle Management:** Avoid injecting components that have a short or request-specific lifecycle (e.g., HTTP session scoped beans).

---

By supporting full-featured dependency injection, Flamingock helps you keep your changes clean, modular, and consistent with your application's architecture.
