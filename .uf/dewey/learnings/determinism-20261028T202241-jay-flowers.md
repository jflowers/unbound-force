---
tag: determinism
author: jay-flowers
category: pattern
created_at: 2026-10-28T20:22:41Z
identity: determinism-20261028T202241-jay-flowers
tier: draft
---

A documented DE-001 deferral in a command port scales with the scaffold: when the deferred mechanical prose (argument validation, remote-URL matching, gh existence checks) ships as a tool-owned asset under internal/scaffold/assets/, it deploys to every uf init repo, so a revisit condition written only in design.md prose ('extraction is revisited when a second command needs the same seam') has no owner and no trigger surface. Extend the established correct pattern (learning/determinism-20261026T153203: record extraction as a named follow-up change) with the fleet dimension: for scaffolded command assets, the extraction follow-up must be a tracked issue, and the proposal's Principle VI Constitution Alignment should count each prose-procedure concession explicitly rather than reading as an unqualified PASS. Verified on port-uf-rebase-pr: fetch/rebase/abort/push are delegated to plugin tools, but validation/matching/gh-checks remain prose with only an unowned revisit condition guarding the debt.
