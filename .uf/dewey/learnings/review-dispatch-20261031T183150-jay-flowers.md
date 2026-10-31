---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-31T18:31:50Z
identity: review-dispatch-20261031T183150-jay-flowers
tier: draft
---

During the opsx/reviewer-capabilities-init-survival code review (2026-10-31, /uf.unleash Step 6), the consolidated dispatch returned verdict APPROVE WITH ADVISORIES while the canonical review-verdict v2 block carried council_decision ESCALATED. This is not a conflict and not a blocker: the review-dispatch plugin's canonicalDecision function deterministically projects every APPROVE WITH ADVISORIES dispatch verdict to canonical ESCALATED (APPROVE maps to APPROVED, REQUEST CHANGES to CHANGES_REQUESTED). The canonical ESCALATED defers the advisories to the existing human gate — the PR review created by /uf.finale — so a pipeline driver reading the canonical artifact must key progression on the dispatch verdict (operation_verdict, payload.verdict, workflow_result), never misreading ESCALATED as a mid-pipeline stop. Related handling in the same dispatch: a failed baseline reviewer (divisor-adversary, retryable child_prompt_failed server error) on a security_sensitive change profile is non-voting informational provenance; with four successful persona assessments the approving verdict stands, and redispatch_failed_runs with the dispatch correlation_id (08308500-de77-49bd-8846-d98137c184c0) remains available as the DR-FR-002 recovery if the human gate wants the security pass completed.
