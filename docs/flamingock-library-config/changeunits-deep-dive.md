---
title: ChangeUnits Deep Dive
sidebar_position: 3
---

## Clarifying changeUnits

A **ChangeUnit** is the atomic, versioned unit of change in Flamingock. It encapsulates logic to modify an external system (the [**target system**](./audit-store-vs-target-system.md)) and provides metadata and rollback capability. ChangeUnits are discovered and executed in a defined order to ensure deterministic, auditable changes.

### What a changeUnit Is
- **Self-contained change**  
  Each ChangeUnit includes:
  - A unique `id` (unique across the entire application)
  - An `order` determining execution sequence
  - An optional `author` and `description`
  - An `@Execution` method (or template) with the change logic
  - A `@RollbackExecution` method (or template) with compensating logic
  - A `transactional` flag (default `true`) indicating if Flamingock will attempt to wrap execution and audit in a single transaction

- **Versioned and Auditable**  
  ChangeUnits live in your source code or resources, and their execution is recorded in the [**audit store**](./audit-store-vs-target-system.md) to:
  - Prevent duplicate executions
  - Track history (who ran which change and when)
  - Drive rollbacks and “undo” operations

### What a changeUnit is not
- **Not a long-running job**  
  ChangeUnits should complete promptly. Flamingock needs to know the result (success or failure) before proceeding. Long-running or asynchronous operations can lead to unexpected behavior or retries.
- **Not a general-purpose script**  
  While ChangeUnits run code, they are not intended for arbitrary scripting. Their role is to apply deterministic, idempotent changes that evolve your target systems in sync with your application.

---

## ChangeUnit properties

Every ChangeUnit must define:
- `id` (String): Unique across all ChangeUnits in the application.
- `order` (String or numeric): Defines execution order (evaluated lexicographically or numerically).
- `author` (String): Who is responsible for the change.
- `description` (String, optional): Brief explanation of the change.
- `transactional` (boolean, default `true`): Whether Flamingock will attempt to wrap the change and audit insert in one transaction (if the target system and audit store support transactions).

---

## Types of changeUnits

ChangeUnits can be defined based on two approaches: code-based and [template-based](../templates/templates-introduction.md)

### Code-based changeUnits
Code-based ChangeUnits are written in Java (or Kotlin/Groovy) with annotations:

```java
@ChangeUnit(
        id = "create_s3_bucket", 
        order = "0001", 
        author = "dev-team", 
        transactional = false,
        description = "Create my-app-bucket S3 bucket")
public class _0001_CreateS3BucketChange {

  @Execution
  public void execute(S3Client s3Client) {
    s3Client.createBucket("my-app-bucket");
  }

  @RollbackExecution
  public void rollback(S3Client s3Client) {
    s3Client.deleteBucket("my-app-bucket");
  }
}
```

#### Discoverability & execution
- **Location**: Files must reside in a source package scanned by Flamingock (default: `src/main/java`).
- **Naming**: Class names should match `_ORDER_name` (e.g., `_0001_CreateS3BucketChange`) to simplify ordering and visibility.
- **Dependencies**: Flamingock injects dependencies (e.g., `S3Client`, `MongoClient`) via Spring or builder-based DI.

### Template-based changeUnits
Template-based ChangeUnits use YAML or JSON definitions. Example (SQL DDL):

```yaml
# /src/main/resources/_0003_add_status_column.yml
id: add_status_column
order: 0003
author: "db-team"
description: "Add 'status' column to 'orders' table"
templateName: sql-template
templateConfiguration:
  executionSql: |
    ALTER TABLE orders ADD COLUMN status VARCHAR(20);
  rollbackSql: |
    ALTER TABLE orders DROP COLUMN status;
```

#### Discoverability & execution
- **Location**: While Flamingock will scan src/main/resources by default, we **strongly recommend** placing template files in the same code‐package/directory as your code‐based ChangeUnits.
    - This ensures that both code‐based and template‐based ChangeUnits live side by side for visibility and immutability.
- **Naming**: File names should follow `_ORDER_name.yml` or `_ORDER_name.json`.
- **Advantages**:
  - Easier immutability: The YAML/JSON file itself represents the change, avoiding modifications in code.
  - Better for simple, repeatable tasks (e.g., SQL DDL).

