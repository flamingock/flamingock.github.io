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
public class StageCompletedListener implements ApplicationListener<StageCompletedEvent> {

    public static int executed = 0;
    @Override
    public void accept(StageCompletedEvent stageCompletedEvent) {
        executed++;
    }
}
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
class StageCompletedListener : (StageCompletedEvent) -> Unit {

    companion object {
        var executed = 0
    }

    override fun invoke(stageCompletedEvent: StageCompletedEvent) {
        executed++
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
      public PipelineStartedListener startFlamingockListener() {
          return new PipelineStartedListener();
      }

      @Bean
      public PipelineCompletedListener successFlamingockListener() {
          return new PipelineCompletedListener();
      }

      @Bean
      public PipelineFailedListener failedFlamingockListener() {
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
        fun startFlamingockListener(): PipelineStartedListener {
            return PipelineStartedListener()
        }

        @Bean
        fun successFlamingockListener(): PipelineCompletedListener {
            return PipelineCompletedListener()
        }

        @Bean
        fun sailedFlamingockListener(): PipelineFailedListener {
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
    public void accept(SpringStageCompletedEvent springStageCompletedEvent) {
        executed++;
    }
}
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
class StageCompletedListener : (SpringStageCompletedEvent) -> Unit {

    companion object {
        var executed = 0
    }

    override fun invoke(springStageCompletedEvent: SpringStageCompletedEvent) {
        executed++
    }
}
  ```
  </TabItem>
</Tabs>

