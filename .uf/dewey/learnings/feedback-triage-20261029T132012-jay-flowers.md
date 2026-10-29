---
tag: feedback-triage
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:20:12Z
identity: feedback-triage-20261029T132012-jay-flowers
tier: draft
---

When triaging reviewer feedback into a fix approach for a scaffolded command change, screen each candidate approach against the structural contract-test pins before choosing. command_contract_test.go pins exact fragments (capped at 3, iteration counter, **STOP** without pushing, checkpoint step names, Phase 6 clear_progress fragments); an approach that alters pinned behavior forces edits to the pin file and expands a frozen review scope. In the uf.fix-ci iteration-budget feedback (PR 868), the exhaustion-marker approach preserved every pin while the clear-on-exhaustion alternative did not. Recovery narratives also live in three layers that must stay aligned: design-decision prose (R4/D8), the state machine's actual clear/reset points, and the terminal-report guidance (Phase 6.1). Always verify the promised recovery is reachable through the state machine, not just stated in prose — a documented re-invoke-with-fresh-budget path dead-ended because clear_progress only ever ran on the Phase 6 success path while exhaustion STOPs persisted the capped counter.
