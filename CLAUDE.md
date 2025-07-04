# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docusaurus-based documentation website for Flamingock, a change management tool evolved from Mongock. The site serves as the main documentation hub for the Flamingock project.


### What is Flamingock?

Flamingock is a **"Change-as-Code" platform** that versions and orchestrates any state change that must evolve alongside your application:

| Aspect                   | Description                                                                                                                    |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| **Scope**                | Databases (SQL/NoSQL), message queues, S3 buckets, feature-flags, REST APIs, etc.                                              |
| **Model**                | Each change is defined as a **ChangeUnit**; executed deterministically, audited and can be reverted.                           |
| **Centralized auditing** | Records who, when and with what result each change was applied; avoids duplicates and facilitates regulatory compliance.       |
| **Rollback & Undo**      | Compensation logic per ChangeUnit to undo or "undo" deployments.                                                               |
| **Automation**           | Runs on app startup or on-demand via CLI/UI, with distributed locking and transactional consistency when the system allows it. |
| **Editions**             | **Community** (OSS) · **Cloud** (managed SaaS, dashboard, RBAC) · **Self-managed** (Cloud in your environment).                |

### What Flamingock is NOT

| Is not                                         | Because…                                                                                                           |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| **Infrastructure-as-Code** (Terraform, Pulumi) | Flamingock acts *after* infrastructure exists; focuses on **functional state**, not creating machines or networks. |
| **Just an SQL migrator**                       | Extends the same model to Kafka, S3, Vault, etc.                                                                   |
| **A generic batch job engine**                 | Each ChangeUnit must conclude (or fail) quickly; long processes are modeled through internal *batching*.           |
| **A CI/CD replacement**                        | Integrates with your pipeline, but doesn't compile, test or deploy artifacts. Its focus is **state evolution**.    |

#### Key Features

1. **Universal Change-as-Code**
  - ChangeUnits in Java/Kotlin/Groovy **or** YAML/JSON (low-code templates).
  - Declarative order, version control, PR review.

2. **Transactional audit store**
  - *Community* → your database.
  - *Cloud* → managed backend with dashboards, metrics and RBAC.

3. **Safe rollback**
  - Explicit compensations or native transactions.
  - *Undo* command by range, date or tag.

4. **Reusable templates**
  - SQL, Kafka, Redis, Twilio, etc.
  - Less boilerplate and proven centralized logic.

5. **Distributed locking**
  - Prevents duplicate executions in parallel deployments.
  - Implementations for MongoDB, Redis, DynamoDB…

6. **Batching for massive loads**
  - Processes large volumes in idempotent fragments.
  - Automatically resumes after failures.

7. **First-class integrations**
  - Spring Boot, Micronaut, Quarkus, CLI, REST API.
  - Dependency injection and access to application context.

8. **Cloud edition with added value**
  - Real-time dashboard, alerts, RBAC and multi-environment.
  - No infrastructure operations or audit store backups.


## Development Commands

### Installation
```bash
yarn
```

### Development
```bash
yarn start
```
Starts local development server with hot reload

### Build
```bash
yarn build
```
Generates static content into the `build` directory

### Deployment
```bash
# Using SSH
USE_SSH=true yarn deploy

# Using HTTPS
GIT_USER=<username> yarn deploy
```

### Other Commands
```bash
yarn serve          # Serve built site locally
yarn clear          # Clear Docusaurus cache
yarn swizzle        # Eject Docusaurus components for customization
```

## Architecture

### Site Structure
- **Homepage**: Redirects to `/docs/1.0.0/overview/Introduction` (configured in `docusaurus.config.js`)
- **Documentation**: Organized in `docs/` with versioned structure
- **Configuration**: Main config in `docusaurus.config.js`
- **Sidebar**: Configured in `sidebars.js`

### Key Directories
- `docs/`: Main documentation content organized by categories
  - `overview/`: Introduction and core concepts
  - `community-edition/`: CE-specific documentation
  - `flamingock-library-config/`: Library configuration guides
  - `frameworks/`: Framework integration guides
  - `templates/`: Template documentation
  - `testing/`: Testing guides
- `src/`: React components and pages
- `static/`: Static assets (images, diagrams)
- `blog/`: Blog content configuration

### Technology Stack
- **Docusaurus 3.8.1**: Static site generator
- **React 19**: Component framework
- **Algolia Search**: Site search functionality
- **Mermaid**: Diagram rendering
- **Prism**: Code syntax highlighting

### Configuration Details
- **Versioning**: Configured for version 1.0.0 with path `/1.0.0`
- **Search**: Algolia integration with contextual search
- **Theming**: Custom CSS in `src/css/custom.css`
- **Deployment**: GitHub Pages to `gh-pages` branch

### Content Management
- Documentation uses frontmatter for metadata
- Sidebar navigation auto-generated from `_category_.json` files
- Homepage redirects to Introduction page via custom field
- Version dropdown shows current version as 1.0.0

## Development Notes

- The site uses yarn as package manager
- Node.js 18+ required
- Homepage component is set up to redirect rather than display default content
- Search functionality requires Algolia configuration
- Mermaid diagrams are supported throughout the documentation