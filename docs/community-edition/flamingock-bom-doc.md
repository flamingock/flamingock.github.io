---
title: Flamingock BOM (Bill of Materials)
sidebar_position: 2
---

## Introduction

To simplify dependency management and ensure compatibility across the different Community Edition modules of Flamingock, we provide a **Flamingock BOM (Bill of Materials)**.

This BOM allows you to declare all necessary Flamingock dependencies **without repeating the version number for each one**, ensuring that all modules stay in sync automatically.

---

## What is a BOM?

A **Bill of Materials (BOM)** in Gradle or Maven is a centralized dependency version declaration. By importing it, your project inherits predefined versions for a coordinated set of dependencies.

### 🔧 Benefits of using a BOM:

- ✅ **Version consistency** across all Flamingock modules  
- 🧹 **Cleaner build files** – no need to repeat the version  
- 🧪 **Reduced dependency conflicts**  
- 🧱 **Easy upgrades** – change the version in a single place  
- 🧩 **Better compatibility** with platforms and integrations  

---

## Modules included in the BOM

The `flamingock-ce-bom` includes all the following modules:

- `flamingock-ce-mongodb-v3`
- `flamingock-ce-mongodb-sync-v4`
- `flamingock-ce-mongodb-springdata-v2`
- `flamingock-ce-mongodb-springdata-v3`
- `flamingock-ce-mongodb-springdata-v4`
- `flamingock-ce-couchbase`
- `flamingock-ce-dynamodb`
- `flamingock-sql-template`
- `flamingock-mongodb-change-template`

---

## How to use it in Gradle

To use the BOM in your project, declare it with the `platform(...)` function:

```kotlin
dependencies {
    // Use Flamingock BOM
    implementation(platform("io.flamingock:flamingock-ce-bom:$flamingockVersion"))

    // Dependencies managed by the BOM
    implementation("io.flamingock:flamingock-core")
    implementation("io.flamingock:flamingock-core-api")
    implementation("io.flamingock:flamingock-ce-dynamodb")
    implementation("io.flamingock:flamingock-ce-commons")

    //Annotation Processor
    annotationProcessor("io.flamingock:flamingock-core:$flamingockVersion")

    // Other dependencies, for example if you are using DynamoDB with S3
    implementation(platform("software.amazon.awssdk:bom:$awsSdkVersion"))
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:dynamodb")
    implementation("software.amazon.awssdk:dynamodb-enhanced")
    implementation("software.amazon.awssdk:url-connection-client")

}
```

---

## How to use it in Maven

You can also use the Flamingock BOM in Maven by importing it in your `<dependencyManagement>` section:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>io.flamingock</groupId>
      <artifactId>flamingock-ce-bom</artifactId>
      <version>${flamingock.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-core</artifactId>
  </dependency>
  <dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-core-api</artifactId>
  </dependency>
  <dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-ce-dynamodb</artifactId>
  </dependency>
  <dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-ce-commons</artifactId>
  </dependency>
  <!-- Other dependencies -->
</dependencies>
```

---

## Important Notes

- 🧷 Make sure to **only use one version** of Flamingock per project to avoid version clashes.
- ⚖️ The Flamingock BOM does **not control versions** of AWS SDK or Spring dependencies – you should use their official BOMs separately.
- 🔍 The BOM is strictly for **Community Edition** modules. Enterprise features are managed separately.

---

## Summary

Using the Flamingock BOM helps you:

- Stay aligned with tested module versions
- Maintain cleaner and safer dependency declarations
- Integrate Flamingock easily with various backends like MongoDB, Couchbase, and DynamoDB

Add it once, and let the BOM do the version management for you!

---
