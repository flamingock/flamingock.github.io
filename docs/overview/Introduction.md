---
sidebar_position: 1
---

# 🦩 Introduction

## 🦩 What is Flamingock?
**Flamingock** (*formerly Mongock*) – enables you to seamlessly track, manage and audit Configuration and Data changes of any components or systems with your Application. 

It is a powerful tool that manages the evolution of changes with a Change-as-Code (CaC) approach.

Ready to streamline your database migrations or changes of any kind? [Get started](https://github.com/mongock/flamingock-examples)  to see Flamingock in action!

## 💡 Why Flamingock?
Our objective is to reduce software release overhead by providing a tool that can be enable tracking configuration changes  programatically (change-as-code), with the language of choice of the Application developer.  This reduces the dependency on infrastructure engineers to maintain configuration changes that are led/introduced by the Application developer, simplifying the release process, reducing risk during deployments, and reducing time to market and skills required for developing and maintaining Configuration changes.

With multiple deployment model offerings, Flamingock provides helps teams by:

**Centralising services, systems & environment changes**
Migrate and ship your System changes with your Application and store these centrally. Flamingock allows operations to manage your changes (Migration, Rollback, Undo, Audit, etc.)

**Reduce team & skills dependencies**
Empower Developers to have full control over the Application, Database and external configuration changes. Allow to manage stateful and stateless changes in distributed systems in a safe and reliable manner.

**Achieve Configuration automation of all Systems**
Synchronise system dependency changes with your Application changes, as they ship together. The deployment of the Application will execute a System changes to the required state, achieving immutable deployments in any environment.


## 🔍 Some example use cases

> Todo: section WIP, expand on it by providing more descriptive examples

Some examples of these use cases (but not limited to) are:

- Database migrations - supported by our legacy Mongock offering.
- Persistent storage management
- Configuration of external cloud SaaS providers
- Deployment dependencies
- API Gateway configurations
- Message broker configurations
  
Our tool offers managing configuration changes to any system/component in a safe and audited manner within the Application context.


#### 🌧 What is Flamingock not suitable for?

We are not an Infrastructure provider (neither intend to be). We believe that there are multiple good widely adopted solutions within the infrastrucuture space. 

We provide Application developers the ability to configure Application domain-specific resources within those infrastructure components. This enables following a Domain-driven ownership for Application developers, provisioning them with self-serve capabilities and autonomy for configuring their resources within the boundaries of an existing infrastructure.