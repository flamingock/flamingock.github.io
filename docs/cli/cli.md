---
title: Flamingock CLI
sidebar_position: 999
---

# Flamingock CLI

Command-line tool for audit management and maintenance operations.

> **Beta Release**
> This is the beta version of Flamingock CLI, providing essential management operations for audit control and issue resolution. A more comprehensive CLI with full change execution capabilities is in development.

## Overview

The Flamingock CLI provides operational commands for audit management and maintenance. Use these commands to view audit history, identify issues, and perform resolution operations.

## Installation

### Download

```bash
# Download the latest CLI distribution
curl -L https://github.com/flamingock/flamingock-java/releases/latest/download/flamingock-cli.tar.gz -o flamingock-cli.tar.gz

# Extract the archive and get into the directory
tar -xzf flamingock-cli.tar.gz
cd flamingock-cli/bin

# Make script executable
chmod +x flamingock

# Run the CLI
./flamingock --help
```

### Configuration

Create a `flamingock.yaml` configuration file in your working directory:

#### MongoDB configuration
```yaml
serviceIdentifier: my-service  # Optional, defaults to "flamingock-cli"
audit:
  mongodb:
    connectionString: mongodb://localhost:27017
    database: myapp
    # Or use individual properties:
    # host: localhost
    # port: 27017
    # username: admin
    # password: secret
```

#### DynamoDB configuration
```yaml
serviceIdentifier: my-service
audit:
  dynamodb:
    region: us-east-1
    # Optional endpoint for local development:
    # endpoint: http://localhost:8000
    # accessKey: local
    # secretKey: local
```

#### Couchbase configuration
```yaml
serviceIdentifier: my-service
audit:
  couchbase:
    endpoint: "http://localhost:8000"
    username: "your-username"
    password: "your-password"
    bucket-name: "my-app"
```

You can specify a custom configuration file using the `-c` or `--config` option:
```bash
flamingock -c custom-config.yaml audit list
```

## Core commands

### View audit entries

List the current state of all changes (snapshot view):
```bash
flamingock audit list
```

View the complete chronological history:
```bash
flamingock audit list --history
```

View changes since a specific date:
```bash
flamingock audit list --since 2025-01-01T00:00:00
```

Show extended information including execution details:
```bash
flamingock audit list --extended
```

### Find issues

List all change units with inconsistent audit states:
```bash
flamingock issue list
```

Output in JSON format for automation:
```bash
flamingock issue list --json
```

### Investigate issues

Get detailed information about a specific issue:
```bash
flamingock issue get -c user-change-v2
```

Include resolution guidance:
```bash
flamingock issue get -c user-change-v2 --guidance
```

Get the next priority issue (when no change ID specified):
```bash
flamingock issue get --guidance
```

### Resolve issues

After manually verifying or fixing the state, mark the change as resolved:

If the change was successfully applied:
```bash
flamingock audit fix -c user-change-v2 -r APPLIED
```

If the change was not applied or rolled back:
```bash
flamingock audit fix -c user-change-v2 -r ROLLED_BACK
```

For detailed workflows on issue resolution, see [Issue resolution](../safety-and-recovery/issue-resolution.md).

## Command Reference

### Global options

```bash
flamingock [global-options] <command> [command-options]
```

- `-c, --config <file>` - Configuration file path (default: `flamingock`)
- `--verbose` - Enable verbose logging
- `--debug` - Enable debug logging
- `--trace` - Enable trace logging (most detailed level)
- `--quiet` - Suppress non-essential output
- `--help` - Show help information
- `--version` - Show version information

### `audit list`

Display audit entries from the audit store.

**Options:**
- `--history` - Show full chronological history (all entries)
- `--since <datetime>` - Show entries since date (ISO-8601 format: `2025-01-01T00:00:00`)
- `-e, --extended` - Show extended information (execution ID, duration, class, method, hostname)

**Examples:**
```bash
# View current state (latest per change unit)
flamingock audit list

# View all historical entries
flamingock audit list --history

# View changes from last 24 hours
flamingock audit list --since 2025-01-07T00:00:00

# View with extended details
flamingock audit list --extended
```

### `audit fix`

Resolve an inconsistent audit state after manual intervention.

**Options:**
- `-c, --change-id <id>` - Change unit ID to fix (required)
- `-r, --resolution <type>` - Resolution type: `APPLIED` or `ROLLED_BACK` (required)

**Examples:**
```bash
# Mark as successfully applied
flamingock audit fix -c create-user-index -r APPLIED

# Mark as rolled back (will be retried on next execution)
flamingock audit fix -c create-user-index -r ROLLED_BACK
```

### `issue list` (alias: `ls`)

List all change units with inconsistent audit states.

**Options:**
- `-j, --json` - Output in JSON format

**Examples:**
```bash
# List issues in table format
flamingock issue list

# Output as JSON for automation
flamingock issue list --json
```

### `issue get` (alias: `describe`)

Show detailed information about an issue.

**Options:**
- `-c, --change-id <id>` - Specific change unit ID (optional, shows next issue if omitted)
- `-g, --guidance` - Include resolution guidance
- `-j, --json` - Output in JSON format

**Examples:**
```bash
# Get next priority issue
flamingock issue get --guidance

# Get specific issue details
flamingock issue get -c user-change-v3

# Get with resolution guidance
flamingock issue get -c user-change-v3 --guidance

# Output as JSON
flamingock issue get -c user-change-v3 --json
```

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
           flamingock audit fix -c seed-initial-data -r APPLIED

        ↩️  If change was not applied or you've manually rolled it back:
           flamingock audit fix -c seed-initial-data -r ROLLED_BACK
           (Flamingock will retry this change in the next execution)

     ⚠️  Important: For partially applied changes, you must either:
         • Manually complete the change, then fix it with resolution(-r) APPLIED
         • Manually revert the change, then fix it with resolution(-r) ROLLED_BACK
```

## Logging levels

Control the verbosity of output using logging options:

```bash
# Normal output (default)
flamingock audit list

# Verbose output with info logs
flamingock --verbose audit list

# Debug output with detailed logs
flamingock --debug audit list

# Minimal output
flamingock --quiet audit list
```

## Troubleshooting

### Connection issues

If you see "Cannot connect to audit store":
1. Verify your configuration file exists and is valid YAML
2. Check database connection parameters
3. Ensure the database is accessible from your location
4. Test with verbose logging: `flamingock --verbose audit list`

### No issues found

If `issue list` shows no issues but you expect some:
1. Verify you're connecting to the correct audit store
2. Check if issues were already resolved
3. Use `audit list --history` to see all historical entries

### Permission errors

If you get permission errors when running `audit fix`:
1. Ensure your database credentials have write access
2. Verify the audit collection/table permissions
3. Check if the database user can modify audit entries
