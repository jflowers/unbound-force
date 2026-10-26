---
tag: determinism
author: jay-flowers
category: decision
created_at: 2026-10-26T15:32:03Z
identity: determinism-20261026T153203-jay-flowers
tier: draft
---

When a command-rewrite spec adds mechanical verification prose — paused-exit heading recognition, [BLOCKED: <variant>] annotation, disk-handoff artifact existence checks, gh pr view --json body containment checks with gh pr edit append — while declaring runtime/plugin code changes a Non-Goal, the increment-scoped Principle VI (determinism) trade-off must be documented explicitly. Claiming "no new procedural prose is added where an executable tool path exists" while the spec itself adds prose the plugin could render violates the constitution's conflict-resolution rule (trade-offs that weaken a principle must be acknowledged, not implicit). Correct pattern: state the trade-off in the Principle VI assessment and design, and record extraction of the prose into plugin tooling as a named follow-up change — or widen the current change's scope to include the tooling work.
