---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-28T17:44:57Z
identity: documentation-gate-20261028T174457-jay-flowers
tier: draft
---

When a spec's documentation-gate task enumerates user-facing surfaces for a file-or-exempt classification, enumerate by surface type exhaustively: input contracts, output fields, configuration fields, instruction/prose changes, AND behavior/semantics changes to existing tools. The derive-per-run-timeout spec review series caught two successive omissions in the same task 8.3 enumeration — review-matrix config fields (iteration 3) and the redispatch_failed_runs recovery behavior change, cancelled runs becoming re-run targets with changed refusal semantics (iteration 4) — because the enumeration covered structural surface types but not the semantic surface of changed tool behavior. An exemption rationale is only as complete as the enumeration it is required to address, so any user-facing surface omitted from the enumeration is a surface an exemption can silently skip.
