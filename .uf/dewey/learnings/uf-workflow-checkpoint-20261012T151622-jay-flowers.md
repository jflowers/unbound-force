---
tag: uf-workflow-checkpoint
author: jay-flowers
category: gotcha
created_at: 2026-10-12T15:16:22Z
identity: uf-workflow-checkpoint-20261012T151622-jay-flowers
tier: draft
---

When the review council's diff is computed against upstream/main and the feature branch has zero commits ahead (all changes are working tree modifications), the reviewers see pre-existing content differences between the branch's base commit and where upstream/main currently is. This produces persistent false positive HIGH findings about "commit scope violations" and "intent drift" that cannot be fixed by code changes — there are no commits to move to another branch. The effective verdict on the actual new code may be APPROVE WITH ADVISORIES while the raw verdict is REQUEST CHANGES. In such cases, the false positive analysis (verified by `git log --oneline upstream/main..HEAD` showing zero commits) should be documented, and the code-review marker written based on the effective verdict against the new code, not the raw verdict polluted by pre-existing diff noise.
