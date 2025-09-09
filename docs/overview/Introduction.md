---
sidebar_position: 10
sidebar_label: Introduction to Flamingock
title: " "
---

![Flamingock logo](../../static/img/Flamingock-04.png)  
*The safety-first platform for distributed system evolution*


## The Flamingock Guarantee
**"Your system will always be left in a known, auditable, and consistent state — no matter what happens."**

Managing change across an application and the distributed systems it interacts with is inherently complex — database schema updates, message broker configuration, API evolution, cloud service provisioning.  
Traditional tools optimize for the *happy path*, but real-world deployments face partial failures, network issues, and uncertain states.

**Flamingock** is built for this reality. It provides safety-first distributed system evolution with **complete auditability** and **configurable recovery strategies**, ensuring that change is never left in doubt.


## Why Flamingock?

### Safety and auditability by design
- **Safe by default**: When Flamingock cannot guarantee success, it stops and alerts instead of risking corruption.  
- **Built-in recovery mechanisms**: By default Flamingock retries safely where possible, and users can configure recovery strategies to minimize manual intervention.  
- **Complete audit trail**: Every execution, success, and failure is tracked for compliance and troubleshooting.  
- **Deterministic execution**: ChangeUnits run once and only once, in a controlled order.  

### Designed for distributed reality
- **Non-transactional systems supported**: Kafka, S3, REST APIs, and more get first-class safety treatment.  
- **Network-resilient**: Handles interruptions and partial failures with recovery strategies.  
- **Cluster-safe**: Prevents race conditions in distributed or containerized deployments.  

### Organizational benefits
- **Reduce risk**: Eliminate silent corruption and ensure compliance.  
- **Increase velocity**: Developers can evolve their systems independently, without waiting on infrastructure teams.  
- **Enable governance**: Clear ownership, auditability, and rollback capabilities across all environments.  


## Use Cases

Flamingock enables controlled, auditable evolution across your technology stack:

**Data Systems**
- Database schema changes (SQL/NoSQL)  
- Index creation and optimization  
- Data migrations and transformations  

**Infrastructure & APIs**  
- Message broker topic and schema management  
- API gateway and routing rules  
- Cloud service configuration  

**Application Configuration**  
- Feature flag rollouts  
- SaaS integrations and external service setup  
- Security policies and permissions  

**Distributed Coordination**  
- Multi-service configuration synchronization  
- Cross-system dependency management  

**...and other systems requiring safe, auditable evolution**


## What Flamingock Is Not
- **Not Infrastructure-as-Code**: We evolve systems already provisioned by your infrastructure.  
- **Not generic batch processing**: Optimized for deterministic, auditable changes — not arbitrary long-running jobs.  
- **Not a CI/CD replacement**: Complements your pipeline but focuses exclusively on safe system evolution.  


## How Flamingock Works

### Change-as-code architecture
Developers define **ChangeUnits** in code or templates. Each ChangeUnit is versioned, auditable, and executed once per system.  

### Execution lifecycle
1. **Discovery** – Flamingock scans your app for ChangeUnits  
2. **Validation** – Prevents duplicate execution using the audit store  
3. **Execution** – Runs the change with the configured recovery strategy  
4. **Audit** – Records all outcomes for visibility and compliance  
5. **Recovery** – Provides CLI (and Cloud UI) tools for resolution if needed  


## Next Steps
- [Quickstart Guide](../getting-started/get-started.md)  
- [How it Works](../getting-started/how-it-works.md)  
- [Technical Overview](technical-overview.md)  
