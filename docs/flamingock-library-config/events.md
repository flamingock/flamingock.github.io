---
sidebar_position: 90
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Events

This guide provides a comprehensive explanation of how Flamingock events function.

## Introduction

Flamingock utilizes events to notify the main application about the current state of the Flamingock process, as well as the eventual outcome of its execution.

The event-handling approach differs significantly depending on the type of runner being used:

- For Spring-based applications, Flamingock leverages the ```ApplicationEventPublisher```, which is provided during the build process.
- For standalone applications, Flamingock requires an explicit event handler to be defined at build time.

Flamingock offers event handling capabilities for both Pipelines and Stages.

## Type of events

Flamingock emits three types of events:

- **Start Event**: Emitted just before the execution of Changes begins, either at the Stage or Pipeline level, after successful validation of configuration and preconditions.
- **Success Event**: Emitted when the execution of all Changes in a Stage or Pipeline completes successfully, with no unhandled errors, indicating that all operations finished as expected.
- **Failure Event**: Emitted when an unhandled error occurs during the execution of a Change and the process cannot continue normally.

:::warning
The Success and Failure events are mutually exclusive, only one of them will be raised for a given execution.
:::

## Event Emission Order

Events are emitted in a specific order during the Flamingock execution process:

1. **PipelineStartedEvent**: Emitted at the beginning of the pipeline execution, after validation and lock acquisition.
2. **StageStartedEvent**: Emitted for each stage before its execution begins.
3. **StageCompletedEvent** or **StageFailedEvent**: Emitted when a stage finishes successfully or fails. Only one of these will be emitted per stage.
4. **PipelineCompletedEvent** or **PipelineFailedEvent**: Emitted at the end of the pipeline execution. Only one of these will be emitted, indicating overall success or failure.

If a stage fails, both StageFailedEvent and PipelineFailedEvent will be emitted. If the pipeline completes successfully, PipelineCompletedEvent is emitted after all stages have completed.

## Event Scope

Flamingock supports events at two levels:

- **Pipeline Events**: Provide information about the entire execution.
- **Stage Events**: Provide granular information about individual stage executions.

This allows you to monitor both high-level progress and detailed stage-by-stage execution status.

## Event data

Events provide access to relevant information about the execution state:

- **Started events** (`PipelineStartedEvent`, `StageStartedEvent`): simple marker events with no additional data.
- **Completed events**:
  - `PipelineCompletedEvent`: `getResult()` returns an `ExecuteResponseData` with the overall status, durations, per-stage breakdown, and aggregate change counters.
  - `StageCompletedEvent`: `getResult()` returns a `StageResult` with the stage state, duration, and per-change details.
- **Failed events**:
  - `PipelineFailedEvent`: `getResult()` returns the `ExecuteResponseData` accumulated up to the failure; `getException()` returns the underlying `Exception`.
  - `StageFailedEvent`: `getResult()` returns the `StageResult` for the failed stage; `getException()` returns the underlying `Exception`.

