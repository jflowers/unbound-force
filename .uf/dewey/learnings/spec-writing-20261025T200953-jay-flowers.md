---
tag: spec-writing
author: jay-flowers
category: gotcha
created_at: 2026-10-25T20:09:53Z
identity: spec-writing-20261025T200953-jay-flowers
tier: draft
---

When an OpenSpec delta MODIFIES a generically-scoped requirement but the change implements the new behavior for only a subset of that scope, the MODIFIED text must be scoped to the subset or carry an explicit carve-out. Example: fix-init-speckit-sentinel modified spec 027 FR-011 ("Each tool delegation MUST be idempotent — reported as a subToolResult with action 'already configured'") while only simpleTools delegations report that action; initDewey keeps its silent empty-result skip when .uf/dewey exists. Archiving the delta as written would codify a MUST the codebase does not satisfy, and the false claim resurfaces on the next sentinel/skip behavior change.
