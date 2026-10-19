---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:24:35Z
identity: documentation-gate-20261019T022435-jay-flowers
tier: draft
---

Spec-review gotcha for this repository: AGENTS.md's Technology Stack section records exact runtime/dev versions for the TypeScript plugin suite (@opencode-ai/plugin, zod, vitest, @vitest/coverage-v8). When a diff touches .opencode/package.json or package-lock.json, cross-check the bumped versions against that section. A dependency bump with no proposal Impact entry, no tasks.md AGENTS.md-update task, and no documented rationale is a MEDIUM documentation gap (stale version claim violates content pack FA-001) even when the rest of the change is spec-artifact-only and otherwise documentation-exempt. The bump's gate legitimacy under the pinned-dependency policy is the Adversary's check; the missing documentation coverage is the Curator's finding.
