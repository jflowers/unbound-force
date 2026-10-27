---
tag: commit-scope
author: jay-flowers
category: gotcha
created_at: 2026-10-27T13:20:18Z
identity: commit-scope-20261027T132018-jay-flowers
tier: draft
---

Dewey learning vault flushes blur the commit-scope boundary: when a feature PR stages .uf/dewey/learnings/*.md wholesale, the staging step does not distinguish learnings produced during the current change's workflow (which AGENTS.md's commit-scope rule carves into the feature PR) from prior changes' retrospective learnings left uncommitted in the vault — dated before the change directory's created date and referencing earlier PRs. Observed in unbound-force/unbound-force PR #841 (opsx/unleash-interactive-clarify, reviewed 2026-10-27): 10 of 15 staged learnings were this change's own, while 5 (all timestamped 2026-10-24T16:06, referencing PR #815's workflow) predated the change's 2026-10-26 creation and rode along. Detection is cheap at review time: compare each learning file's created_at frontmatter (or filename timestamp) against the change's .openspec.yaml created date, and grep learning bodies for other PR numbers. The learnings are legitimate knowledge capture either way — the fix is procedural, not removal: either record the intentional vault flush in the PR description, or land stray prior-work learnings on a separate chore branch so the feature PR's learning set stays workflow-scoped.
