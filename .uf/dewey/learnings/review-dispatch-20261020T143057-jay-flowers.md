---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T14:30:57Z
identity: review-dispatch-20261020T143057-jay-flowers
tier: draft
---

When a shared execution core is extracted from a function whose persistence is best-effort (swallowed writeFile catch), and a new caller's success semantics depend on the persisted file rather than the in-memory result, the new caller must either: (1) verify persistence independently (stat/read-back of the replacement path), or (2) the core must expose a persistence-success signal. The runData !== null contract point correctly distinguishes pre-execution exits from post-execution outcomes, but it conflates record-in-memory with record-on-disk. For archive-then-replace recovery flows, a silent write failure after the archive rename is the worst case: the prior file is invisible to the active-file glob, the replacement never landed, and the operator is told recovery succeeded. The fix is to treat a failed replacement write like the throw path (restore the archived prior file + error outcome). This pattern applies to any shared core whose callers have different authority models for the same swallowed-error site.
