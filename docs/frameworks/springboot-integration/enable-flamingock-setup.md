---
title: Automatic Setup
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Automatic Setup

Flamingock provides a convenient automatic integration with Spring Boot using the `@Flamingock` annotation. This setup is ideal when you want Flamingock to automatically detect and wire required components without writing explicit builder logic.


## Import the springboot integration library

Add the Flamingock Spring Boot integration dependency:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
implementation("io.flamingock:flamingock-springboot-integration:$flamingockVersion")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>flamingock-springboot-integration</artifactId>
    <version>${flamingock.version}</version>
</dependency>
```
  </TabItem>
</Tabs>

### Version Compatibility

The `flamingock-springboot-integration` artifact is compatible with both Spring Boot 2.x and 3.x. See [Version Compatibility](introduction.md#version-compatibility) for details.

## Configure setup and activate integration

To activate the integration, add `@EnableFlamingock` to any class in your application (commonly on your main class or a configuration class):

```java
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourapp.changes")
    }
)
@SpringBootApplication
public class MyApplication {
  public static void main(String[] args) {
    SpringApplication.run(MyApplication.class, args);
  }
}
```

The `@EnableFlamingock` annotation enables automatic Spring Boot integration, which:

- Detect and use Spring’s `ApplicationContext` and `ApplicationEventPublisher`
- Loads Flamingock configuration directly from your Spring Boot config file
- Automatically configures the runner (e.g., ApplicationRunner or InitializingBean)
- Processes the setup configuration from the annotation


## Bean registration requirements

With automatic setup, Flamingock needs access to your target systems and (for Community Edition) audit stores. Since these aren't configured directly via the builder, they must be registered as Spring beans:

Example target system bean registration:
```java
@Bean
public DefaultTargetSystem redisTargetSystem() {
    return new DefaultTargetSystem("redis-cache");
}
```

Flamingock will automatically detect and use these beans during execution.

## Providing configuration

Runtime configuration is defined using standard Spring Boot configuration files. Use the `flamingock` section for all core and edition-specific options.

```yaml
flamingock:
  lockAcquiredForMillis: 1200
  runnerType: InitializingBean
  # other configuration...
```

:::info
If the `runnerType` property is not provided, Flamingock defaults to using `ApplicationRunner`.
:::


## Next steps

- Want full control over the builder? See [Builder-based setup](builder-based-setup.md)
- Explore [Spring Boot profile support](profiles.md)
- Learn about [Flamingock lifecycle events](../../flamingock-library-config/events.md)
