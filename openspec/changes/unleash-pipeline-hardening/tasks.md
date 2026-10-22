## 1. Delegation model resolution

- [x] 1.1 Make `resolveHostModel` variant-optional
  (.opencode/lib/agent-executor.ts): when the parent
  assistant message carries model identity but no variant
  field, resolve without a variant override instead of
  throwing; a present-but-invalid variant still fails.
  Unit tests: absent variant resolves with no override,
  valid variant propagates, invalid-with-value fails.
- [x] 1.2 Classify HOST_MODEL_UNAVAILABLE by cause
  (.opencode/plugins/uf-workflow/index.ts): structural
  resolution failures return non-retryable envelopes naming
  the remediation; only transient causes keep the retryable
  classification. Envelope tests for both classes.

## 2. Durable state and post-compaction re-anchoring

- [x] 2.1 Extend the checkpoint tool with phase-scoped
  records (.opencode/plugins/uf-workflow/index.ts): recording
  `implement-phase-<N>` carries the verdict and the
  classified failure inventory (pre-existing, environmental,
  change-caused), and `get_progress` returns them.
  Write-then-read round-trip tests.
- [x] 2.2 Replace the SESSION-RESUME GUARD template re-read
  (.opencode/commands/uf.unleash.md) with the re-anchor
  procedure: after any compression, call `parse_tasks` and
  `get_progress`; durable results are authoritative over
  compression summaries; never re-run a green phase-scoped
  checkpoint; never re-verify work products of tasks marked
  complete.
- [x] 2.3 Add phase-checkpoint recording and the
  inventory-match rule to the implement section: after each
  green phase checkpoint record `implement-phase-<N>`; a
  later failure matching a recorded classification is
  classified without building a new baseline worktree.
- [x] 2.4 Demote TodoWrite in the template to a recommended
  display aid; the checkpoint tool is the record of truth.

## 3. Review diff capture tool

- [x] 3.1 Extract the shared review-diff core
  (.opencode/lib/review-diff.ts): base-ref resolution with
  divergence detection (resolved base not an ancestor of
  HEAD), injectable git exec. `resolve_base_ref`
  (.opencode/plugins/uf-workflow/index.ts) delegates to it
  and extends its structured output with divergence fields,
  backward compatible. Unit tests: healthy base, stale-fork
  base ahead of head.
- [x] 3.2 Register `capture_review_diff`
  (.opencode/plugins/review-dispatch/): composes the shared
  core; on divergence falls back to uncommitted-local mode
  with the reason recorded; assembles tracked changes plus
  untracked and git-ignored files under the feature_dir
  parameter and excludes untracked noise outside it; emits
  numstat; persists to a bounded, traversal-safe,
  symlink-refusing path with size caps. Tests mirroring the
  spec scenarios: git-ignored feature dir included, untracked
  noise excluded, divergence fallback, healthy base.
- [x] 3.3 Replace both prose diff-capture blocks in
  .opencode/commands/uf.unleash.md (spec review and code
  review) with the `capture_review_diff` call.
- [x] 3.4 DE-007 seam verification for `capture_review_diff`:
  registration surface (tool listed with input-schema parity
  to the documented contract), documented output shape, and
  write-then-read round-trip (saved diff path readable;
  numstat counts match the saved diff).

## 4. Tier tooling validation

- [x] 4.1 Validate tier entry commands in
  `uf_unleash_route_decision`
  (.opencode/plugins/uf-workflow/index.ts): before recording,
  verify the chosen tier's entry command files exist on disk
  (speckit: `speckit.specify.md`; openspec:
  `opsx-propose.md`; quick: none required); on missing
  commands return a validation error naming the missing
  paths and the tiers whose entry commands exist, and record
  nothing. Tests: missing speckit command with openspec
  present; all commands present.
- [x] 4.2 Add tier-routing failure variants to
  `format_unleash_exit` (dirty tree after route analysis;
  missing tier entry commands) with render tests.
- [x] 4.3 Wire the tier-routing exit path in
  .opencode/commands/uf.unleash.md to the tool variant;
  remove hand-composed stop prose for covered paths.

## 5. Planner remediation and drift check

- [x] 5.1 Planner error remediation
  (.opencode/plugins/review-dispatch/): failed or
  INCONCLUSIVE plan results include the missing or invalid
  entity, the configuration file and entry to repair, and
  the discovered-versus-eligible reviewer lists. Tests:
  agent file present without a capabilities entry.
- [x] 5.2 Discovery/eligibility drift check before plan
  finalization (.opencode/plugins/review-dispatch/):
  discovered agents without eligibility data fail the plan
  with the remediation error; eligibility entries without a
  discovered agent file produce a warning in the plan
  result. Tests: drift fails closed; stale entry warns.

## 6. Exit variants and template hygiene

- [x] 6.1 Add the planner-failure exit variant to
  `format_unleash_exit` (.opencode/plugins/uf-workflow/
  index.ts) with render tests.
- [x] 6.2 Wire the planner-failure exit in
  .opencode/commands/uf.unleash.md: spec review and code
  review stop through the variant when planning fails.
- [x] 6.3 Add mechanical-task guidance to the implement
  section of .opencode/commands/uf.unleash.md: task
  delegations name the repo skill or script for mechanical
  procedures and pass the reference through to the child.
- [x] 6.4 Align template tool names to registered names in
  .opencode/commands/uf.unleash.md (e.g.
  `replicator_forge_worktree_list`,
  `replicator_forge_worktree_cleanup`) and record the
  tool-name audit.
- [x] 6.5 [P] Verify a single unleash-summary tool
  registration and repair the stale `persist_unleash_summary`
  references in .opencode/test/uf-workflow.test.ts
  (registration-list assertion and describe labels).

## 7. Scaffold sync and verification

- [x] 7.1 Update the internal/scaffold embedded mirrors for
  every changed source (.opencode/lib/agent-executor.ts,
  .opencode/lib/review-diff.ts, uf-workflow and
  review-dispatch plugins, uf.unleash.md template) and keep
  the drift-detection tests green.
- [x] 7.2 CI-parity pre-flight: `make check` (lint, test,
  build, coverage-gate) and `make plugin-test`; all green
  before any task in this change is marked complete.
- [x] 7.3 Constitution-alignment verification (each
  principle re-checked against the final diff; no gate
  values, agent settings, or review limits touched) and the
  documentation gate: CHANGELOG entry, AGENTS.md structural
  assessment, and the documentation-issue decision for
  user-facing behavior changes.

<!-- scaffolded by uf vdev -->
