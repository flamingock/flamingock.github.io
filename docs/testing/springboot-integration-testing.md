---
title: Spring Boot  Testing
sidebar_position: 4
---

## Introduction

This guide explains how to write integration tests for Flamingock when using **Spring Boot** with the `@EnableFlamingock` annotation.

With this setup:

- Flamingock is auto-configured using Spring Boot properties
- Dependencies like `Kafka AdminClient` or `DynamoDbClient`  must be declared as Spring beans
- The change units are executed end-to-end using real systems (e.g., DynamoDB Local, Kafka, S3)

> This test style is ideal for verifying that Flamingock interacts correctly with both its audit backend and any external systems.


## Example: Modifying a Kafka topic and auditing to DynamoDB

Suppose you have a change unit that modifies a Kafka topic configuration:

```java
@Change(id = "modify-topic-config", author = "dev-team")  // order extracted from filename
public class _20250923_02_ModifyKafkaTopicConfig {

  @Apply
  public void apply(AdminClient adminClient) {
    Map<ConfigResource, Config> configs = Map.of(
      new ConfigResource(ConfigResource.Type.TOPIC, "orders"),
      new Config(List.of(new ConfigEntry("retention.ms", "86400000")))
    );

    adminClient.alterConfigs(configs).all().join();
  }

  @Rollback
  public void rollback(AdminClient adminClient) {
    Map<ConfigResource, Config> configs = Map.of(
      new ConfigResource(ConfigResource.Type.TOPIC, "orders"),
      new Config(List.of(new ConfigEntry("retention.ms", "604800000")))
    );

    adminClient.alterConfigs(configs).all().join();
  }
}
```


## Writing the test

In this test, we’ll:

- Spin up **Kafka** and **DynamoDB Local** using Testcontainers
- Provide the required beans (`AdminClient`, `DynamoDbClient`) to Spring Boot
- Assert that the Flamingock change unit executed and was **audited to DynamoDB**

:::info 
Flamingock requires `DynamoDbClient` and other injected services (like `AdminClient`) to be present in the Spring ApplicationContext. Spring Boot will auto-detect them if they are declared as `@Bean`s.
:::
```java
@SpringBootTest
@Testcontainers
@EnableFlamingock(
    stages = {
        @Stage(location = "com.yourapp.changes")
    }
)
public class FlamingockSpringbootTest {

  static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.2.1"));
  
  static final GenericContainer<?> dynamoDb = new GenericContainer<>("amazon/dynamodb-local")
      .withExposedPorts(8000);

  @BeforeAll
  static void startContainers() {
    kafka.start();
    dynamoDb.start();
  }

  @AfterAll
  static void stopContainers() {
    kafka.stop();
    dynamoDb.stop();
  }

  @Bean
  public DynamoDbClient dynamoDbClient() {
    return DynamoDbClient.builder()
        .region(Region.US_EAST_1)
        .endpointOverride(URI.create("http://" + dynamoDb.getHost() + ":" + dynamoDb.getFirstMappedPort()))
        .build();
  }

  @Bean
  public AdminClient kafkaAdminClient() {
    var config = new Properties();
    config.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
    return AdminClient.create(config);
  }

  @Test
  void shouldExecuteChangeAndWriteAuditToDynamoDB() {
    DynamoDbClient client = dynamoDbClient();
    ScanResponse scan = client.scan(ScanRequest.builder()
        .tableName("flamingockAuditLogs")
        .build());

    boolean changeExecuted = scan.items().stream()
        .anyMatch(item -> "modify-topic-config".equals(item.get("changeId").s())
                       && "EXECUTED".equals(item.get("state").s()));

    assertTrue(changeExecuted, "Audit log entry for executed change not found in DynamoDB");
  }
}
```


## Advanced configuration

Flamingock can be configured using Spring Boot properties, either in your `application.yaml` or dynamically via `@DynamicPropertySource`.

This is especially useful for setting values like:

```java
@DynamicPropertySource
static void overrideProperties(DynamicPropertyRegistry registry) {
  String endpoint = "http://" + dynamoDb.getHost() + ":" + dynamoDb.getFirstMappedPort();
  registry.add("flamingock.dynamodb.readCapacityUnits", () -> 5L);
  registry.add("flamingock.dynamodb.writeCapacityUnits", () -> 5L);
  registry.add("flamingock.dynamodb.autoCreate", () -> true);
  registry.add("flamingock.dynamodb.auditRepositoryName", () -> "flamingockAuditLogs");
  registry.add("flamingock.dynamodb.lockRepositoryName", () -> "flamingockLock");
}
```

These properties allow Flamingock to connect to the appropriate DynamoDB instance and create its internal metadata tables automatically.


## Best practices

- Declare all required dependencies (like `DynamoDbClient`, `AdminClient`, etc.) as Spring beans
- Use `@DynamicPropertySource` to inject dynamic config for local/test environments
- Validate both the **external effect** (Kafka, S3, etc.) and the **audit record** in the backend
- Use `Testcontainers` for isolation and reproducibility across environments
- Keep tests focused: use Spring Boot only when testing real integration scenarios (not just logic)
