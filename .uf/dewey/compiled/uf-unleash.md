---
tier: validated
compiled_at: 2026-10-25T16:30:35Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - run-plan-command-20260930T124153-jay-flowers
  - opsx-run-plan-command-20260930T124156-jay-flowers
  - uf-unleash-20261006T004544-jay-flowers
  - workflow-tier-guidance-20261012T140009-jay-flowers
  - workflow-tier-guidance-20261012T145517-jay-flowers
  - workflow-tier-simplification-20261012T151430-jay-flowers
  - uf-unleash-20261014T151916-jay-flowers
  - uf-unleash-20261015T164723-jay-flowers
  - uf-unleash-20261015T211805-jay-flowers
  - delegation-migration-20261017T123529-jay-flowers
  - task-planning-20261017T222143-jay-flowers
  - uf-unleash-20261017T234913-jay-flowers
  - opsxrouter-pattern-codification-2026-10-19-uf-unleash-20261019T212027-jay-flowers
  - unleash-pipeline-20261020T001109-jay-flowers
  - tier-routing-20261020T001118-jay-flowers
  - unleash-pipeline-20261020T114924-jay-flowers
  - unleash-pipeline-20261020T125036-jay-flowers
  - unleash-pipeline-20261020T172446-jay-flowers
  - unleash-pipeline-20261020T195858-jay-flowers
  - tier-routing-20261020T195906-jay-flowers
  - uf-unleash-20261022T192921-jay-flowers
  - uf-unleash-20261022T225004-jay-flowers
  - uf-unleash-20261023T145647-jay-flowers
  - uf-unleash-20261023T145701-jay-flowers
topic: uf-unleash
---

# UF Unleash

Compiled 2026-10-25 from 24 learnings (2026-09-30 to 2026-10-23) and the Oct 25
audit of .opencode/commands/uf.unleash.md (1,612 lines).

## Current State (October 2026)

### Pipeline Structure

- Sections 0/1/1a/2 + Steps 1-8 (retrospective = Step 7, demo = Step 8); the old
  10-step structure is gone. Exactly 2 CHECKPOINT: Call occurrences remain —
  indented iteration-data blockquotes inside the REQUEST CHANGES fix-loop.
- Speckit/openspec entry commands and implement run via delegation.
  /opsx-propose never commits: /uf.finale must commit the untracked
  openspec/changes/<name>/ artifacts alongside the implementation edit.
- Scaffold twins: mirror .opencode/commands/uf.<name>.md byte-identical to
  internal/scaffold/assets/opencode/commands/, register in expectedAssetPaths
  (alphabetical), bump the asset-comment and TestRunInit_FreshDir file counts;
  drop stray internal/scaffold/AGENTS.md.
- Contract hygiene: a command delegating a procedure to a skill must not restate
  its tool-call shapes and failure codes — else the contract lives in four
  synchronized copies (command, skill, both mirrors). Prose wiring a tool must
  enumerate every failure code its tests assert (ISSUE_RESOLVE_FAILED/_ERROR).
- Step 1 gate: check-prerequisites.sh has no --require-spec and always requires
  plan.md; validate spec.md directly on fresh Speckit branches.
- [P] markers must audit shared evidence destinations: tasks appending to the
  same change-record file must be serialized or given distinct output files
  merged by a follow-up task.

### Tier Routing & Risk Floors

- Three tiers (speckit / openspec / quick), landed Oct 19-20. Quick routes to
  quick/<name>, created and switched by uf_unleash_route_decision;
  speckit/openspec branches are created afterward by the delegated entry
  command. Issue references resolve via gh (uf_unleash_resolve_issue).
- Risk floors: security-sensitive, auth, data-loss, and public-API-breaking
  changes never route to quick. MUST floors are enforced in the deterministic
  tool (risk_signals + table-driven tests), not in prose CI cannot fail.
