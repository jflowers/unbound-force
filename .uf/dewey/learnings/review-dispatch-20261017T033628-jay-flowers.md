---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-17T03:36:28Z
identity: review-dispatch-20261017T033628-jay-flowers
tier: draft
---

Before flagging a defensive type-guard change for a missing regression test, trace the guard's call sites to determine whether observable behavior actually changed — a fails-without-the-fix test only exists if the fix changes an observable outcome. Observed on PR 745 round 2: isRecord in .opencode/lib/review-dispatch-artifact.ts gained !Array.isArray(value), but every call site (lines 62, 66, 68) already rejected arrays downstream — a top-level array fails the artifact_type discriminator (property access on an array yields undefined) and nested arrays fail the typeof field checks — so parseReviewDispatchArtifact returns null for array payloads identically before and after. The guard is correct contract-clarifying hardening, but a null-on-array-input test passes both before and after the change: it is a characterization test, not a TC-006 regression test. The meaningful seam test for this module is producer-to-consumer: parse the real persisted envelope bytes through the consumer parser (the finalize round-trip pattern), which catches field-rename drift the array case never could.
