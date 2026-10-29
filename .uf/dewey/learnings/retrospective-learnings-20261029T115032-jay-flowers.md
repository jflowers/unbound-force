---
tag: retrospective-learnings
author: jay-flowers
category: gotcha
created_at: 2026-10-29T11:50:32Z
identity: retrospective-learnings-20261029T115032-jay-flowers
tier: draft
---

When a retrospective learning (tier: draft) documents a defect in artifacts still in-flight in the same PR, the learning's prescribed fix must either be applied before merge or the finding surfaced at review — committing the learning alongside the unfixed artifact ships documentation-of-the-defect as if it were remediation. Observed in opsx/uf-fix-ci (PR #868): learnings command-design-20261029T060637 (iteration-cap exhaustion dead-end), spec-review-20261029T060640 (design D3 stale baseRepository claim), and command-contract-tests-20261029T060642 (FR-002 invocation pins omitted) each name a concrete defect in the change's own artifacts with a prescribed fix, yet the artifacts carry all three unfixed. Review discipline: diff each draft learning's 'observed in' artifact references against the current diff — a learning naming an in-flight artifact is an open finding, not closed knowledge.
