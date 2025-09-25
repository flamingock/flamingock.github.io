---
title: Profiles
sidebar_position: 4
---

# Spring Boot profiles

Flamingock supports **Spring Boot profiles** out of the box. This allows you to conditionally run specific change units depending on which profile(s) are active in your application.

This is useful for managing environment-specific changes, such as different initialization data for `dev`, `staging`, or `prod` environments.


## What is a Spring profile?

Spring profiles provide a way to segregate parts of your application configuration and behavior based on the active environment.

You can define profiles like `dev`, `test`, `staging`, or `prod`, and activate **one or more** of them using any of the following methods:

- Inside `application.yaml` or `application.properties`:
  ```yaml
  spring:
    profiles:
      active: dev,staging
  ```

- Using profile-specific configuration files like `application-dev.yaml` or `application-prod.yaml`

- As command-line arguments:
  ```bash
  --spring.profiles.active=dev,staging
  ```

- Through environment variables:
  ```bash
  SPRING_PROFILES_ACTIVE=dev,staging
  ```

When multiple profiles are active, Flamingock evaluates each change unit against **all active profiles**, and includes it if any match.


## How Flamingock uses profiles

Flamingock automatically retrieves the active profiles from Spring’s `ApplicationContext`. You don’t need to manually provide them.

You can then annotate any change unit with Spring’s native `@Profile` annotation to control whether it runs:

```java
@Change(id = "add-test-data", order = "20250207_01")
@Profile("dev")
public class AddTestDataChange {
  // will only run if "dev" profile is active
}
```

Flamingock applies the same logic as Spring Boot when evaluating whether a change unit should run.


## Multiple profiles

You can declare multiple profiles in a single `@Profile` expression:

```java
@Profile({"dev", "staging"})
```

This change unit will run if **any** of the listed profiles is active.


## Excluding profiles

To exclude a change unit from a specific profile, you can use Spring Expression Language (SpEL):

```java
@Profile("!prod")
```

This will run the change unit in **all environments except `prod`**.


## ✅ Best practices

- Use profiles to isolate test data, preview features, or tenant-specific migrations
- Avoid mixing profile-specific logic inside a single change unit — split them into separate classes
- Keep profile names consistent across your team and environments (e.g., use `dev` everywhere, not `development`, `dev-env`, etc.)
- Consider grouping related change units under a shared profile for easier activation
