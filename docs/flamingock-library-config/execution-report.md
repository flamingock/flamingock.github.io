---
sidebar_position: 95
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Execution report logging

After every run, Flamingock emits a structured execution report through SLF4J under the logger name `FK-Report` — at `INFO` on success and `ERROR` on failure. The report shows the overall status, duration, per-stage breakdown, and — when something went wrong — the failing change IDs and error details.

This is enabled by default. **If you're happy seeing the report in your logs, you don't need to configure anything.**

Related: [Events](./events.md).

## What the report looks like

On a successful run:

```
========================================================================
 Flamingock execution report — SUCCESS
========================================================================
 Started:   2026-05-15T08:00:00Z
 Finished:  2026-05-15T08:00:00.180Z
 Duration:  180 ms

 Stages:    2 total — 2 completed, 0 failed, 0 up to date, 0 not reached
 Changes:   3 total — 3 newly applied, 0 already applied, 0 failed, 0 not reached

 Per-stage breakdown:

   [COMPLETED] user-database-stage (75 ms)
               changes: 2 newly applied, 0 already applied, 0 failed, 0 not reached

   [COMPLETED] kafka-topics-stage (105 ms)
               changes: 1 newly applied, 0 already applied, 0 failed, 0 not reached

========================================================================
```

On a failed run:

```
========================================================================
 Flamingock execution report — FAILED
========================================================================
 Started:   2026-05-15T08:00:00Z
 Finished:  2026-05-15T08:00:00.312Z
 Duration:  312 ms

 Stages:    2 total — 1 completed, 1 failed, 0 up to date, 0 not reached
 Changes:   3 total — 2 newly applied, 0 already applied, 1 failed, 0 not reached

 Per-stage breakdown:

   [COMPLETED] user-database-stage (75 ms)
               changes: 2 newly applied, 0 already applied, 0 failed, 0 not reached

   [FAILED]    kafka-topics-stage (237 ms)
               changes: 0 newly applied, 0 already applied, 1 failed, 0 not reached
               error:   TopicCreationFailed
                        Broker rejected creation: replication factor 3 > available brokers 1
               failed change(s): create-orders-topic

========================================================================
```

## Reading the counters

Each run reports two count lines, and both always add up to the total:

- **Stages:** `completed + failed + up to date + not reached = total`.
- **Changes:** `newly applied + already applied + failed + not reached = total`.

What each bucket means:

- **newly applied** — change executed and applied during this run.
- **already applied** — change was found already applied (confirmed against the audit log), so nothing ran for it.
- **failed** — change failed this run. A transactional change that failed and was automatically rolled back is also counted here.
- **not reached** — change was never processed this run (for example, it sits after a failed change in the same stage, or in a stage the run never got to).

## Other run shapes

Beyond the success and failure examples above, the report adapts to what actually happened:

- **`NO CHANGES`** — the headline reads `Flamingock execution report — NO CHANGES` when nothing needed applying (every change is already applied, or there was nothing to do). This is the common steady-state report you'll see on most application restarts after the first.
- **`[UP TO DATE]` stages** — a stage Flamingock confirmed was already applied without running anything appears with the `[UP TO DATE]` label and no duration, e.g. `[UP TO DATE] user-database-stage  (3 changes already applied)`.
- **`[NOT REACHED]` stages** — when a run stops early (for example after a failure), the stages it never got to are summarised in a separate `Not reached (N):` section that lists each stage name with its change count.
- **`[BLOCKED — manual intervention required]` stages** — a stage that needs manual intervention shows this distinct label, followed by a `change(s) requiring intervention:` line listing the change IDs to resolve.

:::note
If your code catches the exception raised when stages fail, its `getMessage()` returns a single-line summary of the same data — failed stage names plus the change counters and duration, for example:

```
Flamingock execution failed: 1 of 2 stage(s) failed [kafka-topics-stage]; changes newly_applied=2, already_applied=0, failed=1, not_reached=0; duration=312ms
```

When a stage is blocked for manual intervention, the line ends with `; manual intervention required for change(s): <ids>`. The multi-line report above is emitted by the SLF4J listener, never by the exception itself, so log aggregators don't see duplicated dumps on `printStackTrace`.
:::

## Silencing the report via SLF4J (recommended for production)

Set the `FK-Report` logger level to `OFF`. No code change, no rebuild — purely a logging-configuration change.

<Tabs groupId="logging">
  <TabItem value="logback" label="Logback" default>
```xml
<configuration>
  <logger name="FK-Report" level="OFF"/>
</configuration>
```
  </TabItem>
  <TabItem value="log4j2" label="Log4j2">
