---
title: FAQ
sidebar_position: 150
---

## Introduction

This FAQ addresses common questions developers may have when integrating **Flamingock** into their Java or Spring-based applications.

---

### Getting started

**Should I use a template-based or code-based ChangeUnit?**  
Flamingock supports two complementary approaches for defining changes:

- **Template-based ChangeUnits** allow you to describe changes declaratively using formats like YAML. This approach is ideal for applying consistent and reusable changes with minimal code. However, it requires that a **template module already exists** for the target context (e.g. Kafka, MongoDB). If such a module is available, you can simply declare the parameters of the change without writing Java code.

- **Code-based ChangeUnits** provide full flexibility using Java, and are suitable when:
  - You need to define dynamic or conditional logic.
  - No template module is available for the type of change you need.
  - You prefer full control over execution flow and validations.

Both approaches can be combined in the same project. Templates help reduce boilerplate and promote consistency, while code-based units offer the freedom to handle any use case.

For more details, see the [template introduction](templates/templates-introduction.md).

**How do I integrate Flamingock into a Spring Boot application?**  
If you're using Spring Boot, the easiest way to integrate Flamingock is through the annotation [`@EnableFlamingock`](./springboot-integration/introduction.md), which provides full auto-configuration. This is the recommended approach for most use cases.

