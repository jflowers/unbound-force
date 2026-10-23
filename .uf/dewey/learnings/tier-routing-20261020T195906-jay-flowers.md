---
tag: tier-routing
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:59:06Z
identity: tier-routing-20261020T195906-jay-flowers
tier: draft
---

When adding a ceremony-bypassing fast path to a governance system, the bypass's risk floors MUST subsume every class the system's mandate list requires ceremony for, or the mandate list MUST be amended in the same change. Otherwise the two governance texts conflict at the boundary: small-looking changes in spec-mandated classes carry none of the bypass's floor signals and get autonomously routed around the ceremony. In unbound-force PR #784 (unleash-tier-routing), the tier-routing skill's four risk floors (security-sensitive, auth, data-loss, public-API-breaking) omitted AGENTS.md's 'What requires a spec' classes (agent changes, CI changes, data-model changes, signature-changing refactors, multi-function test additions), letting e.g. a one-line agent edit route to the quick tier and bypass the spec-workflow MUST — flagged MEDIUM by divisor-guard. Checklist: whenever adding a path that can bypass an enumerated mandate, diff the mandate list against the bypass's floors.
