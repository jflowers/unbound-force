---
tag: review-context-skill
author: yvonne-devlin
category: gotcha
created_at: 2026-06-29T12:53:11Z
identity: review-context-skill-20260629T125311-yvonne-devlin
tier: draft
---

The issue acceptance criteria for skill migrations should not include "graceful degradation: if the skill is absent, current inline behavior is preserved as fallback" when the project's established pattern is hard dependencies. The pre-flight skill has three consumers (review-pr, review-council, unleash) and none implement fallback logic. Skills embedded in the scaffold and distributed via uf init are structurally guaranteed to be present — the drift detection test TestEmbeddedAssets_MatchSource catches any sync issues at build time. Including unnecessary fallback logic creates a dual-path maintenance burden and risks stale inline code becoming a silent security regression, as identified by the divisor-adversary during triage.
