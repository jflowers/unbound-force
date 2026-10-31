---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-31T13:58:28Z
identity: openspec-20261031T135828-jay-flowers
tier: draft
---

OpenSpec proposal.md Capabilities sections must name the same capabilities as the change's delta spec directories. In unbound-force, the convention is 1:1 — dewey-init-ownership's proposal names `init-force-reindex` and `setup-step-count` appear verbatim as that change's delta requirement headers. Naming capabilities in a proposal that never materialize as delta specs, or labeling a capability "Modified" when no prior spec establishes it (openspec/specs/ held only review-council, graphthulhu-distribution, and ci), creates phantom capability names: at archive time a capability dir unrelated to the proposal inventory materializes, and future changes grepping for the proposal's names find nothing. Verify proposal capability names against the delta specs/ directory and the openspec/specs/ corpus before the spec review gate.
