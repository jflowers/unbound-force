---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:17:53Z
identity: documentation-gate-20261028T231753-jay-flowers
tier: draft
---

CHANGELOG verification-evidence figures go stale when a review fix-loop adds tests after the entry is written. The derive-per-run-timeout entry (authored at tasks 8.2/9.3) cites plugin coverage of 95.27% statements / 88.1% branches, but council fix-loop iteration 1 then added six test groups and the final post-fix-loop run measured 95.35% / 88.23%. When a change's council fix-loop runs after the CHANGELOG entry records its verification outcome, the coverage and test-count figures must be refreshed at the final verification pass — or the entry should claim floor-clearing rather than precise values — because the CHANGELOG is the permanent evidence record and tasks like 9.3 explicitly route verification outcomes into it.
