---
tag: spec-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-30T19:49:24Z
identity: spec-workflow-20261030T194924-jay-flowers
tier: draft
---

Spec proposals authored after an org constitution amendment can carry a stale Constitution Alignment section. The forward-aggregate-correlation-id proposal (created 2026-10-30) assessed only the four pre-amendment principles (I-IV) while the org constitution v1.4.0 (amended 2026-10-14) carries six, omitting V Security by Default and VI Deterministic Execution — the latter directly material to a change that adds instruction prose to commands. The stale enumeration also propagated into tasks.md's constitution-verification task (5.4). Constitution Alignment sections and their verification tasks must be derived from the constitution file's current principle list at authoring time, never from a remembered or templated set.
