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

## Core Value Proposition & Philosophy

### Flamingock Guarantee
"Your system will always be left in a known, auditable, and consistent state — no matter what happens."

### Safety-First Philosophy
- **Default to safety**: When uncertain, stop and alert rather than corrupt
- **Explicit flexibility**: Advanced users can opt into automatic retry for idempotent operations  
- **Complete audit trail**: Every action, success, and failure is tracked
- **Deterministic state**: Always know exactly what happened and what needs to happen next

## CRITICAL: Flamingock Positioning Strategy

**The validated dual positioning approach for Flamingock:**

### 1. Community Edition (Developer-First, Bottom-Up)
- **Message**: "Manage all your changes alongside your app, like Liquibase but for the whole stack."
- **Goal**: Broad adoption by developers, ease of use, speed, and confidence in local/dev environments
- **Target**: Individual developers and small teams looking for practical change management

### 2. Cloud/Self-Hosted Edition (Enterprise, Top-Down)
- **Message**: "Audit, govern, and secure those changes at scale, like LaunchDarkly but for compliance."
- **Goal**: Monetization, governance, compliance, observability, and premium features for enterprises
- **Target**: Enterprise teams requiring governance, compliance, and organizational control

**KEY INSIGHT**: Flamingock is developer-first for adoption and enterprise-ready for business.

### Edition Positioning
- **Community Audit Stores**: Secure + Functional
  - Complete safety guarantees
  - Manual intervention when needed
  - Full audit capabilities
  - Covers essential enterprise needs

- **Cloud Edition**: Secure + Resilient + Automatic  
  - Same configuration options as Community
  - Enhanced automatic resolution through advanced mechanisms
  - Better resilience through markers and reconciliation
  - Premium value: "Same settings, better outcomes"

## Flamingock Architecture

### Target Systems vs Audit Store

Flamingock operates with a dual-system architecture that's critical to understand:

#### Target Systems
**Target Systems** are where your business changes are applied - the systems you're actually migrating or evolving:

- **Examples**: User database, Product catalog, Order management system, Payment processing DB
- **Purpose**: Store and process your business data
- **Changes applied**: Business logic migrations, schema updates, data transformations
- **Annotation**: `@TargetSystem("user-database")`

#### Audit Store
**Audit Store** is where Flamingock tracks execution history and state - completely separate from your business systems:

- **Examples**: Dedicated audit database, separate MongoDB collection, audit service
- **Purpose**: Store execution logs, audit entries, issue tracking, compliance data
- **Changes applied**: None - read-only for your business logic, write-only for Flamingock
- **Configuration**: Set up once in Flamingock configuration, not in individual changes

#### Key Differences

| Aspect             | Target System                   | Audit Store                         |
|--------------------|---------------------------------|-------------------------------------|
| **Purpose**        | Business data and logic         | Execution tracking and compliance   |
| **Modified by**    | Your @Execution methods         | Flamingock framework automatically  |
| **Access pattern** | Read/Write by your code         | Read/Write by Flamingock            |
| **Examples**       | `user-db`, `inventory-system`   | `flamingock-audit`, `audit-service` |
| **Failure impact** | Business functionality affected | Only tracking affected              |
| **Recovery scope** | Business data recovery          | Audit trail recovery                |

### Target Systems and Transactionality

Flamingock works with two types of target systems:

#### Transactional Target Systems
- **Examples**: PostgreSQL, MySQL, MongoDB (4.0+), Oracle
- **Native Capabilities**: Built-in rollback, atomicity, consistency guarantees
- **In Flamingock**: Changes can leverage native transactions via `@ChangeUnit(transactional = true)`
- **Rollback Strategy**: Automatic (database handles it) or manual via `@RollbackExecution`

#### Non-Transactional Target Systems
- **Examples**: Kafka, S3, ElasticSearch, REST APIs, File Systems, MongoDB (pre-4.0)
- **Native Capabilities**: No built-in rollback mechanism, no atomicity guarantees
- **In Flamingock**: All changes are `transactional = false`
- **Rollback Strategy**: Manual only via `@RollbackExecution` (user-provided compensation logic)

