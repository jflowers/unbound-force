---
tag: scaffold-pin-tests
author: jay-flowers
category: pattern
created_at: 2026-10-25T14:53:34Z
identity: scaffold-pin-tests-20261025T145334-jay-flowers
tier: draft
---

Checkpoint-data field pins need the same per-site census as wiring-phrase pins: when two checkpoint templates in one step record the same field (PR 815 head: quick-gate data.iteration at uf.unleash.md:801 and phase-checkpoint iteration at :1180), a shared-prefix pin like "iteration: [fix-loop iterations" matches both, so deleting either site's field alone keeps the suite green — the per-site rule codified for wiring phrases (test-quality-20261024T160650, scaffold-pin-tests-20261025T124632) recurs silently in the checkpoint-data class. Derive per-site phrases from the templates' differing continuation text ("iterations used, 0" vs "iterations used so far"), and pin budget-semantics sentences ("never 3 more per resume", "read it back on resume", "on resume means the loop re-enters") as their own wiring sites. Census with a phrase-aware grep, not eyeball: the same sentence newline-broken across wrapped lines ("total across / sessions", uf.unleash.md:962-963) silently dodges a contiguous-phrase pin.
