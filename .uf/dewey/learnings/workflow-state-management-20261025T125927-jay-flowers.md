---
tag: workflow-state-management
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:59:27Z
identity: workflow-state-management-20261025T125927-jay-flowers
tier: draft
---

Bounded fix/retry loops added to agent-command prose must persist their iteration counters in durable checkpoint state, not conversation state. Session resume starts a fresh context by design, so any resume rule that re-enters the loop on a recorded "failed" verdict silently grants a fresh budget per resume — a stated "up to N total" cap degrades to "up to N per session". In /uf.unleash, the Step 4 decision gate already checkpoints data: {"iteration": N} for its code-review cap; new bounded loops (e.g., the build/test fix loop) should mirror that pattern in their own durable records (phase checkpoint data, gate checkpoint data), have resume rules read the durable count instead of restarting at zero, pin the durability wiring in the scaffold drift tests alongside the cap strings, and keep the internal/scaffold/assets mirror byte-identical when editing the command.
