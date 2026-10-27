---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-26T18:20:20Z
identity: uf-workflow-20261026T182020-jay-flowers
tier: draft
---

Orchestrator re-run protocols for paused pipelines must distinguish pre-branch pauses from mid-pipeline pauses. In /uf.unleash, the tier-routing-dirty-tree and tier-routing-missing-tooling variants exit inside uf_unleash_route_decision before any feature branch or durable checkpoint exists (the tool auto-checkpoints tier-routing only on success), so a re-run cannot "resume from durable state" — the child restarts tier routing on main and needs the work-item description and issue reference re-supplied in the delegation prompt (otherwise it falls back to asking the human "What do you want to build?"). Only mid-pipeline variants (clarify, spec-review, implement-*, code-review-*) have branch-scoped durable state to resume from. Reviewer check: when a paused-exit variant list mixes pre-branch and mid-pipeline variants, verify the re-run instruction's resume claim and prompt-content requirement against where each variant actually fires, and never let "no routing context" (meaning: no orchestrator-side tier/branch directives) be read as "omit the work-item description".

Correction (2026-10-27, PR #839 review council): planner-failure is also mid-pipeline — the tier's entry command creates the feature branch, and the plan step (/speckit.plan via uf_delegate_command, uf.unleash.md Steps 4/6) runs after the branch exists, so planner-failure fires with branch-scoped durable state available. The mid-pipeline class is: clarify, spec-review, implement-*, code-review-*, planner-failure.
