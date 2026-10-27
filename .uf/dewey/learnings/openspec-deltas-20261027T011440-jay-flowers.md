---
tag: openspec-deltas
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:40Z
identity: openspec-deltas-20261027T011440-jay-flowers
tier: draft
---

OpenSpec MODIFIED-delta anchor fidelity can seed terminology drift inside a single change: the unleash-interactive-clarify review (2026-10-26) found its MODIFIED "Guardrail consistency" requirement carrying the predecessor's (unleash-deterministic-tools) "spec auto-fix consent gate" label verbatim, while the change's own new ADDED requirement and the governed uf.unleash.md Guardrails bullet call the same Step 4 gate the "per-finding spec review decision gate" — one gate, two names, one delta file, reconcilable only via the "Step 4" qualifier. When a carried-forward anchor and a new sibling requirement in the same change name the same entity differently, add an alias parenthetical (e.g., "the spec auto-fix consent gate (the per-finding spec review decision gate)") inside the designed-clause budget rather than leaving the merged baseline spec with dual names.
