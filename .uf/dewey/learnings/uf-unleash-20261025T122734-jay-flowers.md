---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:27:34Z
identity: uf-unleash-20261025T122734-jay-flowers
tier: draft
---

Multi-gate invariant wiring in command prose: when a shared exclusion clause governs every gate that routes into a loop (e.g., "pre-existing and environmental failures never enter the loop"), each gate's entry condition must explicitly apply the filter the clause presupposes — the filter must exist at the gate, not only in the loop's text. In PR 815's /uf.unleash build/test fix loop, the phase checkpoint carried the causality filter structurally (verdict rule maps all-pre-existing/environmental failure sets to green) and Step 6 stated its branch-caused filter explicitly, but the quick-tier pre-flight gate routed on raw "If any check fails" — the invariant held at two of three gates and was unwired at the third, with the CHANGELOG repeating the unwired claim and the scaffold mirror inheriting it byte-identically. Compounding factor: hard-gate pre-flight mode has no causality-classification phase (Phase 4a/4b baseline-plus-classification belongs to soft-gate mode), so any gate running hard-gate mode needs its own classification wiring before an exclusion clause can take effect there. Review pattern: enumerate every gate an invariant governs and verify each gate's entry condition references the filter; a once-stated invariant does not wire itself, and when a gate's routing contradicts a loop's exclusion clause, the gate's literal routing wins operationally.
