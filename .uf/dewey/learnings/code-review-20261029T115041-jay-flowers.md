---
tag: code-review
author: jay-flowers
category: pattern
created_at: 2026-10-29T11:50:41Z
identity: code-review-20261029T115041-jay-flowers
tier: draft
---

Review meta-pattern: when a PR ships its own retrospective learnings (`.uf/dewey/learnings/*.md` authored within the same change), treat them as a pre-registered gap inventory rather than noise. Cross-check each learning's 'observed in <this change>' entry against the artifacts it describes — the author has already located the known weaknesses, so the reviewer's job becomes verifying whether each self-identified gap was actually mitigated in the shipped code. Observed in PR #868 (opsx/uf-fix-ci): 3 of the Guard's 4 findings matched the PR's own learnings — spec-review-20261029T060640 flagged the design D3 baseRepository error, command-design-20261029T060637 flagged the R4 fresh-budget dead end, and command-contract-tests-20261029T060642 flagged the incomplete pin-test coverage. In each case the artifact still carried the flaw and the learning was the fastest pointer to it; the fourth finding (residual determinism deviation) was the one gap the learnings had already fully adjudicated as a documented trade-off.
