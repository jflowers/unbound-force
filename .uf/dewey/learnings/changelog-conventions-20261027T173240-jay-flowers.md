---
tag: changelog-conventions
author: jay-flowers
category: pattern
created_at: 2026-10-27T17:32:40Z
identity: changelog-conventions-20261027T173240-jay-flowers
tier: draft
---

unbound-force CHANGELOG.md entry conventions (verified 2026-10-27 on replicator-version-floor task 3.1): entries live under `## Unreleased` > `### Added` (plus Removed/Changed/Fixed) and are inserted NEWEST-FIRST directly under `### Added` (precedent commit 094507b3). Format: `- <change-name>: <summary>` with the OpenSpec change id, body wrapped <=70 chars with 2-space continuation indent, no blank line between entries, final `  (Spec: openspec/changes/<name>/)` line (add `Fixes: #NNN` only when the change has an originating issue — check .openspec.yaml). ASCII `--` for em-dashes, backticks for code. Changelog-only commits: `docs(changelog): <imperative summary>`, subject-only per 094507b3/55d2c8e6 precedent. Parallel-worktree forge subtasks own disjoint files; worker commits in its worktree and the coordinator cherry-picks — workers never touch tasks.md checkboxes.
