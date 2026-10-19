---
tag: dependency-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:15:11Z
identity: dependency-management-20261019T211511-jay-flowers
tier: draft
---

Review recipe and commit-sequencing rule for manifest engines declarations justified by a transitive dependency. (1) Set-compare the declared engines range against the transitive's own declared range, read from the installed node_modules/<pkg>/package.json: a single-value floor taken from the range's minimum is a strict superset that admits rejected bands — observed on PR 761 (opsx/fix-triage-issue-dispatch-docs), where ">=22.22.2" admits Node 23.x, 24.0-24.14, and 25.x, all rejected by ini 7.0.0's "^22.22.2 || ^24.15.0 || >=26.0.0"; on the 24.x line the binding minimum is 24.15.0, so prose framing like "the ini 7 engine floor" is a category error — the constraint is a range, not a floor. (2) When one feedback item corrects the engines value and a sibling item adds the value-assertion test, the two must land as one lockstep commit: the engines value has no independent pin (MirrorsMatchCanonical enforces only canonical/mirror byte parity, so the same inaccurate value in both files passes make check), so landing the assertion first pins the wrong value and landing the value first leaves the correction unpinned. (3) The lockfile's root packages[""] entry may not record the root engines field at all — verify lock impact with npm install plus a diff rather than assuming regeneration is required. Extends dependency-management-20261019T182352 (circular self-authored floor verification) with the review-side set-comparison check, the value-plus-assertion pairing rule, and the lock-impact verification step.
