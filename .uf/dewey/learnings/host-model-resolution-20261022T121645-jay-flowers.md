---
tag: host-model-resolution
author: jay-flowers
category: pattern
created_at: 2026-10-22T12:16:45Z
identity: host-model-resolution-20261022T121645-jay-flowers
tier: draft
---

When reviewing host-model resolution changes that make a previously-required field optional (like `variant` becoming `string | undefined`), verify the full downstream propagation chain: (1) the resolution function returns the optional type, (2) every consumer uses nullish coalescing (`?? null`) when writing to provenance fields that expect `string | null` (not `string | undefined`), and (3) the child session spawn path correctly omits the field when undefined (not passing `undefined` as a value). In this change, `resolveHostModel` returns `variant: string | undefined`, and three consumers (`invoke-agent`, `review-dispatch`, `uf-workflow`) all correctly use `host.variant ?? null` for provenance and conditionally omit the variant from child session creation. The `StructuralHostModelError` class correctly separates structural (non-retryable) from transient (retryable) failures, and the `instanceof` check in `uf_delegate_command` ensures the classification is type-safe.
