---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:17:56Z
identity: documentation-20261028T231756-jay-flowers
tier: draft
---

Change-record verification figures go stale across review fix-loops. A CHANGELOG entry authored at documentation-task time (before the code-review fix loop) carries quantitative self-reports — test counts, coverage percentages — that the fix-loop's added tests silently invalidate. Observed on opsx/derive-per-run-timeout (2026-10-28): the entry recorded plugin coverage 95.27% statements / 88.1% branches and 127 dispatch-suite tests, while the post-fix-loop verification measured 95.35% / 88.23% against the same 94/85 floors. Pattern: whenever a review fix-loop adds or modifies tests, refresh every quantitative claim in the change record from the final verification run before merge — the record must describe the merged state, not an intermediate one. Reviewer technique for the same class: when a diff carries both a change record with metrics and pre-flight verification output, diff the two number sets; a mismatch almost always means the record predates the last test-adding iteration.
