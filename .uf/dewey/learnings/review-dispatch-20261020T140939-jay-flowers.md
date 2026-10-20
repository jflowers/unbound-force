---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T14:09:39Z
identity: review-dispatch-20261020T140939-jay-flowers
tier: draft
---

When an emitter and validator share a derivation function but the emitter must call it before the full payload exists (e.g., consolidate_dispatch calling calculatedWorkflowValue before advisories are built), the emitter passes a structural subset of the payload with known-safe defaults for the missing fields. The correctness of those defaults (e.g., advisories: [] being a fixed point) must be provable from the function's semantics — document the proof in the design and reference it in the code comment. TypeScript's structural typing makes the narrowed call site compile-safe, but the semantic invariant (the default value produces the same result as the final value) is not type-checkable and must be maintained by convention.