```xml
<Configuration>
  <Loggers>
    <Logger name="FK-Report" level="OFF" additivity="false"/>
  </Loggers>
</Configuration>
```
  </TabItem>
</Tabs>

Use `WARN` (any level between `INFO` and ERROR)" instead of `OFF` to keep failure reports while suppressing successful runs — the failure listener logs at `ERROR`, the success listener at `INFO`.
 
## Disabling the report via the builder flag

Set the flag to `false` on the runner builder. Default is `true`.

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
```java
Flamingock.builder()
    .setEnableDefaultExecutionReport(false)
    .build()
    .run();
```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
```kotlin
Flamingock.builder()
    .setEnableDefaultExecutionReport(false)
    .build()
    .run()
```
  </TabItem>
</Tabs>

This is the right choice when you want no default report at all — for instance, when you're registering your own listener and want only that to fire.

## Bring your own listener

Register your own listener with the existing builder setters (`setPipelineCompletedListener`, `setPipelineFailedListener`, etc.). See [Events](./events.md) for the full listener-registration surface and the payload reference.

When both the default and a custom listener are registered, **both fire** (additive). To have only your listener fire, set `setEnableDefaultExecutionReport(false)` as shown above.

A minimal failure listener that reads the typed result and logs the IDs of any change blocked for manual intervention:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
```java
public class PipelineFailedListener implements Consumer<IPipelineFailedEvent> {

    private static final Logger logger = LoggerFactory.getLogger(PipelineFailedListener.class);

    @Override
    public void accept(IPipelineFailedEvent event) {
        ExecuteResponseData result = event.getResult();
        logger.error("Flamingock failed: {} failed stage(s), {} failed change(s), {} ms",
                result.getFailedStages(),
                result.getFailedChanges(),
                result.getTotalDurationMs());

        result.getStages().stream()
                .filter(stage -> stage.getState().isBlockedForManualIntervention())
                .flatMap(stage -> stage.getState().getRecoveryIssues().stream())
                .map(RecoveryIssue::getChangeId)
                .forEach(id -> logger.error("Manual intervention required for change: {}", id));
    }
}
```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
```kotlin
class PipelineFailedListener : (IPipelineFailedEvent) -> Unit {

    private val logger = LoggerFactory.getLogger(PipelineFailedListener::class.java)

    override fun invoke(event: IPipelineFailedEvent) {
        val result = event.result
        logger.error("Flamingock failed: {} failed stage(s), {} failed change(s), {} ms",
            result.failedStages, result.failedChanges, result.totalDurationMs)

        result.stages
            .filter { it.state.isBlockedForManualIntervention }
            .flatMap { it.state.recoveryIssues }
            .map { it.changeId }
            .forEach { logger.error("Manual intervention required for change: {}", it) }
    }
}
```
  </TabItem>
</Tabs>

### Reusing the canonical report formatter

If you want to emit the same multi-line block that the default listener writes — but to a different logger, sink, or external system (Slack, metrics, JSON) — call `ExecutionReportFormatter.report(...)`:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
```java
String report = ExecutionReportFormatter.report(event.getResult());
mySink.publish(report);
```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
```kotlin
val report = ExecutionReportFormatter.report(event.result)
mySink.publish(report)
```
  </TabItem>
</Tabs>

The same class also exposes `summary(...)`, which produces the one-line variant.

## Spring Boot

The default `FK-Report` listener is wired by the core builder and fires the same way in Spring Boot — silence it via the SLF4J configuration above or the builder flag.

Spring listeners receive the same typed payload through Flamingock's Spring `ApplicationEvent` wrappers. A minimal `@EventListener` handler for failures:

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
```java
@Configuration
public class FlamingockListeners {

    private static final Logger logger = LoggerFactory.getLogger(FlamingockListeners.class);

    @EventListener
    public void onFlamingockFailure(SpringPipelineFailedEvent event) {
        ExecuteResponseData result = event.getResult();
        logger.error("Flamingock failed: {} failed stage(s) in {} ms",
                result.getFailedStages(), result.getTotalDurationMs());
    }
}
```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
```kotlin
@Configuration
class FlamingockListeners {

    private val logger = LoggerFactory.getLogger(FlamingockListeners::class.java)

    @EventListener
    fun onFlamingockFailure(event: SpringPipelineFailedEvent) {
        val result = event.result
        logger.error("Flamingock failed: {} failed stage(s) in {} ms",
            result.failedStages, result.totalDurationMs)
    }
}
```
  </TabItem>
</Tabs>
