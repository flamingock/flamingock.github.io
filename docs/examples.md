---
title: Examples
sidebar_position: 99
---

## Introduction

The **Flamingock Examples** repository showcases a growing collection of real-world use cases demonstrating how to use Flamingock in different environments, integrations, and technologies. Each top-level folder represents a target technology and contains one or more self-contained example projects. Each project is designed to be cloned, explored, and run as a reference or foundation for your own implementation.

👉 **GitHub Repository**: [github.com/mongock/flamingock-examples](https://github.com/mongock/flamingock-examples)

---

## What you’ll find

Within each technology folder, you’ll find one or more example ​projects that demonstrate how to configure Flamingock and apply change units in various scenarios. Each folder contains its own `README.md` with setup instructions, and each project inside has its own documentation.

| Technology Folder                                                                 | Description                                                                                                                                                               |
|-----------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [mongodb](https://github.com/mongock/flamingock-examples/tree/master/mongodb)     | Folder containing Flamingock CE projects using MongoDB as the audit‐log backend. Each project shows different integration scenarios (standalone Java, Spring Boot, etc.). |
| [dynamodb](https://github.com/mongock/flamingock-examples/tree/master/dynamodb)   | Folder containing Flamingock CE projects using Amazon DynamoDB for audit logging. Includes both standalone and Spring Boot examples.                                      |
| [couchbase](https://github.com/mongock/flamingock-examples/tree/master/couchbase) | Folder containing Flamingock CE projects using Couchbase as the audit‐log backend.                                                                                        |

More examples are planned — including PostgreSQL, Redis, LocalStack, Kafka, Spring Native, multi‐module projects, and custom runners.

---

## How to use the examples

Each example folder and project includes its own `README.md` with detailed setup and run instructions. In general:

1. **Clone the examples repository**
   ```bash
   git clone https://github.com/mongock/flamingock-examples.git
   ```  
   This repository contains all the example folders for various technologies.

2. **Navigate to the technology folder of interest**
   ```bash
   cd flamingock-examples/s3
   ```  
   Replace `s3` with the folder name for the technology you are interested in (e.g., `kafka`, `mongodb`, `dynamodb`, etc.).

3. **Navigate to a specific example project**
   ```bash
   cd s3
   ```  
   Each folder contains one or more projects. Move into the project folder that matches your use case or environment.

4. **Run the example**
   - For standalone Java applications:
     ```bash
     ./gradlew run
     ```  
   - For Spring Boot projects:
     ```bash
     ./gradlew bootRun
     ```  
   - Follow any additional instructions in the project’s `README.md`. Some examples may use Testcontainers or LocalStack; if so, ensure Docker is running on your machine.

---

## Who this is for

- **New users**: Learn by example. Pick an example that matches your tech stack and explore how Flamingock integrates with your environment.
- **Advanced users**: Discover integration patterns with external systems like Kafka, AWS, or NoSQL databases.
- **Contributors**: Want to improve or submit a new example? Fork the repo, add your example folder, and create a pull request!

---

## Contributing

We welcome community contributions to expand this repository! Please consider:

- Adding new example projects or folders (e.g., Wiremock, Kafka, PostgreSQL, Redis)
- Fixing or modernizing existing examples
- Improving documentation and setup instructions

See the [CONTRIBUTING.md](https://github.com/mongock/flamingock-examples/blob/master/CONTRIBUTING.md) for detailed guidelines.
