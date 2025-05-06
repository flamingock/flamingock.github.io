---
title: EnableFlamingock (automatic)
sidebar_position: 3
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# @EnableFlamingock (automatic)

Flamingock provides a convenient automatic integration with Spring Boot using the `@EnableFlamingock` annotation. This setup is ideal when you want Flamingock to automatically detect and wire required components without writing explicit builder logic.

---

## Import the springboot integration library

Add the appropriate Flamingock Spring Boot integration dependency, depending on your version:

<Tabs groupId="gradle_maven">
  <TabItem value="gradle" label="Gradle">
```kotlin
// For Spring Boot 2.x
implementation("io.flamingock:springboot-integration-v2:$flamingockVersion")

// For Spring Boot 3.x
implementation("io.flamingock:springboot-integration-v3:$flamingockVersion")
```
  </TabItem>
  <TabItem value="maven" label="Maven">
```xml
<!-- For springboot 2.x -->
<dependency>
    <groupId>io.flamingock</groupId>
    <artifactId>springboot-integration-v2</artifactId> <!-- or  springboot-integration-v3 For springboot 3.x-->
    <version>${flamingock.version}</version>
</dependency>
```
  </TabItem>
</Tabs>

---

## Annotate your main class

To activate the integration, add `@EnableFlamingock` to your Spring Boot application entry point:

```java
import io.flamingock.springboot.v2.EnableFlamingock;

@EnableFlamingock
@SpringBootApplication
public class MyApplication {
  public static void main(String[] args) {
    SpringApplication.run(MyApplication.class, args);
  }
}
```

This enables Flamingock to:

- Detect and use Spring’s `ApplicationContext` and `ApplicationEventPublisher`
- Load Flamingock configuration directly from your Spring Boot config file
- Automatically configure the runner (e.g., ApplicationRunner or InitializingBean)

---

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

---

## Next steps

- Want full control over the builder? See [Builder-based setup](builder-based-setup.md)
- Explore [Spring Boot profile support](profiles.md)
- Learn about [Flamingock lifecycle events](events.md)
