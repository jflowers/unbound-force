---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-28T21:44:30Z
identity: uf-unleash-20261028T214430-jay-flowers
tier: draft
---

Learnings captured inside a change are documentation of defects, not their remediation. When a change ships new .uf/dewey/learnings/ entries that describe defects in its own artifacts, treat those learnings as a checklist of known-open defects and re-verify each against the head diff before approving. Verified in PR #857 (port-uf-rebase-pr): the change shipped 11 learnings, two of which document a stale CHANGELOG-format pin in its own spec artifacts and prescribe a pre-archive fix, but the fix never shipped — the stale pins landed on the head unchanged.
