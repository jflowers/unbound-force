---
tag: quick-fix-push-state-catch-to-zero
author: jay-flowers
category: pattern
created_at: 2026-10-25T19:52:19Z
identity: quick-fix-push-state-catch-to-zero-20261025T195219-jay-flowers
tier: draft
---

Delegation-timeout recovery pattern (branch quick/fix-push-state-catch-to-zero, 2026-10-25): when uf_delegate_command times out at the default 10-minute limit after partial work, the recovery that works is to inspect git status to confirm partial modifications exist, then re-delegate with timeout 1800000 and an explicit instruction to complete the existing uncommitted work without restarting — the child re-orients on the working tree and finishes the job. Reverting or restarting from scratch wastes the completed portion and risks conflicting edits; the timed-out child session's partial output is recoverable state, not corruption.
