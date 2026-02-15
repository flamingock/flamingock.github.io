---
title: Introduction
sidebar_position: 1
---

# Safety and Recovery

While Flamingock executions typically complete successfully, the framework provides configurable recovery mechanisms to handle exceptional circumstances with complete control and visibility.

## Safety-first philosophy

In the rare cases where Flamingock cannot guarantee a safe outcome, it stops execution and requires explicit resolution rather than risking data corruption or system inconsistency. This approach ensures you always know the exact state of your systems.

## Recovery strategies

Flamingock provides two recovery strategies to handle execution failures:

### Manual intervention (default)
- **When it activates**: Any failure where the outcome is uncertain
- **What happens**: Execution stops and requires human review before continuing
- **Use case**: When safety is prioritized over automation

### Always retry
- **When it activates**: Any failure, automatically retrying on next execution
- **What happens**: Continues attempting the change until successful
- **Use case**: When changes are idempotent and safe to retry

## How it works

1. **Change execution** - Flamingock attempts to execute a Change
2. **Failure detection** - If execution fails, the recovery strategy determines next steps
3. **Strategy application** - Either automatic retry or manual intervention workflow
4. **Issue resolution** - For manual intervention, use CLI tools to investigate and resolve

## In this section

- **[Recovery strategies](recovery-strategies.md)** - Technical details and configuration
- **[Issue resolution](issue-resolution.md)** - Operational workflows for handling issues