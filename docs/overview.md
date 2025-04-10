---
sidebar_position: 1
---
# Overview


## Introduction
### 🦩 What is Flamingock?
**Flamingock** (*formerly Mongock*) – enables you to seamlessly track, manage and audit Configuration and Data changes of any components or systems with your Application. 

It is a powerful tool that manages the evolution of changes with a Change-as-Code (CaC) approach.

Ready to streamline your database migrations or changes of any kind? [Get started](https://github.com/mongock/flamingock-examples)  to see Flamingock in action!

<!-- ## 👩🏽‍💻 Flamingock and the Change-as-Code (CaC) movement
We advocate for the automation and version control of all system changes. This approach streamlines release management processes and minimises the overhead associated with configuring and maintaining systems. System changes extend beyond application version updates, encompassing all components dependent on the application.

The core principle of Flamingock is to empower application developers by enabling seamless automated releases. It achieves this by storing all changes for any component orchestrated through your application deployment, using the same language in which your software is built (currently Java, watch this space! More languages to follow! 😊). -->

### 💡 Why Flamingock?
Our objective is to reduce software release overhead by providing a tool that can be enable tracking configuration changes  programatically (change-as-code), with the language of choice of the Application developer.  This reduces the dependency on infrastructure engineers to maintain configuration changes that are led/introduced by the Application developer, simplifying the release process, reducing risk during deployments, and reducing time to market and skills required for developing and maintaining Configuration changes.

With multiple deployment model offerings, Flamingock provides helps teams by:

**Centralising services, systems & environment changes**
Migrate and ship your System changes with your Application and store these centrally. Flamingock allows operations to manage your changes (Migration, Rollback, Undo, Audit, etc.)

**Reduce team & skills dependencies**
Empower Developers to have full control over the Application, Database and external configuration changes. Allow to manage stateful and stateless changes in distributed systems in a safe and reliable manner.

**Achieve Configuration automation of all Systems**
Synchronise system dependency changes with your Application changes, as they ship together. The deployment of the Application will execute a System changes to the required state, achieving immutable deployments in any environment.


### 🔍 Some example use cases

> Todo: section WIP, expand on it by providing more descriptive examples

Some examples of these use cases (but not limited to) are:

- Database migrations - supported by our legacy Mongock offering.
- Persistent storage management
- Configuration of external cloud SaaS providers
- Deployment dependencies
- API Gateway configurations

Our tool offers managing configuration changes to any system/component in a safe and audited manner within the Application context.


#### 🌧 What is Flamingock not suitable for?

We are not an Infrastructure provider (neither intend to be). We believe that there are multiple good widely adopted solutions within the infrastrucuture space. 

We provide Application developers the ability to configure Application domain-specific resources within those infrastructure components. This enables following a Domain-driven ownership for Application developers, provisioning them with self-serve capabilities and autonomy for configuring their resources within the boundaries of an existing infrastructure.

## 🔁 Change-as-Code (CaC) 

### 🚀 Flamingock & the Change-as-Code (CaC) Revolution
**Automate. Version. Control.**
At Flamingock, we champion Change-as-Code (CaC)—treating every system change as code. No more manual tweaks, hidden configs, or deployment surprises. Version-controlled, automated, and auditable changes mean smoother releases, fewer errors, and less maintenance overhead.

#### Why CaC? Because Changes go beyond just code
System evolution isn’t just about app updates—it’s about databases, SaaS configs, API dependencies, and infrastructure. Flamingock ensures all components move in sync, with full traceability.

The future of deployments is automation - and Flamingock gets you there.

![](../static/img/Change%20as%20code-2.png)

<!-- ### ⚙️ How it works?
Developers codify the changes in the Application and the Flamingock client library will take care of the execution and storing the audit traces during the Application start up process.  This approach allows changes go hand-in-hand with the relevant Application version, codified in the Application's programming language and version controlled with your Application. 

The changes are applied during the Application startup process, ensuring its safe execution for distributed systems. 

More details around the main components can be found at the [Technical Overview section](technical-overview.md). -->

## 🔑 Some key Features

- 🧱 **Change management of any component**: Manage configuration and data changes with your Application code for any component. NoSQL Databases are a first-class citizen, and we've expanded this capability for any type of component that requires configuration.
  :::info
  Currently supported languages: Java, Kotlin.
  :::
- 🔗 **Extended integrations and custom use case support**: Flamingock enables one-time or repeatable operational processes — such as fetching external data, initializing third-party services, or executing custom logic — ensuring they run safely, just once, and in the right context. It expands on Mongock's support to manage Database changes to all systems, databases, technologies and configurations  (ie. Kafka, Twilio, Auth0, etc) or any user-defined scenario.

- 🚀 **Seamless deployment**: Deploy your application and systems together, ensuring version compatibility and reducing deployment friction.
  
- 🧩 **Flexible migration Templates**: New mechanisms for defining changes, offering a no-code option to streamline and simplify change management.

- ⚡ **GraalVM support**: Enables the compilation of Java applications into native executables for improved performance.

- 👥 **Multi-Tenant support (coming soon!)**: Designed to handle multiple tenants within the same infrastructure.

- 🔒 **Distributed Locking**: Ensures synchronized deployment of multiple service instances, maintaining consistency and preventing conflicts in distributed environments.

- 🔄 **Auditing & Rollback**: Comprehensive auditing capabilities with support for rollback of changes to ensure consistency and control.

- ☁️ **Cloud offering**: Offers a fully managed service by hosting Flamingock’s operational data on our servers, removing the need for users to set up and manage their own infrastructure whilst unlocking the full Flamingock suite of features.

- 💻 **Management Operations via a Dashboard and CLI**: Flamingock offers tools to simplify Operational management tasks. Some of these example are: List history of changes, execute Rollbacks, Undo deployment, Audit, etc. Additionally, offers a Dashboard with metrics and alerts.

- 🛠️ **Advanced Workflow Management**: Enables multiple streams of change units that can be organized to execute sequentially, in parallel, or as a combination, providing flexibility in managing complex processes.

- 🔀 **Parallel Synchronised Execution**: When workflows include parallel streams, they can be executed simultaneously by different service instances, maximizing efficiency in distributed deployments.

## 🧩 Flamingock Editions
Flamingock offers a range of backend providers and deployment models, allowing users to choose from the following: 

![](../static/img/Diagrams-Editions.drawio.png)

**🔹 Community Edition (Open Source):**
The Community Edition is a free, open-source version of Flamingock that provides core functionality to execute changes in your self-provided database.  
The current compatible databases for this version are: MongoDB, DynamoDB, CosmosDB or Couchbase. 

Key points around this edition:
- Offers a similar functionality as our legacy Mongock version.
- You provision your own database (compatible with MongoDB, DynamoDB, CosmosDB or Couchbase) - compatible to extension with additional drivers.
- Storage of local metadata for execution tracking (no centralised feature)
- Focuses on core functionality (does not include the advanced capabilities provided in the Cloud Edition).

Use this edition if you want a lightweight option you can run on your own infrastructure, and you don’t require cross-service auditability, advanced templates or features, or advanced observability (such as dashboards, metrics, environment and user management)


**☁️ Flamingock Cloud edition (Coming Soon!):**

Flamingock's managed SaaS platform with a full-feaure offering for production-grade environments. In this edition, Flamingock offers:
- All Comunity edition features, plus
- Full access to teamplates and extentions for accelerating integrations
- Centralised auditing system to showcase Changes across all services and environments
- Enables RBAC and enterprise-ready governance 
- Multienvironment management
- A centralised dashboard 


Use this edition if you want a scalable, collaborative, and secure environment to manage change across multiple environments, services and teams - with full visibility and governance. 
:::info
Coming soon! Flamingock Cloud Edition is currently under development.

If you'd like to participate in our user testing round, please contact support@mongock.io 
:::


**💎 Flamingock self-hosted edition (Coming Soon!):**
Provides all the offered functionality in Flamingock Cloud, deployed in your infrastructure. 

:::info
Flamingock self-hosted edition is not released yet. 

If you require this edition to be available for your enterprise, please contact support@mongock.io 
:::

## ⚙️ How Flamingock works?

**Code It. Deploy It. Forget It.**  

With Flamingock, developers define any component changes (database, system changes, SaaS, etc. )  **directly in application code** using familiar programming constructs such as classes and annotations, or template-based formats like YAML. The Flamingock client library then:  

✅ **Automatically executes** changes during application startup  
✅ **Generates audit trails** for full transparency and compliance  
✅ **Keeps changes version-locked** to your application releases  

**Benefits:**  
🔹 **No more out-of-band scripts** - Changes travel with your app code  
🔹 **Cluster-safe execution** - Designed for distributed systems from the ground up  
🔹 **Native version control** - Every change is code-reviewed alongside feature development  

*Built for the modern deployment pipeline where infrastructure should be as agile as your code.*  

👉 **Dive deeper:** [Technical Overview](technical-overview.md) | [Quickstart Guide](#)  









