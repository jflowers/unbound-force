---
tag: typescript-immutability
author: jay-flowers
category: gotcha
created_at: 2026-10-12T00:54:00Z
identity: typescript-immutability-20261012T005400-jay-flowers
tier: draft
---

The code review council identified a TypeScript immutability-violation pattern: mutating readonly fields on InvocationProvenance after makeProvenance() returns. TypeScript readonly is compile-time only and works at runtime, but circumvents the type system's contract. The better pattern is to extend makeProvenance() to accept optional resolved_parent_model/resolved_parent_variant parameters so the object is constructed correctly from the start. This is an advisory (MEDIUM) not a blocker because runtime behavior is correct.
