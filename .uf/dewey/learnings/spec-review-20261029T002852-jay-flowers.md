---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-29T00:28:52Z
identity: spec-review-20261029T002852-jay-flowers
tier: draft
---

Spec-review pattern (observed in openspec/changes/uf-fix-ci, 2026-10-28): when a change's design/assessment prose states a safety invariant — e.g., "every mutation (rebase, commit, push, rerun) behind a human question-tool gate" — the invariant is only real if it is threaded into all three operational layers: (a) the FR scenarios' GIVEN/WHEN/THEN ordering, (b) the proposal's numbered behavior sequence, and (c) tasks.md phase ordering with explicit gate citations per phase. In uf-fix-ci, D6/Goals/Security/Constitution-V all promised a gate before the rebase, but FR-004 specified the rebase with no gate, FR-005 scoped its gate "before any fix executes" (code-fix scenarios only), and tasks.md ordered Phase 3 (rebase, task 1.4, no gate cited) before Phase 4 (the MANDATORY GATE, task 1.5) — so a sequential implementer would rebase and force-push-with-lease without human confirmation. Verification technique: walk the tasks.md phase order and each FR's scenario order against the invariant, not the design-decision prose; the design section is where the invariant is born, the FRs and task phases are where it lives or dies. Same audit applies to iteration-sequence summaries (FR-005's "fix → commit → push → re-poll" omitted the FR-006 council gate between commit and push).
