## Why

A field audit of a complete `/uf.unleash` run (fullsend issue #8465,
2026-10-21, session ses_ea1b11ed6ffeyKq5psxlUhMEbv) measured what the
determinism refactor actually delivered: a 16-task OpenSpec change,
22 files, two review councils, zero commits, correct gate behavior
throughout -- and ~3.49M fresh input tokens, ~7.8h of model time,
3 context compactions, and one flagship tool dead for the entire
session.

The tool migrations from prior increments held their contracts
(route guards, review dispatch, task-mark idempotency, demo
rendering). Every observed defect sits at a seam the migrations
did not reach: procedures still living as prose, and tool error
contracts that misreport their own failure class.

Audit findings, ranked by cost:

1. **`uf_delegate_command` unusable all session.**
   `resolveHostModel` (.opencode/lib/agent-executor.ts:255-257)
   hard-fails when the parent assistant message carries no valid
   `variant` field. The session's provider never populates one, so
   every delegation returned HOST_MODEL_UNAVAILABLE -- classified
   `retryable: true` when the failure is deterministic. The
   command's "emit the error and STOP" contract was silently
   replaced by an undocumented native-`task` fallback; all 10
   delegations were hand-composed, and the tool's artifact
   verification and checkpointing were re-improvised per call.
2. **Post-compaction regression.** After the second compression,
   the SESSION-RESUME GUARD was not followed (template never
   re-read, `uf_unleash_detect_resume` never re-called). The
   compression summary beat the durable tasks.md checkboxes: the
   agent re-verified the ADR title, re-ran the entire green
   Phase 4 checkpoint (tripping on a stray staged 3.4MB artifact
   swept in by `git add -A`), and re-cleaned the baseline
   worktree -- ~10 wasted calls. There is no phase-level durable
   checkpoint and no never-rerun-a-green-checkpoint rule.
3. **Diff capture is still prose.** The command's git-diff
   recipe (spec and code review) missed every feature file
   because the change lived in a locally git-ignored `openspec/`
   dir; the agent improvised a Python diff builder twice.
   `resolve_base_ref` returned a base 445 commits ahead of the
   stale fork with no divergence signal; the agent correctly
   caught it by judgment.
4. **Tier routing does not validate tier tooling.** The route
   decision recorded speckit for an install that never scaffolded
   `speckit.specify.md`, producing COMMAND_FILE_READ_FAILED
   (ENOENT), a full re-route to openspec, and a checkpoint
   re-key.
5. **Planner errors lack remediation.** plan_review_dispatch
   returned INCONCLUSIVE ("no reviewer-manifest entry") because
   reviewer discovery (agents dir) and eligibility
   (.uf/reviewer-capabilities.yaml) had drifted. Fail-closed
   held, but ~15 investigation calls were spent producing a
   repair pointer the error could have carried.
6. **Mechanical work skipped its tool.** The ADR renumber task
   was executed with raw bash, skipping the repo's renumber-adr
   skill -- including the in-flight-PR-claims step that exists
   for exactly this. A human caught it. Task text for mechanical
   procedures must name their tool/script.
7. **Phase checkpoints are prose, uncached, and re-runnable.**
   Two ~40-minute clean-HEAD baseline worktrees were built
   (Phase 1, Phase 5) to classify environmental failures; the
   baseline failure-set is never carried forward.
8. **Guardrail gaps.** `format_unleash_exit` has no variant for
   tier-routing or planner failures, so the "NEVER improvise
   exit text" rule is unsatisfiable on those paths (the exit was
   hand-rolled). Command references `forge_worktree_*` names
   that differ from the registered `replicator_forge_worktree_*`.
   Two duplicate summary tools (`write_unleash_summary` /
   `persist_unleash_summary`) are both registered. TodoWrite
   dual bookkeeping was maintained at 7 of ~22 required points.

The audit also answered the temperature question: no defect was
caused by sampling randomness. Every finding has a deterministic
cause. The fix is seams, not sampling.

## What Changes

Six workstreams, in dependency order:

1. **Delegation model resolution** (.opencode/lib/agent-executor.ts):
   fall back to spawning without a variant when the parent
   assistant message carries none; classify HOST_MODEL_UNAVAILABLE
   as non-retryable when the cause is a missing variant; keep the
   STOP contract enforceable by making the primary path work.
2. **Post-compaction state anchor** (uf.unleash.md template +
   existing tools): record a durable per-phase checkpoint after
   each green phase checkpoint; replace the re-read-the-template
   guard with a cheap re-anchor rule -- after any compression,
   call `parse_tasks` + `get_progress`, trust durable records
   over compression summaries, never re-run a green phase
   checkpoint.
