---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:34:55Z
identity: documentation-gate-20261025T183455-jay-flowers
tier: draft
---

When closing a documentation issue as superseded by a new docs issue, diff the old issue's page list against the new issue's page list item-by-item before recording a "same pages" equivalence claim. Interim fixes may have already resolved some of the old items (making the closure safe for those), but any dropped items need an explicit disposition — carried into the new issue's page list, or noted as resolved/no-longer-applicable — otherwise the closure silently orphans scope with no open tracking issue. Observed on opsx/fix-init-speckit-sentinel (2026-10-25): #478 (which included README.md items) was closed as superseded by #827 (whose page list covers docs/architecture.md, docs/cli-reference.md, docs/usage.md, QUICKSTART.md but not README.md) under a "same pages" claim; the un-resolved README ask (mention the starter constitution in the `uf init` description) became untracked. Extends the two-gate learnings (documentation-gate-20261022T121705, documentation-gates-20261022T225014): the gates require both issues to exist AND the supersession trail to preserve the union of the tracked scope.
