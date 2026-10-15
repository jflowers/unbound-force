---
tag: security-gate-delegation
author: jay-flowers
category: pattern
created_at: 2026-10-14T22:02:50Z
identity: security-gate-delegation-20261014T220250-jay-flowers
tier: draft
---

When a parent command delegates to a child agent that owns a security-relevant gate (e.g., the council's spec auto-fix consent gate), the parent's instructions must not contradict the child's gate. In the unleash-direct-review-dispatch change, the parent was instructing 'auto-fix them' while the council required human confirmation — a directive contradiction that could silently bypass a security control. The fix was to move the gate into the parent command with the same three fixed options and add a session-resume guard that invalidates stale consent. When reviewing delegation chains, trace each security gate to verify the delegating command does not override or contradict it.
