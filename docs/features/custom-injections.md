---
sidebar_position: 5
---

# Custom injections

Flamingock primarily adopts a code-first approach for managing migrations, which offers several advantages—one of the most powerful being the ability to inject any bean into your migration classes.

This flexibility proves especially useful in scenarios such as:

- Retrieving data from a third-party system as part of the migration process
- Leveraging Spring Data repositories to interact with your database
- Executing additional operations during the migration (e.g., sending a notification), while ensuring that the transaction is aborted if the operation fails


## How to use a custom bean in Change

### In a constructor
### In the methods

##  How to define/inject your custom beans

### Standalone 
### Spring-base

## Proxy explanation
