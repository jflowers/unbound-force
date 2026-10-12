---
tag: commit-scope-review
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:14:23Z
identity: commit-scope-review-20261012T151423-jay-flowers
tier: draft
---

When a feature branch bundles a revert of a prior feature alongside a new feature, the architectural review should evaluate whether the revert's scope is traced to the active spec. If the active spec (e.g., uf-workflow-checkpoint) does not mention the revert (e.g., advisor-host-model-fallback removal), the revert constitutes a commit scope violation regardless of whether the changes are functionally related. Each logically independent change should be on its own branch with its own spec justification.