- Governance alignment: a bypass's floors must subsume every class the mandate
  list requires ceremony for (agent, CI, data-model, signature-changing
  refactor, multi-function test changes), or the list must be amended in the
  same change (PR #784; divisor-guard MEDIUM).
- Branch-key hazard: uf_unleash_route_decision checkpoints the route decision
  (incl. issue_number) on the pre-routing branch; on speckit/openspec handoffs
  it lands under the old key where the branch-scoped /uf.finale never finds it
  (fails closed, linkage dropped). Write after the switch or key explicitly.

### Review Gates & Consent

- Review is consent-gated: every REQUEST CHANGES finding requires an explicit
  per-finding human choice; HIGH/CRITICAL are never auto-fixed. Autonomy
  survives only in the code-review fix loop. Spec Review carries a per-finding
  MANDATORY GATE (issue #777).
- Mid-step gates are bypassed by resume-from-step routing when an earlier
  auto-checkpoint marks the step done: every MUST-execute gate needs its own
  resumability step or durable completion record consulted by
  uf_unleash_detect_resume (quick-tier pre-flight gate).
- One-iteration fix-loop shape: pass all findings verbatim in ONE prompt-only
  uf_delegate_command to cobalt-crush-dev with the twin-sync obligation and
  fresh soft gate (make check) before re-dispatch, then re-dispatch every
  included reviewer with fresh pre-flight results; deferrable findings may be
  accepted as advisories.

### Dispatch & Resumability

- Direct dispatch: dispatch_review_runs is called exactly once per review — no
  child driver session (the 1,145-line council payload driver was eliminated Oct
  14, commit 877d5e7); consolidate_dispatch finalizes verdicts.
- uf_unleash_detect_resume is authoritative: envelope writtenAt ordering;
  dispatch artifacts beat checkpoint claims, and filesystem state alone (all
  tasks [x], tests green) overstates completeness. A review step is complete
  only when a passing current-branch artifact exists at or after the implemented
  head commit (recorded head_sha vs HEAD).
- Override gap: human resolutions recorded as overrides do not mark spec review
  complete — resume re-runs it and fresh findings must be reconciled against
  durable override records (no spec-defined matching key); such gates need
  explicit resume semantics.
- Stale-fork recovery (capture_review_diff base no longer an ancestor of HEAD;
  committed tree yields an empty fallback diff): fetch upstream; inspect gaps
  (git log HEAD..upstream/main); intersect changed files (comm -12 of both diff
  --name-only lists); merge upstream/main (merge, not rebase, when pushed);
  re-capture the diff; re-run make check on the merged tree.
- Verification-only phases: prove the tree byte-identical to the prior
  green-checkpoint state and reuse that make check evidence (explicit basis
  note) instead of re-running the suite.

### Delegation & Fallbacks

- uf_delegate_command delegates prompt-only to cobalt-crush-dev for
  speckit/openspec entry commands and implement; keep prompts self-contained and
  verify the expected artifact afterward.
- Known break: HOST_MODEL_UNAVAILABLE ("current assistant active variant is
  unavailable or invalid", retryable=true) never self-heals in-session; bounded
  retries do not clear it. Fallback: the task tool with subagent_type
  cobalt-crush-dev and the same self-contained prompt (context, files,
  constraints, verification, do-not-commit).
- Degraded convenience tools never gate completion: with delegation or the
  checkpoint tool broken, persisted artifacts (dispatch artifacts, feature-dir
  spec files, tasks.md checkboxes) plus idempotent clear_progress are
  authoritative; invoke_agent/dispatch kept working for divisor-* reviewers.
- Migration completeness: when a spec mandates migrating N call sites, enumerate
  them in tasks and verify with a negative grep for the legacy mechanism ("via
  the Task tool") — PR #745's fix-loop call site survived three review rounds.
- Worktree parallelism: workers in separate git worktrees cut from the branch
  point, each with an exclusive comms reservation on its target file, committing
  only that file; parent cherry-picks via replicator_forge_worktree_merge and
  scans residue with scan_conflict_markers (git diff --diff-filter=U cannot see
  markers after a cherry-pick completes).

## History

- Sep 30 (10-step era): OpenSpec mode skipped clarify/plan/tasks (owned by
  /opsx-propose); resume checked tasks.md markers; code review preceded
  retrospective.
- Oct 6: deterministic dispatch (plan_review_dispatch, parallel invoke_agent,
  consolidation) replaced LLM-orchestrated councils, whose intermediary driver
  burned context through the Task tool boundary.
- Oct 12 (two-tier era): WORKFLOW_TIER branching existed because tiers have
  different artifact locations (specs/NNN-*/ vs openspec/changes/*/); partially
  hardcoding /speckit.clarify silently regressed OpenSpec users.
- Oct 14 (determinism codification): dispatch artifacts proved durable when
  checkpoints broke — a spec review had exited REQUEST CHANGES (7 HIGH) with no
  confirming re-run while the filesystem looked complete. The 1,145-line council
  payload driver was eliminated (commit 877d5e7) for exactly-once
  dispatch_review_runs + consolidate_dispatch.
- Oct 15-17 (ceremony removal + delegation migration, PR #745): content
  descriptions plus tasks.md verbatim text are authoritative over prompt line
  numbers — indented iteration-data blockquotes are checkpoints, unindented
  "proceed" ones are transitions; the demo's clear_progress call was kept while
  its CHECKPOINT sentence was removed.
- Oct 19-20 (three-tier routing, PR #784): quick tier with risk floors, gh-based
  issue resolution, branch-keyed route checkpoints; floor enforcement moved from
  prose MUSTs into the tool.
- Oct 22-23 (per-finding consent, issue #777): every finding became an explicit
  human choice; the override-vs-verdict-artifact resume gap surfaced;
  worktree-parallel doc orchestration, stale-fork recovery, and the
  one-iteration fix-loop shape all proven in practice.
- Trajectory: 10-step autonomous -> 8-step consent-gated; invoke_agent fan-out
  -> exactly-once dispatch_review_runs; two-tier -> three-tier with risk floors;
  driver session -> direct dispatch.
