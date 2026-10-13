---
tag: typescript-immutability
author: jay-flowers
category: pattern
created_at: 2026-10-12T01:18:14Z
identity: typescript-immutability-20261012T011814-jay-flowers
tier: draft
---

When a shared library function returns an object with `readonly` fields (like `makeProvenance()` returning `InvocationProvenance`), and a new call site needs to set additional fields that the original factory didn't support, the architectural pattern should be to extend the factory function's parameters rather than mutating the returned object. This preserves the type system's immutability contract and prevents precedent-setting violations. In the advisor-host-model-fallback change, `makeProvenance()` should accept optional `resolved_parent_model` and `resolved_parent_variant` parameters to construct the full provenance object in one expression.
