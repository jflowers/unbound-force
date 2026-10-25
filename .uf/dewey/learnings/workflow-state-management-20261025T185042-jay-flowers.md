---
tag: workflow-state-management
author: jay-flowers
category: pattern
created_at: 2026-10-25T18:50:42Z
identity: workflow-state-management-20261025T185042-jay-flowers
tier: draft
---

Bounded-loop counters persisted per-gate in command prose create gate-specific state seams; prefer the budget-only-step pattern as the general default. PR 815's build/test fix loop needed three counter encodings (phase-checkpoint data.fixLoopPhase[N], the quick gate's budget-only quick-fix-budget step, Step 6's data.fixLoopPreflight) because its three calling gates carry different checkpoint resume-detection roles (verdict-bearing, completion-claim, resume-inert — see learning uf-unleash-20261025T171523). Two of those seams failed review before shipping: the checkpoint tool silently strips undeclared structured phase fields (iteration-2 HIGH, fixed by moving the count to free-form data keys), and writing the mid-loop budget into the quick gate's quick-pre-flight step would have falsified its completion claim on resume (iteration-3 HIGH, fixed by the budget-only quick-fix-budget step). Distillation for future bounded loops in command templates: (1) when the calling gate's checkpoint step doubles as a completion claim, persist the counter in a dedicated budget-only step — a step name resume detection does not consume — rather than overloading the gate's own step or inventing a per-gate data-key encoding; (2) pin the budget step name plus a completion-claim-separation phrase (e.g. "ONLY completion") in the scaffold suite so the separation cannot silently regress; (3) when a loop's between-step work is judgment-free, prefer tool-owned counting via a DE-005 intent-level tool over prose-distributed bookkeeping — the three-shape storage exists only because the accounting is hand-wired per gate.
