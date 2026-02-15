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

- **Pipeline Events**: Provide information about the entire migration process.
- **Stage Events**: Provide granular information about individual stage executions.

This allows you to monitor both high-level progress and detailed stage-by-stage execution status.

## Event Data

Events provide access to relevant information about the execution state:

- **Started Events** (`PipelineStartedEvent`, `StageStartedEvent`): These events are simple markers with no additional data.
- **Completed Events**:
  - `StageCompletedEvent`: Provides access to the execution result via `getResult()`, which returns a `StageExecutor.Output` object containing the stage summary with details like the number of applied changes.
  - `PipelineCompletedEvent`: A simple marker event with no additional data.
- **Failed Events** (`StageFailedEvent`, `PipelineFailedEvent`): Provide access to the exception that caused the failure via `getException()`, allowing you to inspect the error details.

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
          System.out.println("Stage execution completed with " + event.getResult().getSummary().getAppliedChangesCount() + " changes applied");
      }
  }
}
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
   class StageCompletedListener : (IStageCompletedEvent) -> Unit {
       override fun invoke(event: IStageCompletedEvent) {
           println("Stage execution completed with ${event.result.summary.appliedChangesCount} changes applied")
       }
   }
  ```
  </TabItem>
</Tabs>

## Spring-based basic example

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

