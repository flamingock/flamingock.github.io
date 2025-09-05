---
title: Flamingock CLI
sidebar_position: 999
---

# Flamingock CLI
*Enterprise-grade operational control for distributed system evolution*

Flamingock's Command-Line Interface (CLI) provides complete operational control over your system changes, enabling maintenance, troubleshooting, and governance tasks outside your application's normal startup cycle.

---

## Enterprise Operational Capabilities

### **Issue Resolution & Recovery**
The CLI is central to Flamingock's recovery strategy workflow, providing enterprise-grade operational excellence:

- **Issue Detection**: Identify failed or incomplete changes across your distributed systems
- **Guided Resolution**: Get specific guidance for resolving each type of failure
- **Audit Management**: Mark changes as resolved after manual verification or correction
- **Compliance Workflow**: Maintain complete audit trails during issue resolution

### **Operational Control**
- **Change Execution**: Run changes on-demand without full application startup
- **Dry-Run Analysis**: Preview pending changes and their execution order
- **Rollback Operations**: Safely revert changes using compensation logic
- **Lock Management**: Clear stale distributed locks from interrupted processes

### **Enterprise Integration**
- **CI/CD Pipeline Integration**: Embed Flamingock operations in deployment workflows
- **Automation Scripts**: Script common operational tasks and maintenance procedures
- **Compliance Reporting**: Generate audit reports and change history analysis

---

## Core CLI Operations

### **Issue Resolution Workflow**
The primary CLI workflow for operational excellence:

```bash
# 1. Discover issues requiring attention
flamingock issue list

# 2. Get the next issue to resolve (automatic prioritization)
flamingock issue get

# 3. Get specific issue with detailed guidance
flamingock issue get -c change-id --guidance

# 4. Resolve the issue after manual verification/correction
flamingock audit fix -c change-id --resolution APPLIED
flamingock audit fix -c change-id --resolution ROLLED_BACK
```

### **Change Execution & Management**
- **Execute Changes**: Run pending changes on-demand
- **Dry-Run Analysis**: Preview execution order and dependencies without applying changes
- **Rollback Operations**: Safely revert changes using `@RollbackExecution` methods
- **Audit Inspection**: Query execution history with filtering by author, date, status

### **Operational Maintenance** 
- **Lock Management**: View and clear distributed locks from interrupted processes
- **Consistency Checks**: Validate change definitions against audit log entries
- **Integrity Verification**: Ensure audit store consistency and detect anomalies

### **Enterprise Reporting**
- **Audit Trails**: Generate compliance reports and change history analysis
- **Issue Analytics**: Track resolution patterns and operational metrics
- **Change Impact**: Analyze cross-system dependencies and execution patterns

---

## Operational Workflows

### **Issue Resolution Workflow**
The most common CLI usage pattern for enterprise operations:

```bash
# Daily operational workflow
flamingock issue list
# Output: Shows all unresolved issues across your distributed systems

flamingock issue get  
# Output: Returns next priority issue with detailed context and guidance

# After manual investigation and correction:
flamingock audit fix -c user-data-update-v2 --resolution APPLIED
# Output: ✅ Issue resolved - change marked as successfully applied

# Alternative resolution:
flamingock audit fix -c problematic-change --resolution ROLLED_BACK
# Output: ✅ Issue resolved - change marked as rolled back
```

### **Change Management Operations**
```bash
# Execute pending changes on-demand
flamingock run --app-jar /path/to/app.jar --config application.yaml

# Preview what would execute (dry-run)
flamingock dry-run --config application.yaml --profile production

# Execute specific change by ID
flamingock run -c user-schema-update --app-jar /path/to/app.jar

# Rollback/undo specific change
flamingock undo -c user-schema-update --app-jar /path/to/app.jar
```

### **Audit and Compliance Operations**
```bash
# List all executed changes with filtering
flamingock audit list --author platform-team --from 2024-01-01

# Generate compliance report
flamingock audit report --format csv --output /reports/compliance-2024.csv

# Verify audit store integrity
flamingock audit verify --config application.yaml
```

### **Maintenance Operations**
```bash
# Clear stale distributed locks
flamingock lock clear --config application.yaml

# Check consistency between code and audit store
flamingock consistency-check --app-jar /path/to/app.jar --config application.yaml
```

---

## Enterprise Integration Patterns

### **CI/CD Pipeline Integration**
```yaml
# Example: Jenkins/GitHub Actions integration
deploy:
  steps:
    - name: Execute Flamingock Changes
      run: |
        flamingock run --app-jar dist/app.jar --config prod.yaml
        
    - name: Verify No Issues
      run: |
        flamingock issue list --fail-if-any
```

### **Operational Runbooks**
```bash
# Daily operations checklist
#!/bin/bash
echo "Checking for Flamingock issues..."
flamingock issue list

if [ $? -ne 0 ]; then
  echo "Issues detected - resolving..."
  while flamingock issue get > /dev/null; do
    echo "Resolve the displayed issue manually, then press Enter"
    read
    flamingock issue get -c $(flamingock issue get --format id) --resolution APPLIED
  done
fi
```

### **Emergency Response**
```bash
# Emergency rollback procedure
flamingock undo -c problematic-change --app-jar emergency-build.jar
flamingock audit fix -c problematic-change --resolution ROLLED_BACK
```

---

## Installation & Setup

### **Download CLI**
```bash
# Linux/macOS
curl -L https://releases.flamingock.io/cli/latest/flamingock-cli-linux -o flamingock
chmod +x flamingock

# Windows
# Download from: https://releases.flamingock.io/cli/latest/flamingock-cli-windows.exe
```

### **Configuration**
The CLI uses your existing Flamingock configuration files:
- `application.yaml` / `application.properties`
- `flamingock.yaml` / `flamingock.properties`

### **JAR Requirements**
Supply `--app-jar` only for commands that execute change logic:
- **Required**: `run`, `undo`, `rollback` commands
- **Not required**: `issue`, `audit`, `lock` commands

---

## Enterprise Support

The Flamingock CLI is production-ready and provides enterprise-grade operational capabilities for managing distributed system evolution at scale.

**Need help?** Contact support@flamingock.io for enterprise support and training.
