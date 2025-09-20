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

- **Start Event**: Triggered just before the migration process begins, following successful validation.
- **Success Event**: Emitted upon successful completion of the migration. This indicates that no unhandled exceptions occurred, or that any errors were either properly handled or associated changeLogs were marked with 'Fail' as false.
- **Failure Event**: Emitted when a change log fails and the failure is not handled, as described above.

:::warning
The Success and Failure events are mutually exclusive, only one of them will be raised for a given migration execution.
:::

## Getting started with events

Each runner's documentation page provides the necessary information for using events in accordance with that runner's specific implementation.

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

    public static int executed = 0;
    @Override
    public void accept(IStageCompletedEvent iStageCompletedEvent) {
        executed++;
    }
    }
  ```
  </TabItem>
  <TabItem value="kotlin" label="Kotlin">
  ```kotlin
class StageCompletedListener : (IStageCompletedEvent) -> Unit {

    companion object {
        var executed = 0
    }

    override fun invoke(iStageCompletedEvent: IStageCompletedEvent) {
        executed++
    }
}
  ```
  </TabItem>
</Tabs>

## Spring-based basic example

### Listeners

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
      public PipelineFailedListener sailedFlamingockListener() {
          return new PipelineFailedListener();
      }

      @Bean
      public StageStartedListener stageStartedListener() {return new StageStartedListener();}

      @Bean
      public StageCompletedListener stageCompletedListener() {return new StageCompletedListener();}

      @Bean
      public StageFailedListener stageFailedListener() {return new StageFailedListener();}
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

