---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-29T13:20:09Z
identity: command-design-20261029T132009-jay-flowers
tier: draft
---

In uf command checkpoint state (checkpoint/get_progress, keyed by command+branch), the data object is shallow-merged on every write (Object.assign, per openspec/changes/uf-workflow-checkpoint design D3): recording {"iteration": N} over a prior {"iteration": 3, "budget_exhausted": true} yields {"iteration": N, "budget_exhausted": true} — the unmentioned flag survives the write. Any command that branches on a discriminating flag in recovered checkpoint data (exhaustion markers, terminal-state records, gate-passed flags) must clear the flag atomically at the decision point that consumes it — record the full shape ({"iteration": 0, "budget_exhausted": false}) when granting the fresh budget — and every increment site must record the full shape, because a partial-shape increment cannot overwrite a field it does not name. Observed assessing the uf.fix-ci iteration-budget feedback (unbound-force PR 868, October 2026): the proposed exhaustion-marker design relied on "the marker is overwritten at first increment," which the merge semantics do not provide; a mid-invocation resume would have misread the stale marker as prior-invocation exhaustion and reset the budget, violating the command's never-reset-by-resume guardrail. Verification technique: diff every field a checkpoint consumer branches on against every writer's recorded shape.