**Can I use Flamingock without Spring Boot?**  
Yes. You can use Flamingock in any Java application by configuring it manually using the [`FlamingockBuilder`](./get-started.md#5-configure-flamingock). This approach is ideal for applications that do not rely on Spring Boot or that require finer control.

**What Java version is required?**  
Flamingock supports **Java 8 and above**. Some optional features or editions may benefit from newer JDK versions (e.g. Java 17+), but Java 8 remains the baseline.

**Is it possible to use Flamingock in GraalVM native images?**  
Yes, Flamingock provides a dedicated [GraalVM integration guide](./graalvm.md). Ensure your dependencies and reflection requirements are correctly configured.

---

### Editions and compatibility

**What edition of Flamingock should I use?**  
The main factor when choosing a Flamingock edition is **where you want to store Flamingock’s internal records** (used to track applied ChangeUnits, audit, and locking).

If you are using the **Cloud Edition**, Flamingock handles the internal store transparently, and no local database setup is required. This simplifies setup and removes concerns about storage configuration.

If you are using a **Community Edition**, this storage is managed within your own infrastructure. In that case, you should select the edition that:
- Matches the **database engine** you are already using (e.g. MongoDB, Couchbase, DynamoDB).
- Integrates best with your **data access technology** (e.g. MongoDB Java Driver or Spring Data MongoDB).

For example, if your application uses MongoDB with Spring Data and you want Flamingock’s operations to participate in the same transactions, you should choose the *Spring Data MongoDB* edition.


**Can I switch between editions?**  
Yes. Flamingock provides an importer that allows you to migrate seamlessly from a **Community Edition to the Cloud Edition**, making it easy to adopt a fully managed backend for storing internal data.

If you are working with different Community Editions that use the **same underlying store** (such as MongoDB), and they share the same structure and collection for storing metadata, it is possible to switch between them with minimal adjustments. This enables flexible integration depending on your preferred access layer, such as switching from the MongoDB Java Driver edition to the Spring Data edition.


**Is Flamingock compatible with Spring Boot profiles?**  
Yes. You can conditionally run ChangeUnits using [`@Profile`](./springboot-integration/profiles.md), allowing changes to vary by environment.

---

### Behaviour and execution

**Does Flamingock guarantee idempotent execution?**  
Yes. Each `ChangeUnit` has a unique ID and Flamingock ensures it runs only once per system, even across multiple instances.

**What happens if a ChangeUnit execution fails midway?**  
When a `ChangeUnit` fails during execution, Flamingock handles the situation based on whether a transactional context is active:
Flamingock always try to rollback the failed changes. In a transactional environment, Flamingock relies on the database transactional mechanism to rollback the changes(`@Execution` method) as well as the Flamingock metadata associated to the change. 

In summary it would be like that change was never started. In a non-transactional environment, Flamingock manually tries to rollback the change by executing the `@RollbackExecution` method (if present) and marks the change entry as `ROLLED_BACK` in the database. Please notice that although Flamingock will try its best to achieve this, it's not guaranteed.

Once the rollback operation is performed, Flamingock will abort the execution and throw an exception. The next time Flamingock is executed will carry on from the failed ChangeUnit. You need to understand that if the ChangeUnit keep failing, Flamingock will keep aborting. In an self-deployed infrastructure like Kubernetes this potentially means get into an infinite loop.

**How can I ensure changes are transactional?**  
If your database supports transactions (e.g. MongoDB ≥ 4.0 in replica set), you can enable them using [Flamingock’s transaction config](./transactions.md).

**Should I implement the @RollbackExecution method in transactional environments?**

Yes, we highly recommend to implement the `@RollbackExecution` method. The main reason for this is that some other operations like undo, rely on this method to work. However it's a very good practice as it provides a robust system that is less affected when moving to non-transactional environments.

**Can I react to the execution of a ChangeUnit from my application?**  
Yes. Flamingock provides an event system that allows your application to listen to key lifecycle moments, such as when a `ChangeUnit` starts or finishes execution. These events can be used to trigger logging, monitoring, or other side effects external to the change execution logic itself.

This enables loose coupling between Flamingock’s core execution and your application-level behaviour, without modifying the `ChangeUnit` directly.

For more details, see the [Events](events.md) guide.

---

### Configuration

**Where do I set MongoDB connection options like write concern or read preference?**  
You can define these directly in the config using dedicated properties (e.g. `mongodb.writeConcern.w`, `readPreference`, etc.). Refer to the [extra configuration](./client-configuration/extra-configuration.md) section for detailed examples.

**Can I inject Spring beans or other services into my ChangeUnits?**  
Yes. Flamingock supports full [dependency injection](./client-configuration/changeunit-dependency-injection.md) in both Spring and non-Spring environments.

**Can I define ChangeUnit dependencies and execution order?**  
Yes. ChangeUnits can declare dependencies via annotations or configuration metadata. See [ChangeUnit deep dive](./overview/changeunits_deep_dive.md) for more.

---

### Testing and development

**How do I test Flamingock ChangeUnits?**  
You can perform [unit](./testing/unit-testing.md), [integration](./testing/integration-testing.md), and [Spring Boot integration](./testing/springboot-integration-testing.md) tests using test runners and mocking utilities.

**Can I use templates to generate ChangeUnits?**  
Yes. Flamingock offers a templating mechanism for [creating new ChangeUnits](./templates-how-to-use.md) and defining reusable components.

---

### Migrating from Mongock

**What’s the relationship between Flamingock and Mongock?**  
Flamingock is the direct evolution of Mongock. While it inherits the core idea of tracking and executing changes reliably, Flamingock is a complete architectural and conceptual redesign aimed at overcoming the limitations of Mongock.

Some of the key advancements introduced by Flamingock include:

- **Cloud-native capabilities**: Support for cloud-managed storage and execution, enabling Flamingock to run in distributed, serverless, or ephemeral environments without additional setup.
- **Execution stages and pipelines**: A structured way to group and orchestrate ChangeUnits by context, environment, or lifecycle stage.
- **Modular architecture**: Clean separation of core, editions, templates, and integrations, enabling better extensibility and maintainability.
- **Template-based ChangeUnits**: An additional declarative mechanism to define reusable changes without writing Java code, accelerating development and standardisation.

While Flamingock retains conceptual compatibility with Mongock, it represents a significant leap forward in flexibility, scalability, and developer experience.

If you are currently using Mongock, we encourage you to [review the migration guide](migration-from-mongock.md) and explore what Flamingock can offer in modern change management.

---

### Other

**Is Flamingock open-source?**  
Yes. Flamingock Community Edition is open-source, and there are additional [cloud features](./cloud-edition.md) in the roadmap.

**Is there a CLI available?**  
A [CLI is planned](./cli-coming-soon.md), but not yet available. Stay tuned.

---

If your question is not listed here, please check the corresponding edition’s guide or open an issue on our GitHub repository.
