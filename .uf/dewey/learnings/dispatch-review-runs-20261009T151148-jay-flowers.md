---
tag: dispatch-review-runs
author: jay-flowers
category: context
created_at: 2026-10-09T15:11:48Z
identity: dispatch-review-runs-20261009T151148-jay-flowers
tier: draft
---

The code review council for the dispatch-review-runs implementation found three MEDIUM advisories worth noting for future aggregate tool implementations: (1) DRY violation in error paths — three early-return error paths in dispatchReviewRuns construct nearly identical output objects; an errorResult helper would reduce repetition. (2) Mode-conditional schema requirements — the schema requires diff_path and changed_files as non-empty strings for all modes, but triage mode has no diff, creating a semantic mismatch between schema validation and actual usage. (3) CHANGELOG.md documentation gate — the proposal.md identified CHANGELOG as needing an entry but no entry was added during implementation. These patterns recur in aggregate tools that serve multiple command modes with different input requirements.
