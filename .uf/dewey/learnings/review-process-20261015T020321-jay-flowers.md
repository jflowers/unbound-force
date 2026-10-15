---
tag: review-process
author: jay-flowers
category: pattern
created_at: 2026-10-15T02:03:21Z
identity: review-process-20261015T020321-jay-flowers
tier: draft
---

A retrospective learning that documents a known defect in the current PR confirms the finding; it does not discharge it. In opsx/unleash-direct-review-dispatch (PR #729, 2026-10-14), the Step 4 consent-gate bullet cited `.opencode/uf/packs/severity.md` for the enumerated fix-scope list (formatting, status fields, terminology, cross-references, obvious gaps, stale metadata), but that list lives only in the council command's hybrid fix policy (uf.review-council.md Spec Review Mode, lines 1166-1178); severity.md carries only the LOW/MEDIUM vs HIGH/CRITICAL boundary. The PR's own learning documented the misattribution and framed it as "a remaining advisory for a future increment", yet the remedy was a one-line citation edit in files the PR already modified. Defer-to-future-increment rationales only hold when the fix requires out-of-scope work (new plugin tools, untouched files); reviewers should check the remedy's scope before accepting a self-documented deferral, and authors should fix known-wrong citations in the same PR that introduces them.
