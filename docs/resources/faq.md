---
title: FAQ
sidebar_position: 160
---

## Introduction

This FAQ addresses frequent questions about Flamingock, from basic usage to advanced recovery strategies and operational concerns.


### Getting started

**Should I use a template-based or code-based ChangeUnit?**  
Choose template-based ChangeUnits to eliminate boilerplate for common tools and integrations (SQL DDL, SaaS/API, etc) and for your custom ChangeUnits by defining changes declaratively in YAML or JSON.
Use code-based ChangeUnits when you need custom or conditional logic in Java.
See: [Template introduction](templates/templates-introduction.md)

**Can I integrate Flamingock into a Spring Boot application?**  
Yes, you can. You just need to import the Spring Boot integration module and annotate you main application with [`@EnableFlamingock`](../frameworks/springboot-integration/introduction#automatic-setup).
See: [Spring Boot integration](../frameworks/springboot-integration/introduction.md)

**Can I use Flamingock without Spring Boot?**  
Yes. You can use Flamingock in any Java application by configuring it manually using the [`FlamingockBuilder`](../overview/quick-start#5-configure-flamingock-runtime). This approach is ideal for applications that do not rely on Spring Boot or that require finer control.

**What Java version is required?**  
Flamingock’s core engine runs on Java 8 and above. However, some optional integration modules (such as the Spring Boot support) target more recent ecosystems and require Java 17+. For those cases we publish two artifacts:

- A modern module (e.g., flamingock-springboot-integration) built for Java 17+ and Spring Boot 3.x
- A legacy counterpart (e.g., flamingock-springboot-integration-v2-legacy) compatible with Java 8 and Spring Boot 2.x

Most users on Java 8 can stick with the core and legacy integrations; if you’re on Java 17 or newer, simply use the up-to-date modules.

**Is it possible to use Flamingock in GraalVM native images?**  
Yes, Flamingock provides a dedicated [GraalVM integration guide](../frameworks/graalvm.md). Ensure your dependencies and reflection requirements are correctly configured.


### Compatibility

**Can I switch between different audit stores?**
If you are working with different audit stores that use the **same underlying database** (such as MongoDB), and they share the same structure and collection for storing metadata, it is possible to switch between them with minimal adjustments. This enables flexible integration depending on your preferred access layer, such as switching from the MongoDB Java Driver to the Spring Data implementation.


### Behaviour and execution

**Does Flamingock guarantee idempotent execution?**  
Yes. Each `ChangeUnit` has a unique ID and Flamingock ensures it runs only once per system, even across multiple instances.

**What happens if a ChangeUnit execution fails midway?**  
Flamingock's behavior depends on your recovery strategy configuration:

**With MANUAL_INTERVENTION (default)**:
1. **Transactional changes**: Database automatically rolls back, issue logged for manual review
2. **Non-transactional changes**: `@RollbackExecution` method called, issue logged for manual review
3. **Resolution required**: Use CLI (`flamingock issue get`, then `flamingock audit fix`) to resolve after investigation

**With ALWAYS_RETRY**:
1. **Transactional changes**: Database automatically rolls back, automatic retry on next execution
2. **Non-transactional changes**: `@RollbackExecution` method called, automatic retry on next execution
3. **No manual intervention**: Continues until successful

This intelligent failure handling prevents silent data corruption and provides operational control.

**How can I ensure changes are transactional?**  
If your database supports transactions (e.g. MongoDB ≥ 4.0 in replica set), you can enable them using [Flamingock’s transaction config](../flamingock-library-config/transactions.md).

**Should I implement the @RollbackExecution method in transactional environments?**

Yes, we highly recommend to implement the `@RollbackExecution` method. The main reason for this is that some other operations like undo, rely on this method to work. However it's a very good practice as it provides a robust system that is less affected when moving to non-transactional environments.

**Can I react to the execution of Flamingock from my application?**  
Yes. Flamingock provides an event system that allows your application to listen to key lifecycle moments, such as when a `ChangeUnit` starts or finishes execution. These events can be used to trigger logging, monitoring, or other side effects external to the change execution logic itself.

This enables loose coupling between Flamingock’s core execution and your application-level behaviour, without modifying the `ChangeUnit` directly.

For more details, see the [Events](../flamingock-library-config/events.md) guide.

**Is Flamingock compatible with Spring Boot profiles?**  
Yes. You can conditionally run ChangeUnits using [`@Profile`](../frameworks/springboot-integration/profiles.md), allowing changes to vary by environment.


### Configuration

**Where do I set MongoDB connection options like write concern or read preference?**  
You can define these directly in the config using dedicated properties (e.g. `mongodb.writeConcern.w`, `readPreference`, etc.). Refer to the [extra configuration](../flamingock-library-config/extra-configuration.md) section for detailed examples.

**Can I inject Spring beans or other services into my ChangeUnits?**  
Yes. Flamingock supports full [dependency injection](../flamingock-library-config/changeunit-dependency-injection.md) in both Spring and non-Spring environments.

**Can I define ChangeUnit dependencies and execution order?**  
Yes. ChangeUnits can declare dependencies via annotations or configuration metadata. See [ChangeUnit deep dive](../flamingock-library-config/changeunits-deep-dive.md) for more.


### Testing and development

**How do I test Flamingock ChangeUnits?**  
You can perform [unit](../testing/unit-testing.md), [integration](../testing/integration-testing.md), and [Spring Boot integration](../testing/springboot-integration-testing.md) tests using test runners and mocking utilities.

**Can I use templates to generate ChangeUnits?**  
Yes. Flamingock offers a templating mechanism for [creating new ChangeUnits](../templates/templates-how-to-use.md) and defining reusable components.


### Migrating from Mongock

**What’s the relationship between Flamingock and Mongock?**  
Flamingock is the direct evolution of Mongock. While it inherits the core idea of tracking and executing changes reliably, Flamingock is a complete architectural and conceptual redesign aimed at overcoming the limitations of Mongock.

Some of the key advancements introduced by Flamingock include:

- **Cloud-native capabilities**: Support for cloud-managed storage and execution, enabling Flamingock to run in distributed, serverless, or ephemeral environments without additional setup.
- **Execution stages and pipelines**: A structured way to group and orchestrate ChangeUnits by context, environment, or lifecycle stage.
- **Modular architecture**: Clean separation of core, editions, templates, and integrations, enabling better extensibility and maintainability.
- **Template-based ChangeUnits**: An additional declarative mechanism to define reusable changes without writing Java code, accelerating development and standardisation.

While Flamingock retains conceptual compatibility with Mongock, it represents a significant leap forward in flexibility, scalability, and developer experience.

If you are currently using Mongock, we encourage you to [review the migration guide](upgrade-from-mongock.md) and explore what Flamingock can offer in modern change management.


### Recovery Strategies & Safety

**What are recovery strategies and why do I need them?**  
Recovery strategies determine how Flamingock handles failures - the key differentiator from traditional tools that retry blindly or fail silently. You choose between:
- **MANUAL_INTERVENTION** (default): Stop and alert for human review when uncertain
- **ALWAYS_RETRY**: Continue automatically until successful for idempotent operations

This prevents silent data corruption and gives you operational control based on your risk tolerance.

**When should I use MANUAL_INTERVENTION vs ALWAYS_RETRY?**  
**Use MANUAL_INTERVENTION for**:
- Financial transactions
- User data modifications  
- Critical business logic
- Non-idempotent operations
- Compliance-sensitive changes

**Use ALWAYS_RETRY for**:
- Cache warming operations
- Idempotent API calls
- Event publishing (with consistent keys)
- Configuration updates
- Index creation
- File operations with overwrite

**How do I know if my operation is idempotent?**  
An operation is idempotent if running it multiple times produces the same result as running it once. Examples:
- ✅ `SET user.status = 'active'` (same result every time)
- ✅ `CREATE INDEX IF NOT EXISTS` (safe to repeat)  
- ✅ File overwrite with same content
- ❌ `INCREMENT user.score` (different result each time)
- ❌ Append operations
- ❌ Time-sensitive calculations

**What is the issue resolution workflow?**  
1. **Detection**: `flamingock issue list` shows all unresolved issues
2. **Triage**: `flamingock issue get` provides next priority issue with guidance
3. **Investigation**: Check target system state (not audit store)
4. **Resolution**: `flamingock audit fix -c change-id --resolution APPLIED|ROLLED_BACK`

This structured workflow eliminates guesswork and provides complete audit trails.

**Can I change recovery strategies after deployment?**  
Yes, you can update the `@Recovery` annotation in your code and redeploy. Existing audit entries maintain their state, but new executions use the updated strategy.

**How does Cloud Edition improve recovery without changing my code?**  
Cloud Edition uses the same recovery strategies but provides enhanced outcomes through:
- **Intelligent automation**: Advanced reconciliation and marker mechanisms
- **Enhanced retry logic**: Sophisticated backoff and circuit breaker patterns  
- **Automatic issue resolution**: Many failures requiring manual intervention in Community Audit Stores are resolved automatically

Your change definitions remain identical - Cloud Edition just delivers better results.


### Enterprise & Operational Concerns

**How does Flamingock ensure data integrity in distributed systems?**  
Flamingock uses a dual-architecture separating target systems (where changes are applied) from audit store (execution tracking):
- **Complete audit trail**: Every change attempt recorded regardless of business system failures
- **Recovery capabilities**: CLI operates on audit state, you fix business systems
- **Compliance independence**: Audit integrity maintained during business system issues
- **Governance separation**: Business and compliance data have different access patterns

**What compliance and audit capabilities does Flamingock provide?**  
- **Complete execution history** with timestamp, author, system, and outcome
- **Issue tracking and resolution** workflows for failed changes
- **CLI-based audit management** for governance and compliance
- **Integration ready** for external observability platforms (ELK, Prometheus, Datadog)
- **Regulatory reporting** capabilities in Cloud Edition

**How does Flamingock compare to traditional migration tools?**  
| Aspect | Flyway/Liquibase | Mongock | Flamingock |
|--------|-----------------|---------|------------|
| **Focus** | SQL databases | MongoDB only | All systems |
| **Distributed Systems** | ❌ Not designed for | ❌ Limited | ✅ First-class support |
| **Non-transactional** | ❌ No support | ❌ Assumes transactions | ✅ Full support |
| **Failure Handling** | Retry blindly | Retry blindly | Configurable strategies |
| **Issue Resolution** | Manual SQL | None | CLI + Cloud automation |
| **Safety Default** | None | None | MANUAL_INTERVENTION |

**Can Flamingock handle multi-system coordination?**  
Yes, Flamingock is designed for distributed systems. A single ChangeUnit can coordinate changes across multiple target systems (databases, APIs, message queues) while maintaining a unified audit trail and recovery strategy.

**How do I ensure my team adopts Flamingock safely?**  
1. **Start conservative**: Use MANUAL_INTERVENTION (default) initially
2. **Establish governance**: Define organization-wide recovery strategy guidelines
3. **Create runbooks**: Document investigation procedures for your changes
4. **Train on CLI**: Ensure team knows issue resolution workflow
5. **Monitor patterns**: Review failure patterns to optimize strategies over time

**What happens if the audit store goes down?**  
Flamingock's safety guarantee: **No business changes applied without proper audit tracking**. If the audit store is unavailable:
- Flamingock stops execution safely
- No changes are applied to target systems
- System remains in safe, known state
- Resume automatically once audit store connectivity is restored

**Can I use Flamingock in microservices architectures?**  
Absolutely. Flamingock is designed for distributed systems:
- Each microservice can have its own ChangeUnits for its domain
- Shared audit store provides cross-service visibility (especially in Cloud Edition)  
- CLI provides centralized operational control across all services
- Recovery strategies can be tailored per service's risk profile

**What are the organizational benefits of adopting Flamingock?**  
- **Risk reduction**: Prevent silent data corruption through safety-first defaults
- **Team velocity**: Eliminate deployment bottlenecks with autonomous change management
- **Operational excellence**: Centralized governance with distributed execution
- **Compliance automation**: Complete audit trails and governance workflows
- **Reduced dependencies**: Teams control their domain without infrastructure dependencies

**How does Flamingock support regulatory compliance requirements?**  
- **Complete audit trails** with immutable execution history
- **Governance workflows** for change approval and review
- **Issue resolution documentation** for regulatory reporting
- **CLI integration** for compliance automation
- **Separation of concerns** between business and compliance data
- **Cloud Edition features**: Advanced reporting, RBAC, multi-environment governance


### Other

**Is Flamingock open-source?**  
Yes. The Flamingock client library — used across all editions, including Community, Self-managed, and Cloud — is fully open-source.

For the Cloud and Self-managed editions, additional enterprise components such as the server runtime, dashboards, and governance tools are provided under a commercial licence. These components build on top of the open-source core to deliver advanced features like observability, orchestration, and centralised management.

**Is there a CLI available?**  
Yes! The [Flamingock CLI](../cli/cli.md) provides enterprise-grade operational control for issue resolution, audit management, and maintenance tasks.


If your question is not listed here, please check the corresponding edition’s guide or open an issue on our GitHub repository.
