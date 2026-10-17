---
tag: determinism
author: jay-flowers
category: gotcha
created_at: 2026-10-17T14:52:39Z
identity: determinism-20261017T145239-jay-flowers
tier: draft
---

Grammar divergence can originate in the spec delta itself, not just the implementation. In PR 745 (unleash-deterministic-tools), the resumability requirement's unqualified "clarification markers" and the clarify requirement's colon-form example led the implementation to derive two independent marker grammars (a prefix probe in detect_resume vs a colon-form pattern in scan_clarifications). Each passes its per-requirement tests, but the emergent cross-requirement behavior diverges: a bare hand-written marker silently bypasses clarify extraction (count 0, "No clarification needed") while permanently blocking resume completion (all_complete unreachable). No single-requirement test can see this. The remedy therefore has a spec-review entry point: when one delta references the same textual marker or grammar at different precisions across requirements, diff those references and either unify the grammar or explicitly scope how bare forms are handled. This extends determinism-20261016T152653 (implementation-level shared grammars) to the spec-origin case.
