---
tag: commit-scope
author: jay-flowers
category: pattern
created_at: 2026-10-12T14:55:16Z
identity: commit-scope-20261012T145516-jay-flowers
tier: draft
---

When a change includes both a feature addition and a revert of a prior feature, the architectural review should verify that the revert is traced to the active spec's tasks. If the revert is not mentioned in the spec's tasks.md, it constitutes a commit scope violation regardless of whether the revert is 'cleaning up' from a prior branch. Each logically independent change should be on its own branch with its own justification.
