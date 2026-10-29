---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:46:04Z
identity: review-dispatch-20261029T134604-jay-flowers
tier: draft
---

When a pure, dependency-free module must respect a numeric bound owned by an impure module (e.g., a zod schema's .max() literal), re-declaring the bound as a local constant leaves the coupling comment-only and drift-silent. The executable pin belongs in the test file, which carries no purity constraint: import the owning schema there and assert safeParse(LOCAL_BOUND).success === true && safeParse(LOCAL_BOUND + 1).success === false — a behavioral equality check that catches drift in both directions (bound raised or lowered on either side) and survives refactors, unlike source-text regex parsing. The shared-constant alternative is heavier when the owning module is deliberately frozen by the change's design: it touches the frozen file and adds a new scaffold-asset surface (embedded copy, asset enumeration, drift-table entry). Observed in derive-per-run-timeout (PR #860, reviewer item 11): run-timeout.ts:39 MAX_TIMEOUT_MS mirrors agent-executor.ts:18 TimeoutSchema's max with comment-only coupling; confirmed valid with the test-file safeParse pin as the scope-preserving fix.
