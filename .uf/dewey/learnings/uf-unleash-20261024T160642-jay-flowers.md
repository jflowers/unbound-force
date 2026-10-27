---
tag: uf-unleash
author: jay-flowers
category: pattern
created_at: 2026-10-24T16:06:42Z
identity: uf-unleash-20261024T160642-jay-flowers
tier: draft
---

Bounded retry loops specified in agent-command prose need durable iteration state. The /uf.unleash spec-review decision gate checkpoints its iteration counter (data: {"iteration": N}) so its 3-iteration cap survives session resumes; the build/test fix loop added in PR #815 keeps its counter in conversation state only ("keep the iteration counter"), so each resumed session re-enters with a fresh 3-iteration budget and the advertised "exits after 3 iterations" guarantee holds per session only. When adding a retry loop to command prose, record the iteration count in checkpoint data at each iteration and define resume semantics against the remaining budget.