## Recovery Strategies

Flamingock provides two configurable recovery strategies:

### MANUAL_INTERVENTION (Default)
**Philosophy**: "When in doubt, stop and alert."

- **When it activates**: Any failure where state is uncertain
- **What happens**: Execution stops, issue logged, requires human review via CLI or Cloud UI
- **Why it's default**: Prevents silent data corruption
- **Best for**: Critical data migrations, non-idempotent operations, systems where correctness > availability

### ALWAYS_RETRY
**Philosophy**: "Keep trying until successful."

- **When it activates**: Any failure, regardless of state
- **What happens**: Automatic retry on next execution, no manual intervention required
- **Why opt-in**: Requires idempotent operations
- **Best for**: Idempotent operations, event publishing, cache warming, non-critical updates

### Cloud Edition Enhanced Recovery
Cloud Edition uses the **same recovery strategies** but provides **enhanced outcomes**:

- **Enhanced MANUAL_INTERVENTION**: Automatic issue detection with real-time alerts, detailed diagnostics, workflow automation, team collaboration
- **Enhanced ALWAYS_RETRY**: Intelligent retry backoff, marker mechanism for safe retries, automatic reconciliation, circuit breaker patterns
- **Marker Mechanism**: Uses markers in transactional systems to determine safe recovery actions
- **Enterprise Features**: Multi-region coordination, zero-downtime migrations, compliance reporting, SLA guarantees

## Audit States and Issue Resolution

### Audit States
- **Success States**: EXECUTED, ROLLED_BACK, MANUAL_MARKED_AS_EXECUTED
- **Failure States** (Create Issues): STARTED, EXECUTION_FAILED, ROLLBACK_FAILED
- **Resolution States**: MANUAL_MARKED_AS_EXECUTED, MANUAL_MARKED_AS_ROLLED_BACK

### Issue Detection
An "issue" is detected when:
1. Audit entry is in a failure state
2. Change is required to run again
3. Recovery strategy determines next action

### CLI Resolution Commands
```bash
# List all issues
flamingock issue list

# Get detailed issue information
flamingock issue get -c change-id --guidance

# Fix an issue (mark as resolved)
flamingock audit fix -c change-id
```

## Competitive Differentiation

### vs Traditional Migration Tools

| Aspect                  | Flyway/Liquibase   | Mongock                | Flamingock              |
|-------------------------|--------------------|------------------------|-------------------------|
| **Focus**               | SQL databases      | MongoDB only           | All systems             |
| **Distributed Systems** | ❌ Not designed for | ❌ Limited              | ✅ First-class support   |
| **Non-transactional**   | ❌ No support       | ❌ Assumes transactions | ✅ Full support          |
| **Failure Handling**    | Retry blindly      | Retry blindly          | Configurable strategies |
| **Audit Trail**         | Basic              | Basic                  | Comprehensive           |
| **Issue Resolution**    | Manual SQL         | None                   | CLI + Cloud automation  |
| **Safety Default**      | None               | None                   | MANUAL_INTERVENTION     |

### Unique Value Propositions
1. **Only platform addressing distributed systems holistically** - Not just databases, but Kafka, S3, APIs, etc.
2. **Safety-first design philosophy** - Default to manual intervention, explicit opt-in for automatic retry
3. **Enterprise-grade audit and compliance** - Complete audit trail, issue tracking, compliance reporting
4. **Progressive enhancement model** - Community provides essential safety, Cloud enhances outcomes with same config

## Common Patterns and Best Practices

### Pattern 1: Idempotent by Design
Make changes idempotent when possible, then use ALWAYS_RETRY:
- INSERT ... ON CONFLICT DO NOTHING
- PUT with same key-value
- CREATE IF NOT EXISTS

### Pattern 2: Critical Path Protection  
Keep MANUAL_INTERVENTION for critical data paths:
- Financial transactions
- User authentication data
- Compliance-related changes

