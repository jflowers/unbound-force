---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-30T01:03:46Z
identity: command-design-20261030T010346-jay-flowers
tier: draft
---

Derived tool output fields consumed for downstream branching must define degraded-value semantics at the consumption site. fetch_pr_review_context degrades base_repository to an empty string (plus a warning) when the PR url doesn't parse as a github.com-rooted url — GitHub Enterprise Server urls always degrade because the derivation regex hardcodes github.com. /uf.fix-ci's Phase 1.2 derives IS_FORK by comparing HEAD_REPOSITORY with BASE_REPOSITORY; on the degraded path every same-repo PR derives fork orientation (non-empty head vs. empty base), inverting Phase 1.3's remote resolution, and downstream fetch_failed_run_logs's repo schema rejects the empty value with a fail-closed STOP. The prior raw-gh implementation read gh's authoritative isCrossRepository field, which is host-agnostic. When a command consumes a derived field for branching, gate on the degradation sentinel (empty string / warning presence) exactly as the tool's own degraded paths do, or re-route around the degraded case explicitly.