---

[//]: # (## How ChangeUnits Are Discovered & Executed)

[//]: # ()
[//]: # (Flamingock uses **classpath scanning** to locate ChangeUnits:)

[//]: # ()
[//]: # (- **Code-based**: Scans specified packages for classes annotated with `@ChangeUnit` or `@Change`.)

[//]: # (- **Template-based**: Scans specified resource directories for YAML/JSON files matching pattern `_.*\.&#40;yml|json&#41;`.)

[//]: # ()
[//]: # (Flamingock builds a **pipeline** of stages and executes ChangeUnits in ascending order based on `order`.)

[//]: # ()
[//]: # (---)

## Considerations

### Transactional behavior
- **Transactional changes (default)**: When the target system and audit store share a transactional context (e.g., MongoDB CE), Flamingock wraps both in a single transaction.
- **Non-transactional changes**: `transactional = false`. Flamingock executes `@Execution` and, upon success, writes to the audit store. If `@Execution` fails, Flamingock invokes `@RollbackExecution`. See [transactions page](../flamingock-library-config/transactions.md)
    

### Immutability
- **Code-based**: Once committed and possibly executed, avoid modifying the class. Instead, introduce a new ChangeUnit for evolution.
- **Template-based**: Treat the file as immutable. Modifying an existing template breaks history ordering — use new template files for new changes.

### Audit store constraints
- **Single audit store per application**: All ChangeUnits in one application write to the same audit store.
- **Audit store integrity**: Do not manually modify audit records in the audit store; this can corrupt Flamingock’s state. Use CLI/UI for supported modifications.

### Idempotency
- ChangeUnits should be idempotent or safe to re-run. Flamingock retries failed ChangeUnits on next startup. If a non-transactional ChangeUnit partially succeeded, ensure it can handle multiple executions or include appropriate guards.

---

## Best practices

**Name and location conventions***  
  - Place both code-based and template-based ChangeUnits in the same source package/directory for visibility and immutability.  
  - Use filenames or class names prefixed with the zero-padded order (e.g., `_0001_create_s3_bucket.java` or `_0001_create_s3_bucket.yaml`).

- **Always provide rollback**  
  Even for transactional ChangeUnits, implement `@RollbackExecution` so CLI “undo” operations work smoothly.

- **Template-based changeUnits for simplicity and immutability**  
  Favor templated ChangeUnits (YAML/JSON) for routine, repeatable tasks—such as SQL DDL, configuration toggles, or small API calls. Templates are inherently immutable (being a static file), making it easier to adhere to versioning best practices.

- **Use Flamingock’s batching feature for long-running operations**(coming soon)  
  For ChangeUnits that process large workloads (e.g., migrating millions of rows), leverage Flamingock’s built-in batching mechanism. Define a single ChangeUnit that iterates through data in batches; Flamingock will mark it as complete only when all batches succeed, and will resume from the last processed batch on retry.

- **Inject minimal dependencies**  
  Only inject what you need (e.g., clients, DAOs). Avoid injecting large application contexts within ChangeUnits.

- **Write clear descriptions**  
  Use the `description` property to explain the purpose and impact of each ChangeUnit.

- **Implement idempotency**  
  For non-transactional operations (e.g., deleting an S3 bucket), wrap calls in checks (e.g., “if exists”) to handle re-runs gracefully.

- **Immutable operations**  
  Once a ChangeUnit is applied to any environment, treat its code or template as immutable. For corrections, create new ChangeUnits rather than editing old ones.

- **Explicit ordering**  
  Declare a clear, numeric `order` for each ChangeUnit. Relying on implicit or alphabetical ordering can introduce hidden dependencies and make debugging deployment issues difficult.

- **Audit store hygiene**  
  Never manually edit or delete records in the audit store. Direct modifications can corrupt Flamingock’s internal state and lead to unpredictable behavior or data loss. If you need to correct audit data, use Flamingock’s supported operations (CLI or UI) or follow documented recovery procedures.

- **Documentation and metadata**  
  Use the `author` and `description` (if available) fields to document the intent of each ChangeUnit. This metadata helps teams understand why a change was made and by whom—critical for code reviews and compliance audits.
