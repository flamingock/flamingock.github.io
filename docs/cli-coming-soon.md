---
title: CLI (Coming Soon)
sidebar_position: 999
---

# CLI (Coming Soon)

Flamingock’s Command-Line Interface (CLI) will enable operational and maintenance tasks outside your application’s normal startup cycle. You’ll be able to run change units, inspect or repair the audit log, and manage locks—all from a standalone command.

:::info
**Status:** The CLI is under development and will be released soon.  
This page provides a high-level overview of the features you can expect.
:::

---

## Why a CLI?

- **Operational control**  
  Execute change units, perform dry-runs, or trigger rollbacks without launching the full application.

- **Maintenance tasks**  
  Inspect or fix inconsistencies in the audit log, manage stale locks, and run integrity checks.

- **Automation & scripting**  
  Integrate Flamingock operations into CI/CD pipelines, cron jobs, or custom scripts.

---

## Planned Features

When first released, the Flamingock CLI will support:

- **Run change units**  
  Execute any pending change units defined in your application’s code base.  
  _(Requires passing your application JAR so the CLI can load the `@ChangeUnit` classes, but only if a change unit depends on code inside that JAR.)_

- **Dry-run mode**  
  Preview which change units would run and in what order—without making any changes or writing to the audit store.

- **Rollback / Undo**  
  Revert one or more change units that have already executed (by specifying change ID, date, or tag).  
  _(Requires the application JAR if the change unit’s logic depends on application-specific classes.)_

- **Audit inspection**  
  List executed change units from the audit store and filter by criteria such as author, date range, or status.  
  _(Does *not* require your application JAR, since it only reads from the audit backend.)_

- **Lock management**  
  View or clear distributed locks that may have been left behind by interrupted processes.

- **Consistency checks**  
  Compare the change-unit definitions in your code against entries in the audit log to detect mismatches or missing entries.

---

## Example Usage

Below are illustrative commands using the `fcli` (Flamingock CLI) binary. If a command needs to load your change-unit classes, it must be pointed at your application JAR. Other commands (like audit inspection) work without a JAR.

```bash
# 1. Run all pending change units in 'development' profile
fcli run \
  --app-jar /path/to/your-app.jar \
  --config application.yaml \
  --profile development

# 2. Preview pending changes (no JAR required)
fcli dry-run \
  --config application.yaml \
  --profile development

# 3. Roll back a specific change by ID (requires the JAR only if rollback logic uses application classes)
fcli rollback \
  --app-jar /path/to/your-app.jar \
  --change-id 0005_add_users_table \
  --config application.yaml

# 4. List audit log entries, filter by author (no JAR required)
fcli audit-list \
  --config application.yaml \
  --filter author=dev-team

# 5. Clear any stale locks (no JAR required)
fcli clear-locks \
  --config application.yaml

--app-jar: Path to your compiled application JAR containing @ChangeUnit classes. Required only for commands that execute or roll back change units whose logic depends on code inside your application.

--config: Flamingock configuration file (e.g., application.yaml or flamingock.properties).

--profile: Spring-style profile or environment name (the CLI will pass this to Flamingock to select the right changes).

```

## Getting Started (Once Available)

**Install the CLI**  
Download and install the platform-specific `fcli` binary for Linux, macOS, or Windows.

**Prepare your application JAR**  
Build your project so that all `@ChangeUnit` classes are packaged into a single runnable JAR.

**Run CLI commands**  
Use the commands shown above—supplying `--app-jar` only when running or rolling back change units that depend on application-specific classes.

## Feedback & Contributions

We welcome your feedback on the CLI design. As the CLI nears release, feel free to open issues or submit pull requests to the Flamingock CLI repository.