### Pattern 3: Progressive Migration
Start with MANUAL_INTERVENTION, move to ALWAYS_RETRY after validation

### Pattern 4: Transactional vs Non-Transactional Strategy
- **Large bulk operations**: Non-transactional for performance, MANUAL_INTERVENTION for safety
- **Small critical operations**: Transactional for safety, MANUAL_INTERVENTION for consistency

### @RollbackExecution Best Practice
**Always provide @RollbackExecution methods** even for transactional changes:
1. **For transactional changes**: Used for CLI undo operations (not executed on failure)
2. **For non-transactional changes**: Executed automatically on failure to clean up
3. **CLI integration**: Essential for `flamingock undo` command functionality
4. **Audit compliance**: Provides clear trail of how changes can be reversed

## CRITICAL: Flamingock Transaction Behavior

**Important Technical Detail**: Even in Community Audit Stores, audit operations and target system changes are ALWAYS executed in separate transactions:

### Transaction Separation Rules
1. **Non-transactional target systems**: No transactions at all - neither the change nor audit
2. **Transactional target systems**: Change executes in one transaction, audit writes in a separate transaction
3. **Same database as audit store**: Still separate transactions - target system transaction + separate audit transaction

### Recovery Implications
- **Community Audit Stores**: Flamingock can recover the majority of failure scenarios through separate transaction approach
- **Uncertain scenarios**: When Flamingock saves "started" audit but fails before saving completion status
- **Cloud Edition**: Marker mechanism provides 100% recovery even in uncertain scenarios

### Key Point
**NEVER document that audit and changes happen in the same transaction** - this is architecturally incorrect for Flamingock's design.

## Cloud Edition Advanced Features (Future/Roadmap)

### Custom Marker Mechanisms for Non-Transactional Systems
**Status**: Planned for Cloud Edition (not yet implemented)

**Concept**: Similar to how markers work for transactional target systems (to check if change was applied or not), Cloud Edition will provide an option for users to supply custom mechanisms for non-transactional systems to determine:
- Was the change successfully applied?  
- Was it not applied at all?
- Was it partially applied?

**Value**: This custom marker capability will enable Cloud Edition to provide complete recoverability even for non-transactional systems (Kafka, S3, APIs, etc.) by allowing users to define their own validation logic for change state determination.

**Documentation Note**: Mention this briefly in non-transactional sections as "Cloud Edition will provide custom marker mechanisms for enhanced recoverability" but don't elaborate details since it's not yet implemented.


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
  - `community-audit-stores/`: Community audit stores specific documentation
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

## Documentation Style Guidelines

### Title Capitalization
- Use sentence case for titles and headers (capitalize only first word and proper nouns)
- Avoid uppercase for words that are not the first word or proper names
- Example: "Recovery strategies" not "Recovery Strategies"

### Content Style
- Avoid emojis in documentation sections unless explicitly requested
- Keep technical documentation professional and clean
- Focus on clarity and readability over decoration

### Technology Examples
- **CRITICAL**: When listing example technologies, ALWAYS include a mix of database and non-database technologies
- **NEVER** list only database technologies (e.g., "SQL, MongoDB") as this incorrectly positions Flamingock as just a database tool
- **ALWAYS** include diverse examples like: Kafka, S3, Redis, SQL, MongoDB, REST APIs, feature flags, etc.
- Flamingock is a comprehensive change management platform for ALL external systems, not just databases

## Request Evaluation Framework

**CRITICAL**: Before proceeding with any request, Claude must evaluate it against these three criteria and score each from 1-10. If any criterion scores below 8, Claude must ask for clarification to ensure all criteria reach at least 8 before proceeding:

1. **Clarity of the goal** (1-10): Is the objective clearly defined and unambiguous?
2. **Context detail** (1-10): Is there sufficient context and information to execute the task properly?
3. **Potential of the result** (1-10): Will the outcome be valuable and meet expectations?

This evaluation must be applied to every request, whether in plan mode, edit mode, or any other mode. Claude should ask for any necessary clarifications to ensure high-quality results.