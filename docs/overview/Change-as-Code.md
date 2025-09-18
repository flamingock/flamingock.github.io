---
title: Change-as-Code (CaC)
sidebar_position: 50
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

**Automate changes. Version changes. Control changes.**  
Change-as-Code (CaC) means every system change—whether it’s an S3 bucket toggle, a new database schema, or a Kafka topic configuration—is authored, versioned, and audited just like application code.

At Flamingock, we champion CaC as the foundation for truly reliable, auditable, and repeatable deployments. No more one-off shell scripts or manual "clicks" in a console—every change is written in code, tracked in your VCS, and executed in a controlled pipeline.

## Why CaC matters today

Modern applications increasingly span dozens of external systems—ranging from relational and NoSQL databases to SaaS feature flags, message buses, and infrastructure APIs. Managing these changes manually or with ad-hoc scripts leads to:

- **Drift and “snowflake” environments**  
  When teams manually tweak production configurations, environments diverge, making rollbacks or audits nearly impossible.

- **Lack of auditability**  
  Regulatory and security teams require a full record of “what changed, when, and who made it.” Spreadsheets and one-off commands don’t cut it.

- **Inefficient collaboration**  
  Developers, operations, and security need a single source of truth: change definitions in code, reviewed and versioned via pull requests.

- **Increased risk of human error**  
  Pasting commands into a console or clicking UI checkboxes invites typos, misconfigurations, and stress during deployment windows.

Flamingock's CaC approach solves these problems by treating every external-system change as first-class code—complete with version control, automated execution, and a centralized audit trail.

## Four Pillars of Change-as-Code

1. **One-Hundred-Percent Versioned**
   All Changes live in your Git repository (or other VCS). This means you can review, diff, and roll back changes just like application code.

2. **Automated Execution**
   Flamingock scans and applies Changes at application startup or on-demand via the CLI. No manual intervention—just code running code.

3. **Auditable & Traceable**
   Every Change outcome is recorded in an audit store (your database or Flamingock Cloud). Teams can query "who ran what change, and when," ensuring full compliance.

4. **Cross-Component Support**  
   Whether it's SQL/NoSQL DDL, S3 buckets, Kafka topics, feature-flag toggles, or REST API calls—Flamingock treats them all as code. Your entire system evolves in lockstep.

## "Hello, CaC" Code Snippet

Imagine you need to toggle a feature flag in a downstream service (not a database). In Flamingock, you’d write:

```java
@Change(id = "enable-autosave", order = "0005", author = "ops-team")
public class _0005_EnableAutoSaveFeature {

  @Apply
  public void enableAutoSave(FeatureFlagClient client) {
    client.setFlag("autosave_feature", true);
  }

  @Rollback
  public void disableAutoSave(FeatureFlagClient client) {
    client.setFlag("autosave_feature", false);
  }
}
```

- **Versioned**: This code-based or template-based Change lives in your VCS.
- **Automated**: Flamingock executes it in order (0005) at startup or via CLI.
- **Auditable**: Upon success, an audit entry is written to your audit store.
- **Cross-Component**: The same pattern works for a DynamoDB schema change, a Kafka topic creation, or any REST API call.

## Illustration: CaC vs. IaC

![](../../static/img/Change%20as%20code-2.png)

- **Infrastructure as Code (IaC)**: Use Terraform, CloudFormation, Pulumi, etc., to provision VMs, networks, and databases (the “foundation”).
- **Change as Code (CaC)**: Use Flamingock to version and apply everything that lives on that foundation—database schemas, feature flags, SaaS configurations, message topics, and more.

## Real-World Use Cases

### Multi-tenant SaaS Onboarding

**Problem**: Over the lifetime of your application, you might need to create and then later modify external resources—such as an S3 bucket, Kafka topics, IAM roles, and initial database state—as part of each new release. Doing this manually or with ad-hoc scripts risks drift, missing audits, and inconsistent environments..

