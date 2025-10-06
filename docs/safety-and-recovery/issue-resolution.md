---
title: Issue Resolution
sidebar_position: 2
---

# Issue Resolution

Issue resolution is an iterative process of identifying failures, investigating their cause in target systems, and marking the appropriate resolution. Flamingock provides CLI tools to systematically work through issues until all are resolved.


## Understanding issues

### What creates an issue?
An "issue" is detected when:
1. **Change execution fails** during the `@Apply` method
2. **Change starts but never completes** (process crash, timeout)
3. **Rollback fails** during `@Rollback` method
4. **Change needs to run again** but is in uncertain state


## CLI-driven resolution workflow

### 1. Issue discovery
```bash
flamingock issue list
```

**Example Output**:
```
ISSUES FOUND (3)
┌─────────────────────────┬─────────┬──────────────────┬──────────────┐
│ Change ID               │ State   │ Error            │ Target       │
├─────────────────────────┼─────────┼──────────────────┼──────────────┤
│ user-data-sync-v2       │ STARTED │ Connection lost  │ user-db      │
│ cache-warming-q4        │ FAILED  │ Redis timeout    │ redis-cache  │
│ payment-processing      │ FAILED  │ Validation error │ payment-api  │
└─────────────────────────┴─────────┴──────────────────┴──────────────┘

Use 'flamingock issue get' to process issues automatically, or
'flamingock issue get -c <change-id>' for specific issue details.
```

### 2. Automated issue triage
```bash
flamingock issue get
```

**What This Does**:
- Automatically selects the next issue
- Provides detailed context and diagnostic information
- Suggests resolution approaches based on failure type
- No need to copy/paste change IDs

**Example Output**:
```
ISSUE: user-data-sync-v2
Status: STARTED (execution began but never completed)
Target System: user-database
Author: platform-team
Started: 2024-01-15 14:32:15 UTC
Error: Connection lost during execution

DIAGNOSTIC INFORMATION:
- Change was modifying user profiles in MongoDB
- Execution started but connection dropped after 30 seconds
- No rollback was triggered (connection failure before completion)
- Potentially partial state in target system

RESOLUTION GUIDANCE:
1. Check target system state:
   - Query user-database for partially updated records
   - Look for users with incomplete profile updates
   - Check MongoDB logs for connection errors around 14:32:15 UTC

2. Determine actual state:
   - If no changes were applied → mark as ROLLED_BACK (safe to retry)
   - If changes were partially applied → complete manually, then mark APPLIED
   - If changes were fully applied → mark as APPLIED
   - If changes caused corruption → rollback manually, then mark ROLLED_BACK

3. Resolve the issue:
   flamingock audit fix -c user-data-sync-v2 --resolution APPLIED
   flamingock audit fix -c user-data-sync-v2 --resolution ROLLED_BACK

Next: flamingock issue get (to process next issue)
```

### 3. Verify target system state

Based on the guidance, investigate the **target system** (not the audit store) to determine the actual state of the change. You will find one of three possible states:

- **Fully applied**: The change completed successfully and all expected modifications are present
- **Not applied at all**: The change failed before making any modifications to the target system
- **Partially applied**: Some but not all changes were made to the target system (**only possible with non-transactional target systems**)

For partially applied changes, you must decide whether to:
- Manually complete the remaining changes, then mark as **APPLIED**
- Manually revert the partial changes, then mark as **ROLLED_BACK**

### 4. Mark audit resolution

Based on your target system verification, mark the audit with the appropriate resolution.

- If the change was successfully applied to the target system (either fully or after manual completion of partial changes), mark it as **APPLIED**:

```bash
flamingock audit fix -c change-id -r APPLIED
```

- If the change was not applied or was manually reverted, mark it as **ROLLED_BACK**:

```bash
flamingock audit fix -c change-id -r ROLLED_BACK
```

## Resolution commands

### APPLIED resolution
Mark the change as successfully applied when the target system contains the expected changes:

```bash
flamingock audit fix -c change-id -r APPLIED
```

**Use when:**
- Changes were successfully applied to target system
- Partial changes were completed manually
- Target system is in the desired end state

### ROLLED_BACK resolution
Mark the change as not applied when the target system was not modified or was reverted:

```bash
flamingock audit fix -c change-id -r ROLLED_BACK
```

**Use when:**
- Changes were not applied to target system
- Changes were reverted due to issues
- Target system should be left unchanged

**Note:** Changes marked as ROLLED_BACK will be attempted again on the next execution.
