---
title: Introduction
sidebar_position: 1
sidebar_label: CE Introduction
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Community Edition
The **Community Edition** is Flamingock's free, open-source offering where you provide and manage your own database as the **audit store**—the dedicated location where Flamingock records which changes have been executed, when, and by whom.

Unlike the Cloud Edition (which uses Flamingock's managed backend as the audit store and provides advanced features), the Community Edition requires you to set up and maintain your own audit store. This makes it suitable for getting started with Flamingock, experimenting with change-as-code concepts, or for projects that need basic change management capabilities.

The **audit store** is separate from your **target systems** (the resources your ChangeUnits modify). For example, you might use MongoDB as your audit store while your ChangeUnits create S3 buckets, update Kafka topics, or modify database schemas. As the Cloud Edition, the Community edition provides transactional consistency guarantees to ensure changes and audit records remain synchronized.

To learn more about the distinction between audit stores and target systems, see [Audit Store vs. Target System](../overview/audit-store-vs-target-system.md).

The Community Edition supports several database technologies for your audit store: **MongoDB**, **DynamoDB**, **CosmosDB**, and **Couchbase**. Each provides the same core Flamingock functionality while premium features are available in the Cloud and Self-hosted editions.

## Available editions

Below is a summary of the available editions in the Flamingock Community Edition:

| Edition   | Database         | Supported Versions | Transactions | Locking Support | Notes                                                                                                                      |
|-----------|------------------|--------------------|--------------|-----------------|----------------------------------------------------------------------------------------------------------------------------|
| MongoDB   | MongoDB          | 4.0+               | ✅ Yes        | ✅ Yes           | Flamingock provides support for both low-level native drivers and high-level abstractions through Spring Data integration. |
| DynamoDB  | AWS DynamoDB     | All                | ✅ Yes        | ✅ Yes           | Locking via coordination table                                                                                             |
| CosmosDB  | Azure Cosmos DB  | Mongo API 3.6/4.0  | ✅ Partial    | ✅ Yes           | Limited transaction support                                                                                                |
| Couchbase | Couchbase Server | 6.5+               | ✅ Yes        | ✅ Yes           | Requires Couchbase SDK 3+                                                                                                  |

---
## Features
Community editions support the core Flamingock feature set, including:

- Ordered and versioned change execution
- Support for concurrent, distributed deployments
- Optional transactional execution (if supported by the MongoDB server)

:::info
It includes limited access to premium features, which are fully available in the Cloud and Self-Hosted editions.
:::

---

Each edition has its own documentation page with setup instructions, configuration parameters, and usage examples. Use the sidebar or links below to navigate to a specific edition.