See [Event payload reference](#event-payload-reference) below for the fields you can read from `ExecuteResponseData` and `StageResult`. For the structured execution report that Flamingock writes by default after every run, see [Execution report logging](./execution-report.md).

## Standalone basic example

In the Flamingock builder, you must configure the events you intend to use and implement the corresponding listeners.

### Builder

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
  ```java
      Flamingock.builder()
          .setPipelineStartedListener(new PipelineStartedListener())
          .setPipelineCompletedListener(new PipelineCompletedListener())
          .setPipelineFailedListener(new PipelineFailedListener())
          .setStageStartedListener(new StageStartedListener())
          .setStageCompletedListener(new StageCompletedListener())
          .setStageFailedListener(new StageFailedListener())
          .build()
          .run();
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
      Flamingock.builder()
          .setPipelineStartedListener(PipelineStartedListener())
          .setPipelineCompletedListener(PipelineCompletedListener())
          .setPipelineFailedListener(PipelineFailedListener())
          .setStageStartedListener(StageStartedListener())
          .setStageCompletedListener(StageCompletedListener())
          .setStageFailedListener(StageFailedListener())
          .build()
          .run()
  ```
  </TabItem>
</Tabs>

### Listener

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
  ```java
  public class StageCompletedListener implements Consumer<IStageCompletedEvent> {
      @Override
      public void accept(IStageCompletedEvent event) {
          StageResult result = event.getResult();
          System.out.println("Stage '" + result.getStageName() + "' completed with "
                  + result.getAppliedCount() + " change(s) applied");
      }
  }
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
   class StageCompletedListener : (IStageCompletedEvent) -> Unit {
       override fun invoke(event: IStageCompletedEvent) {
           val result = event.result
           println("Stage '${result.stageName}' completed with ${result.appliedCount} change(s) applied")
       }
   }
  ```
  </TabItem>
</Tabs>

## Spring-based basic example

:::note
Earlier releases shipped the `SpringStage*Event` classes implementing the wrong interfaces (`IPipeline*Event` instead of `IStage*Event`). They are now correctly typed against `IStage*Event`. Any Spring listener that was previously typed against the wrong interface will need to be re-typed when upgrading.
:::

### Beans

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
    ```java
      @Bean
          public PipelineStartedListener pipelineStartedListener() {
          return new PipelineStartedListener();
      }

      @Bean
      public PipelineCompletedListener pipelineCompletedListener() {
          return new PipelineCompletedListener();
      }

      @Bean
      public PipelineFailedListener pipelineFailedListener() {
          return new PipelineFailedListener();
      }

      @Bean
      public StageStartedListener stageStartedListener() {
          return new StageStartedListener();
      }

      @Bean
      public StageCompletedListener stageCompletedListener() {
          return new StageCompletedListener();
      }

      @Bean
      public StageFailedListener stageFailedListener() {
          return new StageFailedListener();
      }
    ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin" default>
    ```kotlin
        @Bean
        fun pipelineStartedListener(): PipelineStartedListener {
            return PipelineStartedListener()
        }

        @Bean
        fun pipelineCompletedListener(): PipelineCompletedListener {
            return PipelineCompletedListener()
        }

        @Bean
        fun pipelineFailedListener(): PipelineFailedListener {
            return PipelineFailedListener()
        }

        @Bean
        fun stageStartedListener(): StageStartedListener {
            return StageStartedListener()
        }

        @Bean
        fun stageCompletedListener(): StageCompletedListener {
            return StageCompletedListener()
        }

        @Bean
        fun stageFailedListener(): StageFailedListener {
            return StageFailedListener()
        }
    ```
  </TabItem>
</Tabs>

### Listener

<Tabs groupId="languages">
  <TabItem value="java" label="Java" default>
  ```java
public class StageCompletedListener implements ApplicationListener<SpringStageCompletedEvent> {

    public static int executed = 0;
    @Override
    public void onApplicationEvent(SpringStageCompletedEvent springStageCompletedEvent) {
        executed++;
    }
}
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
class StageCompletedListener : ApplicationListener<SpringStageCompletedEvent> {

    companion object {
        var executed = 0
    }

    override fun onApplicationEvent(event: SpringStageCompletedEvent) {
        executed++
    }
}
  ```
  </TabItem>
</Tabs>

## Event payload reference

The pipeline-level events carry `ExecuteResponseData`; the stage-level events carry `StageResult`. The fields a typical listener reads are:

### `ExecuteResponseData`

| Method                                                       | Description                                                                                                                          |
|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `getStatus()`                                                | Overall outcome: `SUCCESS`, `FAILED`, `PARTIAL`, or `NO_CHANGES` (`ExecutionStatus`).                                                |
| `getStartTime()` / `getEndTime()`                            | Run window as `Instant`s.                                                                                                            |
| `getTotalDurationMs()`                                       | Total run duration in milliseconds.                                                                                                  |
| `getTotalStages()` / `getCompletedStages()` / `getFailedStages()` / `getUpToDateStages()` / `getNotReachedStages()` | Stage counters. `upToDate` = confirmed already applied without running; `notReached` = never reached this run. |
| `getTotalChanges()` / `getAppliedChanges()` / `getAlreadyAppliedChanges()` / `getFailedChanges()` / `getNotReachedChanges()` | Aggregate change counters across the whole run. `applied` = newly applied this run; `alreadyApplied` = found already applied. |
| `getStages()`                                                | `List<StageResult>` — one entry per stage, in declaration order.                                                                     |

The counters always reconcile against the totals: `completed + failed + upToDate + notReached == totalStages`, and `applied + alreadyApplied + failed + notReached == totalChanges`.

### `StageResult`

| Method                                                       | Description                                                                                                                          |
|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `getStageId()` / `getStageName()`                            | Stage identifiers.                                                                                                                   |
| `getState()`                                                 | `StageState` — what the executor did this run. Sealed abstract type with five variants (`NotStarted`, `Started`, `Completed`, `Failed`, `BlockedForMI`), not a plain enum. Query the variant via `isNotStarted()` / `isStarted()` / `isCompleted()` / `isFailed()` / `isBlockedForManualIntervention()`. |
| `getPlannerVerdict()`                                        | `PlannerVerdict` — what the audit log says about the stage, independent of execution: `NOT_EVALUATED`, `NEEDS_WORK`, or `UP_TO_DATE`. Drives the `[UP TO DATE]` / `[NOT REACHED]` labels in the report when the stage was not executed. |
| `getDurationMs()`                                            | Stage duration in milliseconds.                                                                                                      |
| `getTotalChanges()`                                          | Number of changes declared on the stage in the loaded pipeline (structural count, independent of how many ran).                      |
| `getAppliedCount()` / `getAlreadyAppliedCount()` / `getFailedCount()` | Per-stage change counters.                                                                                                  |
| `getChanges()`                                               | `List<ChangeResult>` — one entry per change in the stage.                                                                            |

`getErrorInfo()` and `getRecoveryIssues()` are declared on the base `StageState` type so you can call them on any instance without down-casting; what they return depends on the variant. `getErrorInfo()` returns an `Optional<ErrorInfo>` — populated on `Failed` and `BlockedForMI`, empty otherwise. `getRecoveryIssues()` returns a `List<RecoveryIssue>` — empty unless the variant is `BlockedForMI`, in which case each `RecoveryIssue.getChangeId()` identifies a change you need to resolve.

See also: [Execution report logging](./execution-report.md) for the default SLF4J report Flamingock writes from these payloads after every run.

