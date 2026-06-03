---
title: Flamingock CLI
sidebar_position: 999
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Flamingock CLI

Command-line tool to execute Flamingock operations outside your application's normal startup.

## Overview

The Flamingock CLI spawns your application JAR in a separate JVM process, runs the requested operation, and returns structured results. This means you can run changes in CI/CD pipelines, audit history, diagnose issues, and fix audit states — before, after, or outside your application lifecycle.

## Installation

### Install script (recommended)

<Tabs groupId="cli_install_os">
  <TabItem value="linux" label="Linux / WSL" default>

```bash
curl -fsSL https://flamingock.io/cli/install/linux | bash

# Specific version or custom install directory (no sudo)
curl -fsSL https://flamingock.io/cli/install/linux | FLAMINGOCK_VERSION=1.1.0 FLAMINGOCK_INSTALL_DIR=~/.local/bin bash
```

  </TabItem>
  <TabItem value="macos" label="macOS">

```bash
curl -fsSL https://flamingock.io/cli/install/macos | bash

# Specific version or custom install directory (no sudo)
curl -fsSL https://flamingock.io/cli/install/macos | FLAMINGOCK_VERSION=1.1.0 FLAMINGOCK_INSTALL_DIR=~/.local/bin bash
```

  </TabItem>
  <TabItem value="windows" label="Windows (PowerShell)">

```powershell
irm https://flamingock.io/cli/install/win | iex

# Specific version
$env:FLAMINGOCK_VERSION="1.1.0"; irm https://flamingock.io/cli/install/win | iex
```

  </TabItem>
</Tabs>

### Homebrew (macOS / Linux)

```bash
brew tap flamingock/tap
brew install flamingock
```

## Commands

```bash
flamingock [global-options] <command> [command-options]
```

### Global options

| Option        | Short  | Description                                             |
|---------------|--------|---------------------------------------------------------|
| `--log-level` | `-l`   | Application log level: `debug`, `info`, `warn`, `error` |
| `--quiet`     | `-q`   | Suppress non-essential output                           |
| `--no-color`  |        | Disable colored output                                  |
| `--help`      | `-h`   | Show help information                                   |
| `--version`   |        | Show version information                                |

Global options are inherited by all subcommands.

### `install-skills`

Install skills from the Flamingock registry. By default, installs all skills to `./.agents/skills`. Use `--agent` to install skills for a specific agent.

| Command                                                                                      | Destination                                                          |
|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `flamingock install-skills`                                                                  | `./.agents/skills`                                                   |
| `flamingock install-skills --agent {claude, github, cursor, opencode, gemini, windsurf, pi}` | `./.{claude, github, cursor, opencode, gemini, windsurf, pi}/skills` |

:::note
Paths are resolved relative to the directory where you run the command.
:::

### `execute apply`

Apply pending changes by spawning your application JAR.

| Option       | Short | Required | Description                                                     |
|--------------|-------|----------|-----------------------------------------------------------------|
| `--jar`      | `-j`  | Yes      | Path to the application JAR                                     |
| `--java-opt` | `-J`  | No       | JVM argument for the spawned process (repeatable)               |
| `--`         |       | No       | Separator — everything after is passed as application arguments |

```bash
# Apply pending changes
flamingock execute apply --jar ./my-app.jar

# Pass Spring profiles or other application arguments
flamingock execute apply --jar ./my-app.jar -- --spring.profiles.active=prod --spring.datasource.url=jdbc:mysql://prod/db

# Pass JVM arguments
flamingock execute apply --jar ./my-app.jar -J -Xmx512m -J -Xms256m

# Combine JVM and application arguments
flamingock execute apply --jar ./my-app.jar -J -Xmx1g -- --spring.profiles.active=staging
```

### `audit list`

List audit entries from the change history.

