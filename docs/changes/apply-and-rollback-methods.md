---
title: Apply and rollback methods
sidebar_position: 3
---

# Apply and rollback methods

## Quick start

Your Change methods receive the dependencies they need as parameters - Flamingock automatically provides them.

### Basic examples

```java
@Apply
public void apply(S3Client s3Client, AdminClient adminClient, FeatureFlagService flags) {

}

@Rollback
public void rollback(S3Client s3Client, AdminClient adminClient, FeatureFlagService flags) {

}
```

**Why rollback is required:**
- Executed automatically on failure for non-transactional systems
- Required for  undo operations
- Ensures every change can be reversed

## Where parameters come from

Flamingock resolves method parameters from three sources (in priority order):

1. **Target system context** - System-specific dependencies
2. **Global context** - Shared application dependencies
3. **Framework context** - e.g., Spring beans

The exact dependencies available depend on your target system and configuration.

See [Context and Dependencies](../flamingock-library-config/context-and-dependencies.md) for complete details on configuring and understanding available dependencies.

## Method rules

- **Must be public** - Flamingock needs to invoke them
- **Any name works** - `apply`, `execute`, `migrate`, your choice
- **Return type ignored** - Can be void or return a value
- **All parameters injected** - No manual parameters

---

## Advanced topics

### Type-based injection

Parameters are injected based on their type:

```java
@Apply
public void apply(KafkaTemplate kafka, ConfigService config) {
    // Flamingock looks for matching types in the context
}
```

### Named parameters

Use `@Named` when multiple beans of the same type exist:

```java
@Apply
public void apply(
    @Named("orders") KafkaTemplate ordersKafka,
    @Named("notifications") KafkaTemplate notificationsKafka
) {
    // Specific instances by name
}
```

### Optional parameters

By default, all parameters are required. Missing dependencies throw exceptions.

Use `@Nullable` for optional dependencies:

```java
@Apply
public void apply(
    S3Client s3,                      // Required
    @Nullable CacheService cache      // Optional - null if not available
) {
    if (cache != null) {
        cache.invalidate();
    }
    // proceed with S3 operation
}
```

### Lock-guarded dependencies

Flamingock uses a background daemon to automatically refresh the distributed lock, ensuring your Changes maintain exclusive access during execution. As an additional safety layer, Flamingock wraps injected dependencies with proxies that verify the lock is still valid before each method call.

This proxy mechanism provides extra robustness - ensuring that operations don't even start if the lock is lost for any reason (though this is very unlikely given the background refresh daemon).

For non-critical or local components, use `@NonLockGuarded` to skip the proxy:

```java
@Apply
public void apply(
    ElasticsearchClient elastic,               // Lock-guarded (default)
    @NonLockGuarded List<String> localData     // Not guarded - no proxy overhead
) {
    // elastic calls are protected by lock validation
    // localData is used directly without checks
}
```

See [Lock documentation](../flamingock-library-config/lock.md) for more details on lock protection.

### Dependency resolution details

When Flamingock looks for a dependency to inject, it follows a specific hierarchy. This ensures system-specific dependencies take precedence over general ones.

For complete understanding of dependency resolution, see [Dependency Resolution Hierarchy](../flamingock-library-config/context-and-dependencies.md#dependency-resolution-hierarchy).

