---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T18:23:55Z
identity: review-dispatch-20261019T182355-jay-flowers
tier: draft
---

Sibling commands missing failure-mode semantics: when a docs-correction change adds failure-mode semantics for a newly mandated tool call in the primary command, audit every sibling command that mandates the same call. Grep siblings for the tool invocation and require the failure-mode contract (or an explicit citation of it) at every site. Scoped-down sibling edits that ship happy-path-only instructions reintroduce the improvisation gap the correction was meant to eliminate — e.g. consolidate_dispatch retrieval gained transient/permanent/all-skip semantics in uf.triage-issue.md but the same mandated call in uf.review-council.md, uf.address-feedback.md, and uf.review-pr.md was left with no failure behavior, and review-council's budget_skipped/limit_skipped run states make the all-skip outcome a realistic path to an undefined retrieval failure.
