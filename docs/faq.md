---
title: FAQ
sidebar_position: 150
---

## Introduction

This FAQ addresses frequent questions users may have when incorporating Flamingock into their applications.

---

### Getting started

**Should I use a template-based or code-based ChangeUnit?**  
Choose template-based ChangeUnits to eliminate boilerplate for common tools and integrations (SQL DDL, SaaS/API, etc) and for your custom ChangeUnits by defining changes declaratively in YAML or JSON.
Use code-based ChangeUnits when you need custom or conditional logic in Java.
See: [Template introduction](templates/templates-introduction.md)

**Can I integrate Flamingock into a Spring Boot application?**  
Yes, you can. You just need to import the Spring Boot integration module and annotate you main application with [`@EnableFlamingock`](./springboot-integration/introduction.md).
See: [Spring Boot integration](./springboot-integration/introduction.md)

**Can I use Flamingock without Spring Boot?**  
Yes. You can use Flamingock in any Java application by configuring it manually using the [`FlamingockBuilder`](./get-started.md#5-configure-flamingock). This approach is ideal for applications that do not rely on Spring Boot or that require finer control.

**What Java version is required?**  
Flamingock’s core engine runs on Java 8 and above. However, some optional integration modules (such as the Spring Boot support) target more recent ecosystems and require Java 17+. For those cases we publish two artifacts:

- A modern module (e.g., flamingock-springboot-integration) built for Java 17+ and Spring Boot 3.x
- A legacy counterpart (e.g., flamingock-springboot-integration-v2-legacy) compatible with Java 8 and Spring Boot 2.x

Most users on Java 8 can stick with the core and legacy integrations; if you’re on Java 17 or newer, simply use the up-to-date modules.

**Is it possible to use Flamingock in GraalVM native images?**  
Yes, Flamingock provides a dedicated [GraalVM integration guide](./graalvm.md). Ensure your dependencies and reflection requirements are correctly configured.

---

### Editions and compatibility

**What edition of Flamingock should I use?**  
Flamingock is available in three flavors—pick the one that best fits your needs and operational model:

1. [**Cloud Edition (SaaS)**](./overview/Editions#%EF%B8%8F-flamingock-cloud-edition-coming-soon)

    A fully managed, enterprise-grade service hosted by Flamingock:

    - Zero ops: no infrastructure to manage, no database to configure
    - Enterprise features: cross-service dashboards, RBAC, team & environment management, fully support for templates, batching, etc.
    - 24×7 support & SLAs and seamless upgrades

    Perfect for teams that need scalability, governance, and out-of-the-box observability.

2. [**Self-hosted Edition**](./overview/Editions#-flamingock-self-hosted-edition-coming-soon)

    All the same features as our Cloud Edition—dashboards, governance, transaction protocols—but deployed into your own infrastructure (on-premises or in your VPC):

    - Full feature parity with SaaS Cloud
    - Data residency & compliance: you control where audit records live

    Ideal for organizations that require enterprise capabilities but cannot—or prefer not to—consume a hosted SaaS.

3. [**Community Edition**](./overview/Editions#-community-edition-open-source)

    Open-source, self-hosted library you run alongside your application:

    - Lightweight & free: you supply your own audit store (MongoDB, DynamoDB, Couchbase, etc.)
    - Core capabilities: ChangeUnits, audit logging, distributed locking, and transactional consistency where supported

    Perfect for smaller teams or projects that need a robust, code-centric change framework.


**Can I switch between editions?**  
Yes. Flamingock provides an importer that allows you to migrate seamlessly from a **Community Edition to the Cloud Edition**, making it easy to adopt a fully managed backend for storing internal data.

If you are working with different Community Editions that use the **same underlying store** (such as MongoDB), and they share the same structure and collection for storing metadata, it is possible to switch between them with minimal adjustments. This enables flexible integration depending on your preferred access layer, such as switching from the MongoDB Java Driver edition to the Spring Data edition.

---

### Behaviour and execution

**Does Flamingock guarantee idempotent execution?**  
Yes. Each `ChangeUnit` has a unique ID and Flamingock ensures it runs only once per system, even across multiple instances.

**What happens if a ChangeUnit execution fails midway?**  
When a `ChangeUnit` fails during execution, Flamingock handles the situation based on whether a transactional context is active:
Flamingock always try to rollback the failed changes. In a transactional environment, Flamingock relies on the database transactional mechanism to rollback the changes(`@Execution` method) as well as the Flamingock metadata associated to the change. 

In summary it would be like that change was never started. In a non-transactional environment, Flamingock manually tries to rollback the change by executing the `@RollbackExecution` method (if present) and marks the change entry as `ROLLED_BACK` in the database. Please notice that although Flamingock will try its best to achieve this, it's not guaranteed.

Once the rollback operation is performed, Flamingock will abort the execution and throw an exception. The next time Flamingock is executed will carry on from the failed ChangeUnit. It is important to note that if the ChangeUnit fails, the Application startup will exit as Flamingock will abort. This behaviour will repeat until the ChangeUnit has executed successfully.

**How can I ensure changes are transactional?**  
If your database supports transactions (e.g. MongoDB ≥ 4.0 in replica set), you can enable them using [Flamingock’s transaction config](./transactions.md).

**Should I implement the @RollbackExecution method in transactional environments?**

Yes, we highly recommend to implement the `@RollbackExecution` method. The main reason for this is that some other operations like undo, rely on this method to work. However it's a very good practice as it provides a robust system that is less affected when moving to non-transactional environments.

**Can I react to the execution of Flamingock from my application?**  
Yes. Flamingock provides an event system that allows your application to listen to key lifecycle moments, such as when a `ChangeUnit` starts or finishes execution. These events can be used to trigger logging, monitoring, or other side effects external to the change execution logic itself.

This enables loose coupling between Flamingock’s core execution and your application-level behaviour, without modifying the `ChangeUnit` directly.

For more details, see the [Events](events.md) guide.

**Is Flamingock compatible with Spring Boot profiles?**  
Yes. You can conditionally run ChangeUnits using [`@Profile`](./springboot-integration/profiles.md), allowing changes to vary by environment.

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
Yes. The Flamingock client library — used across all editions, including Community, Self-managed, and Cloud — is fully open-source.

For the Cloud and Self-managed editions, additional enterprise components such as the server runtime, dashboards, and governance tools are provided under a commercial licence. These components build on top of the open-source core to deliver advanced features like observability, orchestration, and centralised management.

**Is there a CLI available?**  
A [CLI is planned](./cli-coming-soon.md), but not yet available. Stay tuned.

---

If your question is not listed here, please check the corresponding edition’s guide or open an issue on our GitHub repository.
