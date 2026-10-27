---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-26T21:41:26Z
identity: spec-authoring-20261026T214126-jay-flowers
tier: draft
---

When a spec requirement enumerates variant classes (e.g., /uf.unleash paused-exit variants) and its follow-up semantics differ by class, the scenario set must exercise at least one variant per class — otherwise requirement text that generalizes across the enumeration is verified only for the exercised class. Verified on PR 839 feedback item 3 (2026-10-26, update-run-pipeline-plan): the "Unleash Paused-Exit Handling" requirement's re-run step claimed "the child re-anchors on the feature branch's durable state and resumes" for all eleven variants, but its only re-run scenario was GIVEN an implement-phase-checkpoint (mid-pipeline) exit; the claim is false for tier-routing-dirty-tree/-missing-tooling, which fire inside uf_unleash_route_decision before any branch exists (the tool auto-checkpoints tier-routing only on success). The false claim then shipped in lockstep across four surfaces: the command file, its byte-identical scaffold mirror (propagating to every uf init scaffold), the spec delta, and design D4. Reviewer recipe for spec and feedback review: partition the requirement's variant enumeration by where each variant actually fires (pre-branch vs branch-scoped), confirm each partition has a pinning Given/When/Then scenario, and treat any claim generalized across the enumeration but scenario-pinned to only one partition as a false-claim defect requiring lockstep correction across command + mirror + spec + design (mirror enforced by TestEmbeddedAssets_MatchSource).
