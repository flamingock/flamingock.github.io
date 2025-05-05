---
title: Overview
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Editions (Community Edition)

Flamingock follows a modular architecture that allows users to work with multiple database technologies through specialized components.
In the context of the **Community Edition**, each *Edition* represents support for a specific database technology—such as MongoDB, DynamoDB, CosmosDB, or Couchbase—packaged as an independent driver artifact.

Each edition encapsulates all the logic necessary to integrate Flamingock with a given database: handling of migrations, locking mechanisms, transaction support (when available), and compatibility with database-specific features and limitations. This structure allows you to select and include only the edition relevant to your application, keeping your dependency footprint clean and your integration precise.

All editions under the Community umbrella share a consistent developer experience and follow the same core migration principles, but are tailored to the constraints and capabilities of their respective databases. This ensures that developers get the best possible behavior—whether using a transactional system like MongoDB or an eventually consistent NoSQL database like DynamoDB.

## Available Editions

Below is a summary of the available editions in the Flamingock Community Edition:

| Edition    | Database        | Supported Versions | Transactions | Locking Support | Notes                             |
|------------|------------------|---------------------|--------------|------------------|-----------------------------------|
| MongoDB    | MongoDB          | 4.0+                | ✅ Yes       | ✅ Yes           | Best performance with replica set |
| DynamoDB   | AWS DynamoDB     | All                 | ❌ No        | ✅ Yes           | Locking via coordination table    |
| CosmosDB   | Azure Cosmos DB  | Mongo API 3.6/4.0   | ✅ Partial   | ✅ Yes           | Limited transaction support       |
| Couchbase  | Couchbase Server | 6.5+                | ✅ Yes       | ✅ Yes           | Requires Couchbase SDK 3+         |

> ℹ️ You can include more than one edition in your project if you're working with multiple databases, but make sure to configure them separately.

---

Each edition has its own documentation page with setup instructions, configuration parameters, and usage examples. Use the sidebar or links below to navigate to a specific edition.


