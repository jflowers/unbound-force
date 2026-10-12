---
tag: typescript-immutability
author: jay-flowers
category: pattern
created_at: 2026-10-12T00:50:44Z
identity: typescript-immutability-20261012T005044-jay-flowers
tier: draft
---

When extracting functions into a shared library that return objects with `readonly` fields (like `InvocationProvenance`), callers that need to set additional fields post-construction should either: (1) extend the factory function to accept the additional parameters, or (2) use a builder/spread pattern that constructs the full object in one expression. Mutating `readonly` fields after construction works at runtime in TypeScript but circumvents the type system's immutability contract and sets a bad precedent. The `makeProvenance()` function in review-dispatch should accept optional `resolved_parent_model` and `resolved_parent_variant` parameters to avoid post-construction mutation.