| Option       | Short | Required | Description                                                                 |
|--------------|-------|----------|-----------------------------------------------------------------------------|
| `--jar`      | `-j`  | Yes      | Path to the application JAR                                                 |
| `--history`  |       | No       | Show full chronological history instead of snapshot                         |
| `--since`    |       | No       | Filter entries since date (ISO-8601: `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm:ss`) |
| `--extended` | `-e`  | No       | Show extended information (execution ID, class, method, hostname)           |
| `--java-opt` | `-J`  | No       | JVM argument for the spawned process (repeatable)                           |
| `--`         |       | No       | Separator — everything after is passed as application arguments             |

```bash
# Current state (latest per change unit)
flamingock audit list --jar ./my-app.jar

# Full chronological history
flamingock audit list --jar ./my-app.jar --history

# Filter entries since a specific date
flamingock audit list --jar ./my-app.jar --since 2025-01-01

# Show extended information (execution ID, class, method, hostname)
flamingock audit list --jar ./my-app.jar --extended
```

### `audit fix`

Fix audit state for a change with issues. After manually verifying or fixing the state, mark the change as resolved.

| Option         | Short | Required | Description                                                     |
|----------------|-------|----------|-----------------------------------------------------------------|
| `--jar`        | `-j`  | Yes      | Path to the application JAR                                     |
| `--change-id`  | `-c`  | Yes      | Change unit ID to fix                                           |
| `--resolution` | `-r`  | Yes      | Resolution type: `APPLIED` or `ROLLED_BACK`                     |
| `--java-opt`   | `-J`  | No       | JVM argument for the spawned process (repeatable)               |
| `--`           |       | No       | Separator — everything after is passed as application arguments |

```bash
# Mark as successfully applied
flamingock audit fix --jar ./my-app.jar -c user-change-v2 -r APPLIED

# Mark as not applied (Flamingock will retry on next execution)
flamingock audit fix --jar ./my-app.jar -c user-change-v2 -r ROLLED_BACK
```

For detailed workflows on issue resolution, see [Issue resolution](../safety-and-recovery/issue-resolution.md).

### `issue list` (alias: `ls`)

List all change units with inconsistent audit states.

| Option       | Short | Required | Description                                                     |
|--------------|-------|----------|-----------------------------------------------------------------|
| `--jar`      | `-j`  | Yes      | Path to the application JAR                                     |
| `--json`     |       | No       | Output in JSON format                                           |
| `--java-opt` | `-J`  | No       | JVM argument for the spawned process (repeatable)               |
| `--`         |       | No       | Separator — everything after is passed as application arguments |

```bash
# List issues in table format
flamingock issue list --jar ./my-app.jar

# JSON output for CI/CD pipelines
flamingock issue list --jar ./my-app.jar --json
```

### `issue get` (alias: `describe`)

Get detailed information about an audit issue.

| Option        | Short | Required | Description                                                     |
|---------------|-------|----------|-----------------------------------------------------------------|
| `--jar`       | `-j`  | Yes      | Path to the application JAR                                     |
| `--change-id` | `-c`  | No       | Specific change unit ID (shows first issue if omitted)          |
| `--guidance`  | `-g`  | No       | Include resolution guidance                                     |
| `--json`      |       | No       | Output in JSON format                                           |
| `--java-opt`  | `-J`  | No       | JVM argument for the spawned process (repeatable)               |
| `--`          |       | No       | Separator — everything after is passed as application arguments |

```bash
# Get next priority issue with resolution guidance
flamingock issue get --jar ./my-app.jar --guidance

# Get details for a specific issue
flamingock issue get --jar ./my-app.jar -c user-change-v2

# Get specific issue with resolution guidance
flamingock issue get --jar ./my-app.jar -c user-change-v2 --guidance

# JSON output
flamingock issue get --jar ./my-app.jar -c user-change-v2 --json
```

## Exit codes

| Code  | Meaning                                              |
|-------|------------------------------------------------------|
| `0`   | Success                                              |
| `1`   | Execution error (change failed, process error, etc.) |
| `2`   | Usage error (invalid arguments)                      |
| `126` | JAR not found or not a file                          |
| `130` | Interrupted (Ctrl+C)                                 |

## Example output

### Audit list output

