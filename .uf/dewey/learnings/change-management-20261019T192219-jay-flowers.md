---
tag: change-management
author: jay-flowers
category: gotcha
created_at: 2026-10-19T19:22:19Z
identity: change-management-20261019T192219-jay-flowers
tier: draft
---

Governance artifacts that cite a commit SHA go stale the moment the feature branch is rebased: fix-triage-issue-dispatch-docs wrote "dedicated commit 0868c22d" into CHANGELOG.md and the SC-FR-003 superseded-by annotation, then rebased onto main — the pin lockstep commit was re-picked as c3b24ca6, and every in-repo SHA citation now points at a reflog-only orphan that will not exist on the merged PR. The rollback path documented for the governance-gated pin depends on locating that commit by SHA. Recipe: at /uf.finale (or immediately after any rebase, while the branch is unpushed), grep the change's governance artifacts (CHANGELOG, spec annotations, proposal/design) for hex SHA patterns and verify each with `git rev-parse --verify <sha>^{commit}`; prefer describing lockstep commits by purpose in living documents and keeping exact SHAs in the PR body, which can still be edited.
