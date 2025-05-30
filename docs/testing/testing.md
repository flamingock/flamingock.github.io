---
sidebar_position: 8
---

# Testing

## Introduction

This sections focuses on examining the various levels of testing, including unit and integration tests, that can be applied to a Flamingock use environment, as well as the tools provided by Flamingock to facilitate this process.

For illustrative examples, please refer to [our example repository](https://github.com/mongock/flamingock-examples), where tests are implemented.

## Unit testing

Unit tests serve as a foundational step in ensuring the correctness of ChangeUnits. This mechanism enables the validation of ChangeUnits in isolation, covering both the `Execution` and `RollbackExecution` methods of a ChangeUnit.

Although Flamingock does not provide specific tools for unit testing, guidance on how to implement it is available [in our example project](#TODO_add_example_url).

A typical unit test for a ChangeUnit is structured as follows:

```java //TODO: Review example
class ClientInitializerChangeUnitTest {

    @Test
    @SuppressWarnings("unchecked")
    void execution() {
        ClientRepository repository = mock(ClientRepository.class);
        new ClientInitializerChangeUnit().execution(repository);

        ArgumentCaptor<List<Client>> itemsCaptor = ArgumentCaptor.forClass(List.class);
        verify(repository, new Times(1)).saveAll(itemsCaptor.capture());
        assertEquals(10, itemsCaptor.getValue().size());
        //more relevant unit testing
    }

    @Test
    void rollbackExecution() {
        ClientRepository repository = mock(ClientRepository.class);
        new ClientInitializerChangeUnit().rollbackExecution(repository);
        verify(repository, new Times(1)).deleteAll();
    }

}
```

## Integration test

Upon gaining confidence in the isolated testing of ChangeUnits, the testing robustness can be further enhanced by introducing integration tests. The primary objective of integration tests is to validate the entire migration suite within the application context and verify the expected database results.

This level of testing is more complex, as it necessitates simulating the application context and integrating various components within the application. However, it is crucial for ensuring the correctness of the migration.

### What you can check?

When testing your application, it is essential to ensure that the expected changes have been applied, and that they are audited. This includes checking the correct execution of ChangeUnits, the auditing of them, and checking your listeners. By verifying these aspects, you can guarantee that the migration has been successful and that your project is in the desired state.

:::info
The code snippets are extracted from the [MongoDB Standalone Example](https://github.com/mongock/flamingock-examples/tree/master/mongodb/mongodb-sync-standalone)
:::

#### Verifying ChangeUnit execution

In the example, the ChangeUnits creates a new collection named `clientCollection` with two documents, `Jorge` and `Federico`. This can be verified as follows (but it depends on your own ChangeUnits):

```java
@Test
@DisplayName("SHOULD create clientCollection and insert two clients")
void functionalTest() {
    Set<String> clients = mongoClient.getDatabase(DATABASE_NAME)
            .getCollection("clientCollection")
            .find()
            .map(document -> document.getString("name"))
            .into(new HashSet<>());

    assertTrue(clients.contains("Jorge"));
    assertTrue(clients.contains("Federico"));
    assertEquals(2, clients.size());
}
```

#### Auditing changes

The auditing of changes can be verified checking the database:

```java
@Test
@DisplayName("SHOULD insert the Flamingock change history")
void flamingockLogsTest() {
    ArrayList<Document> flamingockDocuments = mongoClient.getDatabase(DATABASE_NAME)
            .getCollection(FLAMINGOCK_REPOSITORY_NAME)
            .find()
            .into(new ArrayList<>());

    Document aCreateCollection = flamingockDocuments.get(0);
    assertEquals("create-collection", aCreateCollection.get("changeId"));
    assertEquals("EXECUTED", aCreateCollection.get("state"));
    assertEquals("io.flamingock.examples.community.changes.ACreateCollection", aCreateCollection.get("changeLogClass"));

    Document bInsertDocument = flamingockDocuments.get(1);
    assertEquals("insert-document", bInsertDocument.get("changeId"));
    assertEquals("EXECUTED", bInsertDocument.get("state"));
    assertEquals("io.flamingock.examples.community.changes.BInsertDocument", bInsertDocument.get("changeLogClass"));

    Document cInsertAnotherDocument = flamingockDocuments.get(2);
    assertEquals("insert-another-document", cInsertAnotherDocument.get("changeId"));
    assertEquals("EXECUTED", cInsertAnotherDocument.get("state"));
    assertEquals("io.flamingock.examples.community.changes.CInsertAnotherDocument", cInsertAnotherDocument.get("changeLogClass"));

    assertEquals(3, flamingockDocuments.size());
}
```

#### Verifying Event Listeners

If event listeners are defined, their execution can be verified:

```java
@Test
@DisplayName("SHOULD trigger start and success event WHEN executed IF happy path")
void events() {
    assertTrue(PipelineStartedListener.executed);
    assertTrue(PipelineCompletedListener.executed);
    assertFalse(PipelineFailedListener.executed);
    assertEquals(1, StageStartedListener.executed);
    assertEquals(1, StageCompletedListener.executed);
    assertEquals(0, StageFailedListener.executed);
}
```

### Integration test with Standalone Runner

The standalone runner offers great control over the process, enabling the implementation of integration tests without requiring additional support.

The following factors must be considered:

- The Flamingock Runner cannot be executed multiple times; therefore, a new runner instance must be created and executed for each test.
- If the same database is shared across multiple tests, it is essential to clean the database to ensure a fresh start for each test case.

### Integration test with Springboot Runner with Junit5

:::danger
TODO: this is from Mongock
:::

Mongock provides some useful classes making testing easier. In summary, you need to create your test class extending `MongockSpringbootJUnit5IntegrationTestBase`, which provides the following

- **BeforeEach method(automatically called):** Resets mongock to allow re-utilization (not recommended in production) and build the runner
- **AfterEach method(automatically called):** Cleans both Mongock repositories(lock and migration)
- **Dependency injections:** It ensures the required dependencies(Mongock builder, connectionDriver, etc.) are injected
- **executeMongock() method:** To perform the Mongock migration
- **@TestPropertySource(properties = {"mongock.runner-type=NONE"}):** To prevent Mongock from injecting(and automatically executing) the Mongock runner bean. This is important to allow multiple Mongock runner's executions.
