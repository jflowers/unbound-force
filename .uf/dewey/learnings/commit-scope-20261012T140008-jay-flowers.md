---
tag: commit-scope
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:00:08Z
identity: commit-scope-20261012T140008-jay-flowers
tier: draft
---

When reverting a previously-implemented OpenSpec change, the revert should be on its own branch with its own justification (e.g., `opsx/revert-advisor-host-model-fallback`), not bundled into an unrelated feature branch. AGENTS.md's Commit Scope rule requires files to be 'directly related to the active spec or change.' A revert that removes production code, tests, learnings, and spec artifacts is a significant change that deserves its own traceability — mixing it with a new feature makes both changes harder to review and harder to revert independently if needed.
