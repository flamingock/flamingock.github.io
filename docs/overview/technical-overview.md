---
sidebar_position: 90
---

# Flamingock Technical Overview

Welcome to the **Technical Overview** of Flamingock — a flexible framework designed to help you manage and audit changes of any kind across your systems and services.

Building on the foundations of Mongock, Flamingock goes beyond traditional database migrations to support a wide range of change types, including data updates, configuration adjustments, API evolutions, and system integrations — all with a consistent, traceable, and repeatable approach.

This document introduces Flamingock’s core concepts and outlines its architecture to help you understand how it simplifies the orchestration of system changes.

---

## Architectural Overview

In a nutshell, the Flamingock process takes all the pending changes and executes them in order during your Application startup process.

1. **Application Startup**  → Initializes the **Runner**.
2. **Runner** scans and loads all registered **ChangeUnits**.
3. **Drivers** communicate with an underlying component that varies by edition.
   - In Flamingock CE, this component is a simple storage layer (e.g., MongoDB, DynamoDB).
   - In the Cloud and Self-Hosted editions, the driver connects to a more sophisticated Flamingock backend that includes orchestration, auditing, and support for advanced operational features.
4. **ChangeUnits** execute in a coordinated **workflow**, optionally using templates.
5. **Distributed Locking** ensures safe execution in distributed environments.
6. All executions are **audited** and can be **rolled backed**.

Flamingock is designed to either apply all defined changes successfully or fail early. On the next run, it will resume from the last failed change.

![Flamingock Architecture Diagram](../../static/img/Flamingock%20Arch%20HLD.png)

### A more detailed process steps
Flamingock process follows the next steps:

1. The runner/builder loads the pipeline of execution of changes.
2. The runner loads the files storing the changes desired (changeUnits).
3. The runner checks if there is pending change to execute.
4. The runner acquires the distributed lock through the driver.
5. The runner loops over the ChangeUnits (change files) in order.
6. Takes the next ChangeUnit and executes it.
- If the ChangeUnit is successfully executed, Flamingock persists an entry in the Flamingock change history with the state SUCCESS and start the step 5 again.
- If the ChangeUnit fails, the runner rolls back the change. If the driver supports transactions and transactions are enabled, the rollback is done natively. When the driver does not support transactions or transactions are disabled, the method @RollbackExecution is executed. In both cases the ChangeUnit failed, whereas in the latter option, and entry is added in the changelog that a change has been rolled back.
- If the runner acomplished to execute the entire migration with no failures, it's considered successful. It releases the lock and finishes the migration.
On the other hand, if any ChangeUnit fails, the runner stops the migration at that point and throws an exception. When Flamingock is executed again, it will continue from the failure ChangeUnit(included).
