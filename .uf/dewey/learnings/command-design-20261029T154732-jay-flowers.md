---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:47:32Z
identity: command-design-20261029T154732-jay-flowers
tier: draft
---

Prescribed tool invocations in markdown workflow commands live at multiple layers: the governing rule (design decision or phase-0 bullet), the operative numbered steps, the terminal CHECKPOINT markers, and cross-reference prose claiming shape parity ('the same step and data shape ... write'). A fix that changes an invocation's data shape must be threaded through every layer; applying it only at the governing rule leaves operative steps contradicting it and makes the fix commit's completeness claim false. Observed in opsx/uf-fix-ci (PR 868, round 2): the exhaustion-marker fix (commit edb7ac9f) added the full two-field increment shape at 4.0 and design D8, but left 4.2's operative `data: {"iteration": N}` (uf.fix-ci.md:901) and the Phase 4 CHECKPOINT (:1028) at the partial shape — a latent shallow-merge hazard because checkpoint state merges shallowly and a partial write cannot clear a stale flag. Verification technique: for every data-shape invariant, grep the command for every writer site of the invocation and diff the prescribed shapes; re-check every 'same shape as' cross-reference after the edit.
