---
title: Issue Resolution
sidebar_position: 2
---

# Issue Resolution
*Enterprise operational workflows for handling failures*

Flamingock's issue resolution system transforms how organizations handle distributed system evolution failures. Instead of guesswork and manual database queries, you get structured workflows, detailed guidance, and complete audit trails.


## Understanding Issues

### What Creates an Issue?
An "issue" is detected when:
1. **Change execution fails** during the `@Execution` method
2. **Change starts but never completes** (process crash, timeout)
3. **Rollback fails** during `@RollbackExecution` method
4. **Change needs to run again** but is in uncertain state

### Issue States
| State | Description | Action Required |
|-------|-------------|----------------|
| **STARTED** | Execution began but never completed | Manual investigation |
| **EXECUTION_FAILED** | `@Execution` method failed | Review and resolve |
| **ROLLBACK_FAILED** | `@RollbackExecution` method failed | Manual cleanup |


## CLI-Driven Resolution Workflow

### 1. Issue Discovery
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

### 2. Automated Issue Triage
```bash
flamingock issue get
```

**What This Does**:
- Automatically selects the next priority issue
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
   - If no changes were applied → mark as APPLIED (safe to continue)
   - If changes were partially applied → complete manually, then mark APPLIED
   - If changes were fully applied → mark as APPLIED
   - If changes caused corruption → rollback manually, then mark ROLLED_BACK

3. Resolve the issue:
   flamingock audit fix -c user-data-sync-v2 --resolution APPLIED
   flamingock audit fix -c user-data-sync-v2 --resolution ROLLED_BACK

Next: flamingock issue get (to process next issue)
```

### 3. Manual Investigation

Based on the guidance, investigate the **target system** (not the audit store):

```bash
# Example: Check MongoDB for partial updates
mongo user-database --eval "
  db.users.find({
    profileUpdatedAt: { \$gte: ISODate('2024-01-15T14:30:00Z') },
    profileComplete: { \$ne: true }
  }).count()
"
```

### 4. Issue Resolution

After investigation, mark the issue as resolved:

```bash
# If changes were successfully applied (or completed manually)
flamingock audit fix -c user-data-sync-v2 --resolution APPLIED

# If changes were rolled back (or need to be skipped)
flamingock audit fix -c user-data-sync-v2 --resolution ROLLED_BACK
```

**Success Output**:
```
✅ Issue resolved successfully
   Change: user-data-sync-v2
   Resolution: APPLIED
   Audit State: MANUAL_MARKED_AS_EXECUTED
   Next Execution: Will skip this change (marked as completed)
```


## Resolution Types

### APPLIED Resolution
**When to use**:
- Changes were successfully applied to target system
- Partial changes were completed manually
- Change should be marked as "done"

**Effect**:
- Updates audit store to `MANUAL_MARKED_AS_EXECUTED`
- Future executions will skip this change
- Maintains audit trail of manual resolution

```bash
flamingock audit fix -c change-id --resolution APPLIED
```

### ROLLED_BACK Resolution  
**When to use**:
- Changes were rolled back from target system
- Changes caused issues and were reverted
- Change should be marked as "undone"

**Effect**:
- Updates audit store to `MANUAL_MARKED_AS_ROLLED_BACK`
- Future executions will attempt to run this change again
- Enables retry after fixing underlying issues

```bash
flamingock audit fix -c change-id --resolution ROLLED_BACK
```


## Advanced Resolution Scenarios

### Scenario 1: Partial Multi-System Update
```
Issue: user-profile-sync failed
Target Systems: user-database, elasticsearch, redis-cache
Failure: Elasticsearch connection timeout after DB and cache updates
```

**Investigation**:
1. **Database**: Check if user profiles were updated
2. **Cache**: Verify cache entries were created  
3. **Elasticsearch**: Confirm no documents were indexed

**Resolution**:
```bash
# Manually sync remaining Elasticsearch documents
curl -X POST "elasticsearch:9200/users/_bulk" -H 'Content-Type: application/json' -d @user_updates.json

# Mark as successfully applied
flamingock audit fix -c user-profile-sync --resolution APPLIED
```

### Scenario 2: Failed DDL Operation
```
Issue: create-user-indexes failed
Target System: user-database  
Failure: Index creation failed due to duplicate key constraint
```

**Investigation**:
```bash
# Check which indexes were created before failure
mongo user-database --eval "db.users.getIndexes()"
```

**Resolution Options**:
```bash
# Option 1: Complete the index creation manually
mongo user-database --eval "db.users.createIndex({email: 1}, {unique: true, sparse: true})"
flamingock audit fix -c create-user-indexes --resolution APPLIED

# Option 2: Clean up partial indexes and retry later
mongo user-database --eval "db.users.dropIndex('partial_index_name')"
flamingock audit fix -c create-user-indexes --resolution ROLLED_BACK
```

### Scenario 3: External API Failure
```
Issue: notify-users-via-email failed
Target System: email-service-api
Failure: Email service returned 503 Service Unavailable
```

**Investigation**:
```bash
# Check email service logs
curl -X GET "https://email-service/api/v1/status"

# Check which emails were actually sent
curl -X GET "https://email-service/api/v1/notifications?batch=user-migration-2024"
```

**Resolution**:
```bash
# If emails were sent despite the error
flamingock audit fix -c notify-users-via-email --resolution APPLIED

