---
tag: command-porting
author: jay-flowers
category: pattern
created_at: 2026-10-28T20:28:29Z
identity: command-porting-20261028T202829-jay-flowers
tier: draft
---

Porting a verified personal global command into a UF repo's command set is a repeatable five-surface pattern, verified end to end on port-uf-rebase-pr (branch opsx/port-uf-rebase-pr, 2026-10-28, originating issue #851). First, stage the source command inside the repo as git-excluded scratch input (.local-sources/ via .git/info/exclude, never a deliverable) because delegated child sessions cannot read paths outside the workspace root. Second, port following the repo's canonical command conventions — uf.review-pr.md shaped frontmatter description, protect block, session-resume guard, argument validation before any tool call, phased execution, and a guardrails section. Third, replace hand-rolled git choreography with the deterministic plugin tools (git_fetch, git_rebase, git_rebase_abort, git_push_force_with_lease) per determinism pack DE-001 rather than paraphrased bash. Fourth, mirror the command byte-identically into internal/scaffold/assets/opencode/commands/ and register it in scaffold_test.go's expectedAssetPaths so uf init deploys it and the embedded-asset drift tests stay green. Fifth, update every documentation surface in the same change — AGENTS.md command table row and Project Structure command-count bump, docs/usage.md, docs/architecture.md, and a CHANGELOG entry carrying (Spec: openspec/changes/<name>/, Fixes: #NNN) per the repo's changelog convention. Destructive-operation safety rules ride along with the port unchanged: force-push only with --force-with-lease and only to the PR head branch, fail closed on ambiguous conflict resolution, and never merge, approve, or close the PR.
