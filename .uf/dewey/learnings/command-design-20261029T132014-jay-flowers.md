---
tag: command-design
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:20:14Z
identity: command-design-20261029T132014-jay-flowers
tier: draft
---

Every terminal exit in a checkpoint-backed command loop needs an explicit state disposition (clear, mark, or preserve). When writing or reviewing such a command, enumerate every STOP site and walk it against the state-clearing sites exactly like gate wiring — one clear site feeding three exhaustion exits is a dead end (a re-invocation recovers the exhausted counter and immediately re-stops, contradicting any fresh-budget promise). Prefer reusing the existing clear tool (clear_progress) over inventing new marker prose choreography; if continuation-with-fresh-budget semantics are genuinely required, a counter-reset checkpoint write is simpler and less error-prone than a novel marker shape that every reader and every exit path must parse correctly. Also enumerate success-terminal early exits (e.g., an early-green check): they clear state just like the completion path, or they leak a stale budget into the next invocation. Pattern observed in /uf.fix-ci iteration-budget exhaustion dead end (PR 868 feedback thread, opsx/uf-fix-ci).