**CaC Solution**: Define a sequence of Changes that run in order on mutiple deployments, inserting audit entries and ensuring reproducible, versioned updates::
<Tabs groupId="config">
<TabItem value="code-base" label="Code" default>
```java
@Change(id = "provision-bucket", order = "0001", author = "team-a", transactional = false)
public class _0001_ProvisionBucketChange {

    @Apply
    public void apply(S3Client s3) {
        s3.createBucket(CreateBucketRequest.builder()
                .bucket("flamingock-app-bucket")
                .build());
    }

    @Rollback
    public void rollback(S3Client s3) {
        s3.deleteBucket(DeleteBucketRequest.builder()
                .bucket("flamingock-app-bucket")
                .build());
    }
}

@Change(id = "create-kafka-topics", order = "0002", author = "devops", transactional = false)
public class _0002_CreateKafkaTopicsChange {

    @Apply
    public void apply(KafkaAdminClient admin) {
        var topic1 = new NewTopic("app-events", 3, (short) 1);
        var topic2 = new NewTopic("user-notifications", 2, (short) 1);
        admin.createTopics(Arrays.asList(topic1, topic2));
    }

    @Rollback
    public void rollback(KafkaAdminClient admin) {
        admin.deleteTopics(Arrays.asList("app-events", "user-notifications"));
    }
}

@Change(id = "setup-iam-roles", order = "0003", author = "devops", transactional = false)
public class _0003_SetupIamRolesChange {

    @Apply
    public void apply(IamClient iam) {
        CreateRoleResponse response = iam.createRole(CreateRoleRequest.builder()
                .roleName("flamingock-app-role")
                .assumeRolePolicyDocument("{...}") // truncated for brevity
                .build());
    }

    @Rollback
    public void rollback(IamClient iam) {
        iam.deleteRole(DeleteRoleRequest.builder()
                .roleName("flamingock-app-role")
                .build());
    }
}

@Change(id = "seed-database", order = "0004", author = "devops", transactional = true)
public class _0004_SeedTenantDataChange {

    @Apply
    public void apply(DataSource ds) {
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(
                    "INSERT INTO tenants (id, name, created_at) " +
                            "VALUES (1, 'TenantA', NOW()), (2, 'TenantB', NOW())"
            );
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Rollback
    public void rollback(DataSource ds) {
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM tenants WHERE id IN (1, 2)");
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}

@Change(id = "update-bucket-settings", order = "0005", author = "team-a", transactional = false)
public class _0005_UpdateBucketSettingsChange {

    @Apply
    public void apply(S3Client s3) {
        // Example: enable versioning on the bucket
        s3.putBucketVersioning(PutBucketVersioningRequest.builder()
                .bucket("flamingock-app-bucket")
                .versioningConfiguration(VersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build());
    }

    @Rollback
    public void rollback(S3Client s3) {
        // Example: disable versioning on the bucket
        s3.putBucketVersioning(PutBucketVersioningRequest.builder()
                .bucket("flamingock-app-bucket")
                .versioningConfiguration(VersioningConfiguration.builder()
                        .status("Suspended")
                        .build())
                .build());
    }
}

```
</TabItem>
<TabItem value="template-base" label="Template">

```yaml

# File: _0001_provision-bucket.yaml
id: "provision-bucket"
order: 0001
author: "team-a"
transactional: false
templateName: aws-s3-template
apply:
  bucketName: "flamingock-app-bucket"
  region: "us-east-1"
rollback:
  bucketName: "flamingock-app-bucket"

---

# File: _0002_create-kafka-topics.yaml
id: "create-kafka-topics"
order: 0002
author: "devops"
transactional: false
templateName: kafka-template
apply:
  topics:
    - "app-events"
    - "user-notifications"
  configs:
    app-events:
      partitions: 3
      replicationFactor: 1
    user-notifications:
      partitions: 2
      replicationFactor: 1
rollback:
  topics:
    - "app-events"
    - "user-notifications"
  rollbackTopics:
    - "app-events"
    - "user-notifications"

---

# File: _0003_setup-iam-roles.yaml
id: "setup-iam-roles"
order: 0003
author: "devops"
transactional: false
templateName: aws-iam-template
apply:
  roleName: "flamingock-app-role"
  assumeRolePolicy: |
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "ec2.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }
rollback:
  roleName: "flamingock-app-role"
  rollbackRoleName: "flamingock-app-role"

---

# File: _0004_seed-database.yaml
id: "seed-database"
order: 0004
author: "devops"
transactional: true
templateName: sql-template
apply: |
  INSERT INTO tenants (id, name, created_at)
  VALUES (1, 'TenantA', NOW()), (2, 'TenantB', NOW());
rollback: |
  DELETE FROM tenants WHERE id IN (1, 2);

---

# File: _0005_update-bucket-settings.yaml
id: "update-bucket-settings"
order: 0005
author: "team-a"
transactional: false
templateName: aws-s3-template
apply:
  # Enable versioning on an existing bucket
  bucketName: "flamingock-app-bucket"
  versioningConfiguration:
    status: "Enabled"
rollback:
  # Rollback: suspend versioning
  bucketName: "flamingock-app-bucket"
  versioningConfiguration:
    status: "Suspended"
  rollbackVersioningConfiguration:
    bucketName: "flamingock-app-bucket"
    versioningConfiguration:
      status: "Suspended"

---

```

</TabItem>
</Tabs>

Flamingock ensures these four steps run in sequence—never twice—and logs them in your audit store for future reference.

## Change-as-Code Checklist

- ✅ **Change lives in VCS**: Every Change class (or YAML template) is versioned.
- ✅ **Automated pipeline**: Flamingock applies changes automatically at startup or via CLI.
- ✅ **Audit trail**: Query your audit store for a complete history of applied changes.
- ✅ **Rollback logic**: Each Change provides `@Rollback` to undo or compensate if needed.
- ✅ **Consistent ordering**: All Changes follow a strict, declared ordering (via the `order` attribute).
- ✅ **Cross-component**: You can target databases, SaaS APIs, feature flags, message systems—anything with a client API.

## Next Steps

- [Quick start](quick-start.md) → Learn how to create your first Change and run Flamingock. 
- [Core concepts](./core-concepts.md)   → Dive deeper into auditing, drivers, transactions, and distributed locking.
- [Real use case examples](../resources/examples.md) → Explore real-world code samples: MongoDB, DynamoDB, Couchbase, Kafka, and more.