# If no emails were sent and service is now available
flamingock audit fix -c notify-users-via-email --resolution ROLLED_BACK
# This allows automatic retry on next execution
```


## Enterprise Operational Patterns

### Daily Operations Checklist
```bash
#!/bin/bash
# Daily Flamingock health check script

echo "=== Flamingock Issues Check ==="
ISSUE_COUNT=$(flamingock issue list --format count 2>/dev/null || echo "0")

if [ "$ISSUE_COUNT" -gt 0 ]; then
    echo "⚠️  Found $ISSUE_COUNT issues requiring attention"
    echo "Run: flamingock issue get"
    
    # Optional: Send alert to ops team
    slack-notify "#ops-alerts" "Flamingock: $ISSUE_COUNT issues need resolution"
else
    echo "✅ No issues detected"
fi

echo "=== Recent Changes ==="
flamingock audit list --since yesterday --format summary
```

### Bulk Issue Resolution
```bash
#!/bin/bash
# Process all issues interactively

while flamingock issue get --exists; do
    echo "=== Processing Next Issue ==="
    flamingock issue get
    
    echo ""
    echo "Actions:"
    echo "1. Mark as APPLIED (changes were successful)"  
    echo "2. Mark as ROLLED_BACK (changes were reverted)"
    echo "3. Skip (investigate manually later)"
    echo ""
    
    read -p "Choose action (1/2/3): " choice
    
    case $choice in
        1)
            CHANGE_ID=$(flamingock issue get --format id)
            flamingock audit fix -c "$CHANGE_ID" --resolution APPLIED
            echo "✅ Marked as APPLIED"
            ;;
        2)
            CHANGE_ID=$(flamingock issue get --format id)
            flamingock audit fix -c "$CHANGE_ID" --resolution ROLLED_BACK
            echo "✅ Marked as ROLLED_BACK"
            ;;
        3)
            echo "⏭️  Skipped - investigate manually"
            break
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
    
    echo ""
done

echo "✅ All issues processed"
```

### Integration with Monitoring Systems
```yaml
# Example: Prometheus alerting rule
groups:
- name: flamingock
  rules:
  - alert: FlamingockIssuesDetected
    expr: flamingock_unresolved_issues > 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Flamingock issues require attention"
      description: "{{ $value }} unresolved issues in Flamingock"
      runbook_url: "https://wiki.company.com/flamingock-issue-resolution"
```

```bash
# Custom metrics collection script
#!/bin/bash
ISSUE_COUNT=$(flamingock issue list --format count 2>/dev/null || echo "0")
echo "flamingock_unresolved_issues $ISSUE_COUNT" | curl -X POST --data-binary @- http://pushgateway:9091/metrics/job/flamingock
```


## Best Practices

### **Investigate Target Systems, Not Audit Store**
- ❌ `SELECT * FROM changeLog WHERE id = 'change-id'`
- ✅ Check actual business data in target systems
- ✅ Use application logs and system metrics
- ✅ Verify intended business outcomes

### **Document Resolution Decisions**
```bash
# Add documentation when resolving
flamingock audit fix -c user-migration --resolution APPLIED \
  --notes "Verified all users updated successfully. Connection timeout was transient."

# Or maintain a resolution log
echo "$(date): user-migration APPLIED - connection timeout, data verified complete" >> /var/log/flamingock-resolutions.log
```

### **Establish Resolution SLAs**
- **Critical issues**: Resolve within 4 hours
- **Standard issues**: Resolve within 24 hours
- **Non-critical issues**: Resolve within 72 hours

### **Team Responsibilities**
- **Development team**: Create runbooks for their changes
- **Operations team**: Daily issue monitoring and basic resolution
- **Subject matter experts**: Complex issue investigation and resolution
- **Management**: Escalation procedures for critical failures

### **Automation Where Appropriate**
```bash
# Example: Auto-resolve known transient failures
#!/bin/bash
for issue in $(flamingock issue list --format id --filter "error:ConnectionTimeout"); do
    # Check if target system is healthy now
    if ping -c 1 target-database >/dev/null 2>&1; then
        echo "Auto-resolving transient connection issue: $issue"
        flamingock audit fix -c "$issue" --resolution ROLLED_BACK --notes "Auto-resolved: transient connection issue"
    fi
done
```

### **Compliance and Audit Requirements**
- Maintain records of all manual resolutions
- Document investigation process and findings
- Establish approval workflows for critical system changes
- Regular review of resolution patterns for process improvement


## Troubleshooting Common Issues

### "No issues found" but changes are stuck
```bash
# Check if changes are actually failing or just slow
flamingock audit list --status STARTED --since "1 hour ago"

# Check application logs for execution context
tail -f /var/log/app/flamingock.log | grep "EXECUTION"
```

### CLI returns "connection error"
```bash
# Verify CLI configuration
flamingock config verify

# Check network connectivity to audit store
telnet audit-database-host 27017
```

### Resolution doesn't take effect
```bash
# Verify resolution was recorded
flamingock audit list -c change-id --format detailed

# Check for configuration issues
flamingock consistency-check
```


**Key Takeaway**: Issue resolution is not just error handling - it's a structured operational discipline that ensures your distributed systems evolve safely and your team can respond confidently to any failure scenario.