```
Audit Entries Snapshot (Latest per Change Unit):
==================================================

┌──────────────────────────────┬────────┬──────────────────┬─────────────────────┐
│ Change ID                    │ State  │ Author           │ Time                │
├──────────────────────────────┼────────┼──────────────────┼─────────────────────┤
│ create-users-collection      │ ✓      │ platform-team    │ 2025-01-07 10:15:23 │
│ add-user-indexes             │ ✓      │ platform-team    │ 2025-01-07 10:15:24 │
│ seed-initial-data            │ ✗      │ data-team        │ 2025-01-07 10:15:25 │
└──────────────────────────────┴────────┴──────────────────┴─────────────────────┘

Legend: ✓ = EXECUTED | ✗ = FAILED | ▶ = STARTED | ↩ = ROLLED_BACK

Total entries: 3
```

### Issue details output

```
Issue Details: seed-initial-data
==================================================

📋 OVERVIEW
  Change ID: seed-initial-data
  State: STARTED (❌)
  Target System: user-database
  Author: data-team
  Time: 2025-01-07 10:15:25
  Execution ID: exec-123456
  Duration: 1523ms

⚠️  ERROR DETAILS
  Execution interrupted unexpectedly

  Technical Details:
  - Class: i.f.changes.SeedData
  - Method: execute
  - Hostname: prod-server-01

🔧 Resolution Process:

     1. Review the error details above to understand the root cause

     2. Verify the actual state in your target system (user-database):
        • Check if the change was successfully applied despite the audit failure
        • Determine if the change was partially applied or not applied at all

     3. Fix the audit state based on your findings:

        ✅ If change was successfully applied:
           flamingock audit fix --jar ./my-app.jar -c seed-initial-data -r APPLIED

        ↩️  If change was not applied or you've manually rolled it back:
           flamingock audit fix --jar ./my-app.jar -c seed-initial-data -r ROLLED_BACK
           (Flamingock will retry this change in the next execution)

     ⚠️  Important: For partially applied changes, you must either:
         • Manually complete the change, then fix it with resolution(-r) APPLIED
         • Manually revert the change, then fix it with resolution(-r) ROLLED_BACK
```

## How it works

The CLI contains no execution logic. It is purely an orchestrator:

```
┌─────────────────────┐         ┌──────────────────────────────────────┐
│   Flamingock CLI    │ spawns  │   Your app (spawned JVM)             │
│   (Picocli-based)   │────────►│                                      │
│                     │         │   --flamingock.cli.mode=true         │
│   - Parse args      │◄────────│   --flamingock.operation=...         │
│   - Build command   │exit code│   --flamingock.output-file=...       │
│   - Launch JVM      │         │                                      │
│   - Read result     │◄────────│                                      │
└─────────────────────┘  file   └──────────────────────────────────────┘
```

1. Creates a temporary file for the response
2. Spawns your application JAR with Flamingock flags
3. Your app executes the operation and writes the result
4. CLI reads, formats, and displays the result
5. Returns the appropriate exit code

User-provided arguments are forwarded to the spawned process:
- **`-J` / `--java-opt`**: JVM arguments placed before `-jar` (e.g., `-J -Xmx512m`)
- **`--` separator**: Application arguments appended at the end (e.g., `-- --spring.profiles.active=prod`)

## Troubleshooting

### Connection issues

If changes fail to connect to the audit store:
1. Verify your application configuration is correct for the target environment
2. Pass the right profile or datasource via app arguments: `-- --spring.profiles.active=prod`
3. Enable log output to see application logs: `flamingock --log-level=debug execute apply --jar ./my-app.jar`

### JAR not found (exit code 126)

If you get `JAR file not found`:
1. Check the path to your JAR is correct
2. Ensure the JAR has been built before running the CLI

### Missing Flamingock runtime

If the CLI reports a missing entry point:
1. Ensure you are using an uber JAR (fat JAR with all dependencies bundled), not a thin JAR
2. Verify `flamingock-core` is included in your shading/shadow configuration and not excluded

### No issues found

If `issue list` shows no issues but you expect some:
1. Verify you are connecting to the correct environment
2. Check if issues were already resolved
3. Use `audit list --history` to see all historical entries
