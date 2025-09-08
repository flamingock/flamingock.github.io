---
title: Key features
sidebar_position: 50
---
# Key Features

Flamingock brings **safety, auditability, and developer productivity** into the way distributed systems evolve.  
These are the pillars you can rely on today, plus a glimpse of what’s coming next.



### Safety by Default
- If Flamingock cannot guarantee a safe outcome, it stops automatically.  
- Prevents silent corruption in production systems and ensures predictable deployments.  

---

### Change-as-Code (CaC)
- Define changes as **versioned ChangeUnits** that are executed once, safely, and auditable.  
- All changes are tracked in the audit store and never silently skipped.  
- Guarantees immutability: once applied, a ChangeUnit cannot be modified.  

---

### Dual Approach: Code and Templates
Flamingock supports two complementary approaches for defining ChangeUnits:  

- **Code-based ChangeUnits**: Full control using Java/Kotlin classes, annotations, and dependency injection.  
- **Template-based ChangeUnits**: Declarative, YAML-based changes that reuse shared templates.  

:::note 
Templates are in **beta**. You can already create and use custom templates, while official ones are still evolving.  
:::

---

### Target System Abstraction
- Explicitly declare the **systems you evolve** (databases, queues, APIs, S3, etc.).  
- Transactional target systems are executed within transactions where possible.  
- Non-transactional systems are safeguarded through audit tracking and rollback mechanisms.  

---

### Immutable, Auditable History (Audit Store)
- All executions are recorded in a dedicated audit store, decoupled from business data.  
- Provides a **single source of truth** for compliance, governance, and troubleshooting.  

---

### Staging and Grouping
- Organize ChangeUnits into **stages** for modularity and separation of concerns.  
- Execute subsets of changes independently while maintaining global audit consistency.  

---

### Startup Synchronization
- Flamingock executes during **application startup**.  
- Ensures your service and its dependent systems are aligned before going live.  

---

### Developer Experience
- Built-in dependency injection for clean and testable change logic.  
- Seamless Spring Boot integration with minimal setup.  
- GraalVM support for native image compilation.  

---

### CLI
- A lightweight CLI is available today for **maintenance and recovery**.  
- Capabilities include:  
  - Listing the history of executed changes  
  - Auditing change status  
  - Managing fixes in recovery scenarios  

---

### What about the Cloud Edition?
The **Cloud Edition** is coming soon, extending Flamingock with **additional enterprise-grade features**.  