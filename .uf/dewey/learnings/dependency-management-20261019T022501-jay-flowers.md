---
tag: dependency-management
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:25:01Z
identity: dependency-management-20261019T022501-jay-flowers
tier: draft
---

Exact-pinned dependencies in .opencode/package.json are governance gates, not conveniences: spec requirement SC-FR-003 (review-council-multi-model-fanout) mandates @opencode-ai/plugin 1.4.10 with verification failing on version/lock mismatch, and the constitution's Gatekeeping Integrity rule requires documented justification, rollback, and validation evidence for any pinned-dependency update — shipped on a separate branch, never mixed into a feature branch. Major-range bumps of the OpenCode plugin SDK drag transitive risks: effect beta channel, ini 7 raising the Node engine floor to ^22.22.2 (CI pins floating node-version: 22), and the existing uuid 13.0.1 override silently masking effect's declared ^14.0.0 requirement. This toolchain has broken consumers on unvalidated jumps before (council-review-action pinned opencode-ai because 1.16.0+ removed the part.text JSONL field its parser depends on). Reviewers should treat an unexplained pinned-version bump alongside unrelated work as CRITICAL and require separation, evidence, and AGENTS.md Technology Stack updates.
