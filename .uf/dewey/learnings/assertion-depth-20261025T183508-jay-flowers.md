---
tag: assertion-depth
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:35:08Z
identity: assertion-depth-20261025T183508-jay-flowers
tier: draft
---

Negative "not invoked" guards that compare recorded commands against the exact full invocation string silently false-pass whenever the invocation contract changes and the string is not re-synced. This bit the unbound-force scaffold suite twice: fix-specify-init-invocation's task 2.2 documented that a stale exact-match check "would no longer match the new call string, causing the guard to silently false-pass even if specify was incorrectly invoked", and fix-init-speckit-sentinel had to manually re-sync the same string again when --force was added to the specify invocation. Fix: match on a stable prefix or substring (strings.HasPrefix(call, "specify init") / strings.Contains(call, "openspec init") — the latter already in use in TestInitSubTools_OpenSpecSkipped) so "was not invoked" is decoupled from "was not invoked with today's exact args"; leave the exact arg contract to the positive assertions.
