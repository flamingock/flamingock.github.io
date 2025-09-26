---
title: Domain Coupling
sidebar_position: 7
---

# Domain Coupling and Historical Immutability

## Why this matters

Here's something that might surprise you: Changes that ran successfully in the past can break your build today. This happens when Changes depend on domain classes that evolve over time. Let's understand why this matters and how to keep your Changes stable.

## The coupling problem

Changes in Flamingock are meant to be **historically immutable** - they represent past changes that have been applied and audited. Their code should remain untouched over time to ensure:

- **Repeatability**: The same Change produces the same result
- **Auditability**: Historical changes can be verified
- **Reliability**: Past Changes continue to work in new environments

However, when a Change depends on a domain class and that class evolves (fields removed, renamed, or restructured), your older Changes will no longer compile or run correctly.

### A practical example

Consider a PostgreSQL database with a `customers` table. Initially, your domain model includes:

```java
public class Customer {
    private Long id;
    private String firstName;
    private String middleName;  // Will be removed later
    private String lastName;
    private String email;
    // getters/setters...
}
```

You create a Change that uses this domain class:

```java
@Change(id = "add-premium-customers", order = "20250923_01", author = "team")
public class _0001__AddPremiumCustomers {

    @Apply
    public void apply(CustomerRepository repository) {
        Customer customer = new Customer();
        customer.setFirstName("John");
        customer.setMiddleName("William");  // Uses the field
        customer.setLastName("Smith");
        customer.setEmail("john.smith@example.com");
        repository.save(customer);
    }
}
```

Six months later, your team decides `middleName` is unnecessary and removes it from the `Customer` class. Now:

- ✅ Your application works fine with the updated model
- ❌ The Change `_0001__AddPremiumCustomers` no longer compiles
- ❌ You can't run Flamingock in new environments
- ❌ CI/CD pipelines break

This breaks the principle of historical immutability and undermines Flamingock's reliability.

## The solution: Generic structures

To ensure stability, avoid injecting domain classes or anything tightly coupled to your evolving business model. Instead, use schema-free or generic structures.

Here's how the same Change looks using generic structures:

```java
@Change(id = "add-premium-customers", order = "20250923_01", author = "team")
public class _0001__AddPremiumCustomers {

    @Apply
    public void apply(RestTemplate restTemplate) {
        // Using a Map instead of the Customer domain class
        Map<String, Object> customerData = new HashMap<>();
        customerData.put("firstName", "John");
        customerData.put("middleName", "William");
        customerData.put("lastName", "Smith");
        customerData.put("email", "john.smith@example.com");
        customerData.put("status", "PREMIUM");

        // Send to customer service API
        restTemplate.postForObject(
            "/api/customers",
            customerData,
            Map.class
        );
    }

    @Rollback
    public void rollback(RestTemplate restTemplate) {
        // Remove the customer using email as identifier
        restTemplate.delete("/api/customers/john.smith@example.com");
    }
}
```

This Change remains stable even if the `Customer` domain class evolves or the `middleName` field is removed. The Map structure is decoupled from your domain model.

## When you need reusable logic

If you have complex logic that needs to be shared across Changes, consider these approaches:

### Utility classes for Changes

Create utilities specifically for your Changes that are isolated from your domain:

```java
public class ChangeUtils {
    public static Map<String, Object> createCustomerData(
        String firstName, String lastName, String email) {
        return Map.of(
            "firstName", firstName,
            "lastName", lastName,
            "email", email,
            "createdAt", Instant.now().toString()
        );
    }
}
```

### SQL files or scripts

For complex SQL operations, consider external scripts:

```java
@Apply
public void apply(JdbcTemplate jdbc) throws IOException {
    String sql = Files.readString(
        Paths.get("changes/sql/001_create_premium_customers.sql")
    );
    jdbc.execute(sql);
}
```

## Best practices summary

1. **Treat Changes as historical artifacts** - They are versioned records of the past, not part of your live business logic

2. **Use generic structures** - Maps, Documents, ResultSets, or direct queries instead of domain objects

3. **Keep Changes self-contained** - Minimize dependencies on external classes that might change

4. **Test with evolution in mind** - Ensure your Changes compile and run even as your domain evolves

5. **Document data structures** - When using generic structures, add comments explaining the expected schema

## The balance

We're not suggesting you should never use any classes in your Changes. The key is understanding the trade-off:

- **Domain classes**: Type safety now, brittleness over time
- **Generic structures**: Less type safety, long-term stability

Choose based on your context, but be aware of the implications. For most production systems where Changes need to remain stable for years, generic structures are the safer choice.

## Next steps

- Review existing Changes for domain coupling
- Establish team conventions for Change implementations
- Consider using [Templates](../templates/templates-introduction.md) for standardized, decoupled change patterns