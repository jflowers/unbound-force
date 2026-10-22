---
tag: checkpointing
author: jay-flowers
category: pattern
created_at: 2026-10-22T12:16:54Z
identity: checkpointing-20261022T121654-jay-flowers
tier: draft
---

Durable progress records that carry a verdict should gate any completion marker on that verdict. The implement-phase checkpoint appends `implement-phase-<N>` to completed_steps regardless of green/failed verdict, leaving pass/fail truth only in the phases map; step-list-only consumers would misread a failed phase as complete. Either append the step only on a green verdict, or document as an invariant that consumers must consult `phases[<N>].verdict`.
