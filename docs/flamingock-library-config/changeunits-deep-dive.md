---
title: ChangeUnits Deep Dive
sidebar_position: 3
---

# ChangeUnits Deep Dive

## 1. Introduction: Understanding ChangeUnits

A **ChangeUnit** is the atomic, versioned, self-contained unit of change in Flamingock.  
It encapsulates logic to evolve [**target systems**](../overview/audit-store-vs-target-system.md) safely, deterministically, and with complete auditability.

**Key characteristics:**
- Executed in sequence based on their `order`
- Recorded in the audit store to prevent duplicate execution
- Safe by default: if Flamingock is uncertain about a change's outcome, it stops and requires manual intervention
- Each ChangeUnit runs exactly once per system

---

## 2. Structure of a ChangeUnit

### Required Properties
- **`id`**: Unique identifier across all ChangeUnits in the application  
- **`order`**: Execution sequence (must use zero-padded format like `0001`, `0002`, `_0001_ChangeName`)  
- **`author`**: Who is responsible for this change  

### Optional Properties
- **`description`**: Brief explanation of what the change does  
- **`transactional`** (default `true`): Only relevant if the target system supports transactions. Has no effect on non-transactional systems like S3 or Kafka.  

### Required Annotations and Methods
- **`@TargetSystem`**: Specifies which system this change affects  
- **`@ChangeUnit`**: Marks the class as a ChangeUnit  
- **`@Execution`**: The method containing your change logic  
- **`@RollbackExecution`**: The method to undo the change (required for safety and governance)  

> **Note:** Rollback is important because in **non-transactional systems**, it's be used to revert changes if execution fails. In **all systems**, rollback is essential for undo operations (via CLI or UI).  

## 3. Types of ChangeUnits

### Code-based ChangeUnits
Written in Java (or Kotlin/Groovy) with annotations. Best for **specific jobs** or when you need a **flexibility window** that isn’t covered by an existing template.  

This approach gives you full programmatic control, making it the fallback option when no reusable template exists for your use case.

```java
@TargetSystem("user-database")
@ChangeUnit(id = "add-user-status", order = "0001", author = "dev-team")
public class _0001_AddUserStatus {
    
    @Execution
    public void execute(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(new Document(), 
                            new Document("$set", new Document("status", "active")));
    }
    
    @RollbackExecution
    public void rollback(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(new Document(), 
                            new Document("$unset", new Document("status", "")));
    }
}
```

### Template-based ChangeUnits
Template-based ChangeUnits use YAML or JSON definitions. They are especially useful for **repetitive or parameterized operations**, where the same logic can to be applied multiple times with different configurations.

- The execution logic is encapsulated in a **template** (provided by Flamingock, a contributor, or created by you).  
- Each ChangeUnit then supplies its own configuration to apply that logic consistently.  
- This approach ensures **immutability** (the YAML/JSON file itself represents the change) and makes it easier to **reuse proven patterns**.


```yaml
# File: _0002_add_status_column.yml
id: add_status_column
order: "0002"
author: "db-team"
description: "Add status column to orders table"
templateName: sql-template
templateConfiguration:
  executionSql: |
    ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  rollbackSql: |
    ALTER TABLE orders DROP COLUMN status;
```

Both types follow the same execution model and provide the same safety guarantees.

## 4. Naming & Discoverability

### Enforced Naming Convention
All ChangeUnit files (both code and templates) **must** follow this pattern:

- **Format**: `_XXXX_DescriptiveName`
- **Order**: Must be at least 4 digits, zero-padded (e.g., `0001`, `0002`, `0100`)
- **Examples**: 
  - Code: `_0001_CreateUserIndexes.java`
  - Template: `_0002_AddStatusColumn.yml`

### Why This Convention?
- **Visibility**: Easy to see execution order at a glance
- **Immutability**: Clear versioning prevents accidental modifications
- **Deterministic ordering**: Ensures consistent execution across environments

### File Locations
- **Code-based**: Place in packages scanned by Flamingock (default: `src/main/java`)
- **Template-based**: Place in `src/main/resources` or preferably alongside code-based ChangeUnits
- **Recommendation**: Keep all ChangeUnits (code and templates) in the same package/directory for better organization

## 5. Transactional Behavior

- **Transactional target systems** (e.g., MongoDB, PostgreSQL): operations run within a transaction **unless you explicitly set `transactional = false`**.  
- **Non-transactional target systems** (e.g., S3, Kafka): the `transactional` flag has no effect — operations are applied without transactional guarantees.

Some operations may require setting `transactional = false` even in databases:
- DDL operations (e.g., CREATE INDEX, ALTER TABLE)
- Large bulk operations that exceed transaction limits
- Cross-system changes spanning multiple databases

➡️ To understand how to define and configure **target systems**, see [Target System Configuration](../overview/audit-store-vs-target-system.md)

## 6. Default Safety & Recovery

**Flamingock's core principle**: If a ChangeUnit execution result is uncertain, Flamingock stops and requires manual intervention. This prevents silent data corruption.

**What this means:**
- If a change fails, Flamingock halts execution
- The issue is recorded in the audit store
- Manual investigation and resolution is required via CLI (or Cloud UI in Cloud Edition)

➡️ **For advanced recovery strategies**, see [Recovery Strategies](../recovery-and-safety/recovery-strategies.md)

## 7. Best Practices

### Core Principles
- **Treat ChangeUnits as immutable**: Once deployed, never modify existing ChangeUnits. Create new ones for corrections.
- **Always provide @RollbackExecution**: Important for CLI undo operations and recovery scenarios.
- **Keep scope focused**: One ChangeUnit should address one logical change.

### Technical Guidelines
- **Make operations idempotent when possible**: Try to design changes that can be safely re-run.
- **Test both execution and rollback**: Include ChangeUnit testing in your CI/CD pipeline.
- **Follow naming conventions**: Use the `_XXXX_DescriptiveName` pattern consistently.

### Organizational Best Practices
- **Clear authorship**: Always specify the `author` for accountability.
- **Version control discipline**: Review ChangeUnits in pull requests like any critical code.
- **Document complex changes**: Use the `description` field to explain non-obvious logic.
- **Maintain change logs**: Keep a high-level record of what changes were made when.


---

**Next Steps:**
- Learn about [dependency injection](./changeunit-dependency-injection.md) in ChangeUnits
- Explore [template-based ChangeUnits](../templates/templates-introduction.md) for declarative changes
- Understand [advanced recovery strategies](../recovery-and-safety/recovery-strategies.md) for production scenarios