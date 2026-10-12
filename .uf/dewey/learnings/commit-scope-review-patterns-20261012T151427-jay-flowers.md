---
tag: commit-scope-review-patterns
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:14:27Z
identity: commit-scope-review-patterns-20261012T151427-jay-flowers
tier: draft
---

When a diff computed against upstream/main includes both a new feature and a revert of a prior feature, the Guard should evaluate each logically independent change against the Commit Scope rule separately. The fact that upstream/main moved forward and the branch has zero unique commits does NOT exempt the working tree changes from scope analysis — all changes in the working tree diff are reviewed as if they were a single commit.
