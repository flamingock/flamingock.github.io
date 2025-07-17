---
title: Introduction
sidebar_position: 10
sidebar_label: Introduction to Flamingock
---

# Introducing Flamingock
*The evolution of Mongock — reimagined for the modern enterprise*

![Flamingock logo](../../static/img/Flamingock-04.png)

Managing change across today’s distributed systems is complex — from database migrations to API evolution and SaaS configuration updates.

**Flamingock** provides a unified, auditable, and version-controlled approach to managing these changes with confidence.

Built on the principles of **Change-as-Code**, Flamingock enables your teams to:

- Version and document system changes  
- Maintain compliance with full traceability  
- Accelerate deployments with safe, coordinated rollouts

Flamingock ensures your systems changes evolve reliably — at scale.

**Ready to modernize your change management?**  
[Get started](../getting-started/get-started.md) and see how Flamingock can power your release lifecycle.


![Flamingock gif](../../static/img/Flamingock%20process%20animation%20(1).gif)

## Why Flamingock?
Our objective is to reduce software release overhead by providing a tool that can be enable tracking configuration changes  programatically (change-as-code), with the language of choice of the Application developer.  This reduces the dependency on infrastructure engineers to maintain configuration changes that are led/introduced by the Application developer, simplifying the release process, reducing risk during deployments, and reducing time to market and skills required for developing and maintaining Configuration changes.

With multiple deployment model offerings, Flamingock provides helps teams by:

**Centralising services, systems & environment changes**
Version and ship your system changes with your application and store them centrally. Flamingock allows operations to manage your changes (Execution, Rollback, Undo, Audit, etc.)

**Reduce team & skills dependencies**
Empower Developers to have full control over the Application, external configuration, and database changes. Allow to manage stateful and stateless changes in distributed systems in a safe and reliable manner.

**Achieve Configuration automation of all Systems**
Synchronise system dependency changes with your Application changes, as they ship together. The deployment of the Application will execute a System changes to the required state, achieving immutable deployments in any environment.


## Some example use cases

Some examples of these use cases (but not limited to) are:

- Persistent storage management
- Manage deployment dependencies
- Configuration of external cloud SaaS providers
- Database migrations - supported by our legacy Mongock engine, but extended to any Database (NoSQL and SQL).
- API Gateway configurations
- Message broker configurations + *many more!*

Our tool offers managing configuration changes to any system/component in a safe and audited manner within the Application context.


#### What is Flamingock not suitable for?

We are not an Infrastructure provider (neither intend to be). We believe that there are multiple good widely adopted solutions within the infrastrucuture space. 

We provide Application developers the ability to configure Application domain-specific resources within those infrastructure components. This enables following a Domain-driven ownership for Application developers, provisioning them with self-serve capabilities and autonomy for configuring their resources within the boundaries of an existing infrastructure.

# How Flamingock works?

**⚙️ Code It. Deploy It. Forget It.**  

With Flamingock, developers define any component changes (database, system changes, SaaS, etc. )  **directly in application code** using familiar programming constructs such as classes and annotations, or template-based formats like YAML. The Flamingock client library then:  

- **Automatically executes** changes during application startup  
- **Generates audit trails** for full transparency and compliance  
- **Keeps changes version-locked** to your application releases  

**Benefits:**  
- **No more out-of-band scripts** - Changes travel with your app code  
- **Cluster-safe execution** - Designed for distributed systems from the ground up  
- **Native version control** - Every change is code-reviewed alongside feature development  

*Built for the modern deployment pipeline where infrastructure should be as agile as your code.*  

👉 **Dive deeper:** | [How it works?](../getting-started/how-it-works.md)  | [Technical Overview](technical-overview.md) | [Quickstart Guide](../getting-started/get-started.md)