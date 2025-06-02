---
title: Audit Store vs. Target System
sidebar_position: 15
---

# Audit Store vs. Target System

In Flamingock, it is important to distinguish between two very different roles that external systems can play:

## Audit Store

The audit store is the dedicated persistence layer where Flamingock records metadata about each change unit’s execution. Its sole purpose is to capture, in an append-only log, exactly which change units ran, when they ran, who initiated them, and whether they succeeded or failed (along with any error details). This information is used to:

- **Prevent duplicate applications**  
  By checking the audit store before running a change unit, Flamingock guarantees each change is executed at most once.

- **Track change history**  
  You can query the audit store to see all previously applied changes, filter by author or date range, and generate reports.

- **Coordinate distributed execution**  
  In a clustered environment, Flamingock nodes consult the audit store to decide which change units still need to run—and to know which locks are held.

- **Drive rollbacks and “undo” operations**  
  Since each audit entry captures rollback availability, Flamingock can navigate backward through the audit store to revert a series of changes in reverse order.

Depending on your setup, the audit store may be:

- A user-provided database (for Community Edition). For example, if you run CE with MongoDB, Flamingock writes audit records into a MongoDB collection.
- Flamingock’s own cloud backend (for Cloud Edition). In that case, the audit store is a managed, multi-tenant service that you never host yourself.

In summary, the audit store exists solely to record what happened—and to ensure consistency and idempotency across deployments.

## Target System

A target system is any external resource or service upon which a change unit’s logic operates. When you write a change unit, you define `@Execution` and `@RollbackExecution` methods that perform actions against a target system—such as:

- A database schema (e.g., creating a new column in your relational database)
- A NoSQL data store (e.g., creating a new collection or index in MongoDB)
- A cloud service (e.g., creating an S3 bucket or configuring a CloudFormation stack)
- A messaging backbone (e.g., creating a new Kafka topic, configuring permissions, or updating an existing schema)
- A configuration service (e.g., updating a feature-flag in Consul or Vault)
- Even another microservice’s REST API

The key point is that the target system is where changes must actually be applied—and those changes must occur exactly once (or be rolled back) to keep your application and its ecosystem in sync. Flamingock orchestrates these operations in a deterministic, ordered fashion, but the target system itself is whatever resource or service your change unit code touches.

## Why the Distinction Matters

Because Flamingock originated from Mongock (which treated the database both as audit store and change target), it’s common to conflate these two roles. In practice:

- **When a relational or NoSQL database serves as both audit store and change target** (for example, CE running on MongoDB):
    - Flamingock writes an audit-entry document into the same database where your data resides.
    - For DML or DDL change units that modify that same database, Flamingock can wrap both the change and the audit insert in a single transaction—ensuring “all-or-nothing” consistency.

- **When the change target is a different system** (for example, creating S3 buckets or updating Kafka topics):
    - The audit store remains your chosen audit database or Flamingock’s cloud backend.
    - Flamingock cannot wrap, say, an S3 API call and the audit insert inside a single transaction, because those systems do not share a common transaction coordinator.
    - Instead, Flamingock’s audit store logs the change unit as “executed” only after your `@Execution` method completes without error; if that `@Execution` code fails, Flamingock calls your `@RollbackExecution` (when you set `transactional = false`). The audit store entry is only written once you confirm the change succeeded.

- **In Cloud Edition with distributed transaction protocol (for a transactionally-capable target like an RDBMS)**:
    - Flamingock writes a small “intent” or “flag” record in your own database before it writes the audit entry to the cloud store.
    - After successfully committing your database change, Flamingock finalizes the audit record in the cloud. If anything fails at any step, Flamingock can roll everything back or clean up partial intent entries. This protocol ensures that, even though the audit store lives in the cloud, your RDBMS change and the audit record remain effectively atomic from Flamingock’s perspective.

### Illustration

Consider an application with these two change units:

- **_0001_CreateUserTableChange**
    - **Targets:** Relational database (PostgreSQL)
    - **Audit store:** Same PostgreSQL instance (CE) or Flamingock Cloud (Cloud Edition)
    - **Transactional behavior (CE):** Wrapped in a single DB transaction—so both the table creation and the audit insert happen or fail together.
    - **Transactional behavior (Cloud):** Uses Flamingock’s distributed transaction protocol to guarantee atomicity between the RDBMS and the cloud audit store.

- **_0002_ConfigureS3BucketChange**
    - **Targets:** Amazon S3 (creating a bucket)
    - **Audit store:** MongoDB (CE) or Flamingock Cloud
    - **Transactional behavior:** `@ChangeUnit(transactional = false)`
        - Flamingock calls S3’s `createBucket`.
        - If that succeeds, Flamingock writes an audit entry to your MongoDB audit collection (or to the cloud audit store).
        - If the S3 call fails, Flamingock invokes your `@RollbackExecution` (deleting the bucket or cleaning up) and does not record an audit entry.

In this example, the PostgreSQL instance is both a change target (for the first change) and an audit store (for CE). Meanwhile, S3 is only a change target—and must be paired with the audit store in a separate system.

## Key Takeaways

- **Audit Store**
    - Record of “what ran when and by whom”
    - Used to prevent duplicates, drive rollbacks, and coordinate distributed execution
    - Hosted in your chosen database (CE) or Flamingock’s cloud backend (Cloud Edition)

- **Target System**
    - The actual resource being modified (database tables, S3 buckets, Kafka topics, config services, and so on)
    - Change units call external APIs or drivers against this system
    - May or may not support transactions; if it does, Flamingock can co-ordinate with the audit store (via CE’s DB transaction or Cloud’s distributed protocol)

Distinguishing these two roles makes it clear that Flamingock’s core value lies in coordinating audit and execution—across arbitrary target systems—rather than assuming both duties are performed by the same database. This clarity ensures you can design your change units and architecture with the proper expectations around consistency, rollback, and idempotency.
