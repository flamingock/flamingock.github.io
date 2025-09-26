---
id: overview
title: Overview
sidebar_position: 0
---

# Flamingock Documentation

**Flamingock** brings *Change-as-Code (CaC)* to your entire stack.  
It applies **versioned, auditable changes** to the external systems your application depends on — such as databases, schemas, message brokers, APIs, and cloud services.  

Unlike infrastructure-as-code tools, Flamingock runs **inside your application** (or via the **CLI**).  
It ensures these systems evolve **safely, consistently, and in sync with your code at runtime**.  

👉 For a deeper explanation, see the [Introduction](./overview/Introduction)

---

## 🔎 What It Looks Like

A simple change in Flamingock:

```java
@TargetSystem("user-database")
@Change(id = "add-user-status", author = "dev-team")
public class _0001__AddUserStatus {

    @Apply
    public void apply(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(
                    new Document("status", new Document("$exists", false)),
                    new Document("$set", new Document("status", "active"))
                );
    }

    @Rollback
    public void rollback(MongoDatabase database) {
        database.getCollection("users")
                .updateMany(
                    new Document(),
                    new Document("$unset", new Document("status", ""))
                );
    }
}
```

👉 **Continue to [Quick Start Guide](./overview/quick-start)**
👉 **Learn the [Core Concepts](./overview/core-concepts)**
👉 **Read the full [Introduction](./overview/Introduction)**

---

## 🔑 Core Building Blocks

**Changes** – versioned, auditable operations (e.g. schema migrations, config toggles, S3 bucket creation).

**Target Systems** – external systems you evolve (MongoDB, DynamoDB, Kafka, S3, REST APIs, …).

**Audit Store** – log where Flamingock records applied changes.

**Runners** – how Flamingock integrates with your app (Standalone, Spring Boot, …).

---

## 📚 Documentation Structure

**Get started** – [Introduction](./overview/Introduction), [Quick Start](./overview/quick-start), [Core Concepts](./overview/core-concepts), [Change-as-Code](./overview/Change-as-Code)

**Changes** – [Anatomy](./changes/anatomy-and-structure), [Apply and rollback methods](./changes/apply-and-rollback-methods), [Types & implementation](./changes/types-and-implementation), [Best practices](./changes/best-practices)

**Target Systems** – Supported integrations ([SQL](./target-systems/sql-target-system), [MongoDB](./target-systems/mongodb-target-system), [DynamoDB](./target-systems/dynamodb-target-system), [Introduction](./target-systems/introduction), …)

**Audit Stores** – [MongoDB](./audit-stores/mongodb-audit-store), [DynamoDB](./audit-stores/dynamodb-audit-store), [SQL](./audit-stores/sql-audit-store)

**Safety & Recovery** – [Recovery strategies](./safety-and-recovery/introduction), [Safety mechanisms](./safety-and-recovery/introduction)

**Templates** – [How to use](./templates/templates-how-to-use), [Introduction](./templates/templates-introduction)

**Supported Frameworks** – [Spring Boot](./frameworks/springboot-integration/introduction), [Standalone runner](./flamingock-library-config/setup-and-stages)

**Testing** – [Unit testing](./testing/unit-testing), [Integration testing](./testing/integration-testing), [Spring Boot testing](./testing/springboot-integration-testing)

**CLI** – Command-line usage and operations

**Resources** – Examples, FAQ, migration guides

---

## 🛠 Editions

**Community Edition (CE)** – open source, library only

**Cloud Edition** – SaaS with dashboard, observability, and premium features

**Self-Hosted Edition** – Cloud features, deployable in your infra

👉 **Learn more about [Cloud Edition](./cloud-edition/cloud-edition)**

---

## 🔍 Resources

[GitHub repository](https://github.com/flamingock/flamingock-project)

[Releases](https://github.com/flamingock/flamingock-project/releases)

[Issue tracker](https://github.com/flamingock/flamingock-project/issues)