3. **`capture_review_diff` intent-level tool** (review-dispatch
   plugin): one call that resolves the base ref, detects
   base-ahead-of-head divergence and falls back to
   uncommitted-local mode, assembles tracked + untracked +
   git-ignored feature files, emits numstat, and saves the diff;
   extends `resolve_base_ref` with a divergence signal. Replaces
   both prose diff-capture blocks in the command.
4. **Tier tooling validation** (uf-workflow plugin,
   `uf_unleash_route_decision`): validate that the chosen tier's
   entry commands exist on disk before recording the decision;
   emit a tier-routing exit variant instead of an ENOENT loop.
5. **Planner remediation + consistency** (review-dispatch plugin):
   INCONCLUSIVE planner errors carry actionable remediation
   (which file to repair, which agents were found vs eligible);
   a discovery/eligibility drift check runs before dispatch.
6. **Exit variants and template cleanup** (uf-workflow plugin +
   uf.unleash.md): add `format_unleash_exit` variants for
   tier-routing failure and planner failure; align tool names to
   their registered forms; remove the duplicate summary tool;
   collapse TodoWrite bookkeeping to the checkpoint tool as the
   record of truth; require mechanical task descriptions to name
   their tool or script.

Fullsend-side items (out of scope here, tracked downstream):
the `.uf/reviewer-capabilities.yaml` repair (already applied
in-session), the renumber-adr pagination bug (tracked as
fullsend#3737), and the missing speckit command scaffolds
(deterministic validation in workstream 4 prevents the failure
mode without requiring the scaffolds).

## Capabilities

### New Capabilities

- `review-diff-capture`: deterministic assembly of a review diff
  (base resolution, divergence fallback, ignored-file inclusion,
  numstat, persistence) as a single tool call.

### Modified Capabilities

- `unleash`: post-compaction re-anchor rule with per-phase
  durable checkpoints; phase-checkpoint non-re-execution; tier
  tooling validation before route recording; delegation model
  resolution variant fallback with corrected retryability;
  tool-name alignment; mechanical-task tool references.
- `review-dispatch`: planner errors carry remediation and a
  discovery/eligibility drift check.

### Removed Capabilities

- None.

## Impact

- `.opencode/lib/agent-executor.ts` -- variant fallback,
  retryability correction (+ unit tests)
- `.opencode/lib/` -- shared review-diff core: base-ref resolution
  with divergence detection, consumed by both plugins
- `.opencode/plugins/uf-workflow/index.ts` -- route-decision
  tier validation, new exit variants, failure classification,
  summary-tool deduplication, `resolve_base_ref` divergence
  signal via the shared core (+ tests)
- `.opencode/plugins/review-dispatch/` -- `capture_review_diff`
  tool registration, planner error remediation, drift check
  (+ tests)
- `.opencode/commands/uf.unleash.md` -- template prose updates
  for workstreams 2 and 6
- `.opencode/test/` -- plugin test coverage for all seams
- Scaffold mirrors under `internal/scaffold/` (embedded assets)
  and their drift-detection tests, where plugin/command sources
  are embedded
- Downstream hero repos receive the fixes via `uf init` scaffold
  sync; no hero-local action required for the tool fixes

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

Failure surfacing moves from improvised prose to tool error
envelopes and tool-rendered exit text. Phase completion becomes
a durable artifact (checkpoint record) that any consumer --
including a post-compaction re-anchor -- reads without
consulting conversation state.

### II. Composability First

**Assessment**: PASS

Each workstream is independently shippable and lands in plugins
the command already depends on. No new plugin registration, no
new dependencies, no cross-hero requirement. Hero repos that
never sync still function; they simply keep the old seams.

### III. Observable Quality

**Assessment**: PASS

Planner errors become machine-actionable (remediation text,
found-vs-eligible lists). Phase checkpoints produce durable
records with provenance. The audit itself establishes the
measurable baseline (calls, tokens, wall time); workstream
acceptance criteria record deltas against it.

### IV. Testability

**Assessment**: PASS

Every tool change ships with plugin tests: variant-fallback
unit tests, divergence-guard tests, ignored-file assembly tests,
exit-variant render tests, drift-check tests. No external
services required; all tests run in `make plugin-test`.

### V. Security by Default

**Assessment**: PASS

No new dependencies. `capture_review_diff` reuses the existing
bounded-path, size-capped, symlink-refusing patterns from the
sibling-evidence tooling. No gate values change.

### VI. Deterministic Execution

**Assessment**: PASS

This change is Principle VI applied to the audit's own
findings: the two remaining prose procedures (diff capture,
phase checkpoints) become tools or durable records; tool error
contracts (retryability, remediation) become truthful; exit
rendering covers the paths where improvisation was previously
the only option.

<!-- scaffolded by uf vdev -->
