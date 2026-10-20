---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:18:25Z
identity: openspec-20261020T161825-jay-flowers
tier: draft
---

Multi-round OpenSpec reviews: every round-N contract amendment must re-trigger the ripple sweep performed in earlier rounds. When a fix amends a contract term (tool signature, derivation rule, gating invariant), re-verify every surface the term touches — sibling change deltas, earlier-round task texts, governance docs (AGENTS.md, CHANGELOG), scaffold mirrors — against the amended wording, not just the artifact that prompted the fix. In the unleash-tier-routing round-3 review, the round-2 both-claims resumability fix (task 10.2) never propagated to the sibling unleash-deterministic-tools delta that task 10.3 had already reconciled, leaving contradictory MUSTs that would both land in the main spec at archive time; two superseded round-1 task texts (2.1, 3.2) also went unannotated. Maintain a per-term ripple checklist and re-run it after every fix round.
