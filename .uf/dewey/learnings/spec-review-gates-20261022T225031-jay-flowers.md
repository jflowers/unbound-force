---
tag: spec-review-gates
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:31Z
identity: spec-review-gates-20261022T225031-jay-flowers
tier: draft
---

When a governance gate's trigger condition or option set changes (e.g., spec review's HIGH/CRITICAL dead-stop replaced by a human "Pause & exit" choice), every surface naming the old condition goes stale at once: exit-renderer reason strings, tool input-schema descriptions, doc comments, golden-template tests, capability bullets in docs, and still-active OpenSpec changes that carry the superseded requirements. Verified pattern from spec-review-per-finding-gate (opsx branch, 2026-10-22): grep the retired phrases repo-wide, classify each hit (historical changelog/learning record, Supersedes-named active-change carrier, negative test assertion, live citation), update live citations in the same increment, name the active-change carriers explicitly in a Supersedes note so archive-time merges reconcile, and pin the new protocol fragments (option labels, gate markers, boundary rules) in drift-tested structural assertions so a partial rename fails make check.
