---
tag: opsxspawn-subtask-classification-params
author: jay-flowers
category: pattern
created_at: 2026-10-26T02:38:22Z
identity: opsxspawn-subtask-classification-params-20261026T023822-jay-flowers
tier: draft
---

2026-10-26, branch opsx/spawn-subtask-classification-params: when a consumer-side contract change sweeps instruction surfaces, derive the consumer inventory from a name-based sweep of every file referencing the tool, never from the scope of the upstream sync commit. The code-review council (divisor-architect, MEDIUM) found .opencode/skills/speckit-workflow/SKILL.md and its scaffold mirror still instructing spawn-call composition without task_classification because the inventory came from replicator's 19ca1d6 sync scope plus the uf.unleash template. A stale-wording-absence grep cannot detect silent parameter omission — a file passes the sweep by never mentioning classification at all. Sweep for the tool name first, then check each hit for the contract fields.
