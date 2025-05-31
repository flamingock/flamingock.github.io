---
title: Testing with Spring Boot
sidebar_position: 4
---

## Introduction

When using Flamingock with Spring Boot, integration tests become straightforward thanks to auto-configuration and dependency injection. Flamingock integrates with Spring’s lifecycle and can be tested using standard Spring Boot test setups.

In this section, you’ll learn how to:

- Test that Flamingock executes change units correctly in a real Spring context
- Use a real audit backend (DynamoDB, MongoDB, etc.) via Testcontainers or local infrastructure
- Validate **external side effects** (e.g., resource creation, Kafka operations)
- Keep tests isolated and reproducible

:::info
This page assumes you're using `@EnableFlamingock` to configure Flamingock via Spring Boot’s auto-configuration.
:::

---

## Example: Creating a Kafka Topic

Suppose you have a change unit that ensures a Kafka topic exists for your application:

```java
@Change(id = "create-topic", order = "0001", author = "dev-team")
public class _0001_CreateKafkaTopicChange {

  @Execution
  public void execute(AdminClient adminClient) throws Exception {
    NewTopic topic = new NewTopic("flamingock-events", 3, (short) 1);
    adminClient.createTopics(Collections.singletonList(topic)).all().get();
  }

  @RollbackExecution
  public void rollback(AdminClient adminClient) throws Exception {
    adminClient.deleteTopics(Collections.singletonList("flamingock-events")).all().get();
  }
}
```

This change ensures the topic is in place for emitting application events. If execution fails, it cleans up by deleting the topic.

---

## Writing a Spring Boot integration test

We’ll now test this change unit end-to-end using:

- Spring Boot test context
- A real audit backend (e.g., DynamoDB via Testcontainers or Localstack)
- A **Kafka test broker** (embedded or containerized)
- The standard `FlamingockRunner` registered by `@EnableFlamingock`

```java
@SpringBootTest
@Testcontainers
class KafkaChangeSpringTest {

  static final GenericContainer<?> localstack = new GenericContainer<>("localstack/localstack:latest")
      .withExposedPorts(4566)
      .withEnv("SERVICES", "dynamodb")
      .withEnv("EDGE_PORT", "4566");

  static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

  @DynamicPropertySource
  static void configure(DynamicPropertyRegistry registry) {
    localstack.start();
    kafka.start();

    registry.add("flamingock.dynamodb.endpointOverride", () ->
        "http://" + localstack.getHost() + ":" + localstack.getMappedPort(4566));
    registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
  }

  @Autowired
  private AdminClient adminClient;

  @Test
  void shouldCreateKafkaTopicAndAuditToDynamo() throws Exception {
    DescribeTopicsResult result = adminClient.describeTopics(List.of("flamingock-events"));
    Map<String, TopicDescription> topics = result.all().get();

    assertTrue(topics.containsKey("flamingock-events"));
    assertEquals(3, topics.get("flamingock-events").partitions().size());
  }
}
```

---

## Best practices

- ✅ Use `@SpringBootTest` to load your actual app config and auto-wire the real Flamingock runner
- ✅ Run Flamingock on app startup (it will auto-execute via `ApplicationRunner`)
- ✅ Use containers like Localstack and Testcontainers to spin up realistic infrastructure (DynamoDB, Kafka)
- ✅ Validate real side effects — such as topic creation, file uploads, DB inserts, etc.
- ✅ Avoid mocking Flamingock internals — let it execute just like in production
- ✅ Clean up external state between tests or isolate them using dynamic names
