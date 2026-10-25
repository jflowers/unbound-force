---
tier: validated
compiled_at: 2026-10-25T16:30:15Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - fix-ask-user-question-tool-name-20260814T174707-jay-flowers
  - fix-ask-user-question-tool-name-20260814T174722-jay-flowers
  - resolve-base-ref-20261008T223700-jay-flowers
  - shared-library-extraction-20261012T005046-jay-flowers
  - shared-library-extraction-20261012T005343-jay-flowers
  - shared-library-extraction-20261012T140007-jay-flowers
  - shared-library-reversal-20261012T151425-jay-flowers
  - uf-workflow-checkpoint-20261012T151614-jay-flowers
  - uf-workflow-checkpoint-20261012T151622-jay-flowers
  - uf-workflow-checkpoint-20261012T151629-jay-flowers
  - uf-workflow-checkpoint-20261012T151636-jay-flowers
  - uf-workflow-plugin-20261014T184910-jay-flowers
  - artifact-contracts-20261015T123100-jay-flowers
  - tool-extraction-20261015T150720-jay-flowers
  - uf-workflow-20261015T210002-jay-flowers
  - artifact-design-20261015T234400-jay-flowers
  - artifact-contracts-20261015T234418-jay-flowers
  - uf-workflow-20261016T135617-jay-flowers
  - uf-workflow-20261016T152643-jay-flowers
  - uf-workflow-20261016T152644-jay-flowers
  - uf-workflow-20261016T162814-jay-flowers
  - uf-workflow-20261016T202424-jay-flowers
  - uf-workflow-20261017T031848-jay-flowers
  - uf-workflow-20261017T033619-jay-flowers
  - uf-workflow-20261019T153503-jay-flowers
  - uf-workflow-20261019T153514-jay-flowers
  - uf-workflow-20261019T153516-jay-flowers
  - uf-workflow-20261019T161127-jay-flowers
  - progress-state-20261020T001115-jay-flowers
  - uf-workflow-20261020T165723-jay-flowers
  - checkpointing-20261022T121654-jay-flowers
topic: uf-workflow
---

# UF Workflow

## Current State (October 2026)

### Single-Source Grammars and Value Sets

- `WORKFLOW_TIERS = ["speckit", "openspec", "quick"] as const` in
  `.opencode/lib/unleash-templates.ts` is the single source for the
  tier value set; every surface derives from it (`UnleashTier`,
  `WorkflowTier`, `ExitTierSchema`, and DetectResumeInputSchema's
  zod enum, uf-workflow/index.ts:2410) — the former hand-maintained
  fourth surface is gone. Pattern: `as const` array, unions via
  `(typeof X)[number]`, feed the const to `z.enum()`, name derived
  sites in the doc comment (`UNLEASH_EXIT_VARIANTS` is the exemplar).
- `matchTaskLine` is the single tasks.md normalization point (folds
  CRLF and indentation); `countUncheckedCheckboxes` counts only
  column-0 task lines (`match.indent === ""`) — indented checkbox
  lines are continuation detail, not tasks.
- `countClarificationMarkers` is the shared clarification-marker
  grammar: colon, bare-with-text, and bare forms all extract as
  questions; pluralized/unterminated marker-like text is ignored by
  design. It is the systemic fix for the fallback-form probe loop.

### Artifact Contracts and Cross-Plugin Modules

- Consumer-first schema reconciliation: when a change finally writes
  an artifact an existing consumer reads, derive the field set from
  the consumer's merged spec and code — issue text is intent, merged
  consumer code is contract; path compatibility is not shape
  compatibility.
- `write_unleash_summary` (uf-workflow/index.ts:4611) is the summary
  writing tool; the `persist_unleash_summary` registration is removed
  (a compatibility factory absorbs the old name). Consumer contract:
  top-level camelCase fields (`whatWasBuilt`, `howToVerify`,
  `testResults`), no envelope nesting, pinned by the
  consumer-contract test; non-empty validation plus soft-fail keep
  the artifact an optimization, not a new gate.
- Cross-plugin contracts are pinned by connecting tests: run the real
  producer against mocked `node:fs`, then serve the exact bytes and
  path to the real consumer (write_unleash_summary →
  uf_finale_pr_context, #707); mirrored fixtures cannot catch
  field-path drift. Command-content tests pin distinguishing
  parameters (`review_verdicts`, `learnings_stored`), not tool names.
- Cross-plugin filesystem/state contracts belong in `.opencode/lib/`
  shared modules pinned by drift tests. Open instance: progress
  state — uf-finale/index.ts:560 reconstructs the `.uf/progress/...`
  path rather than importing a shared module.

### Checkpoint and Progress State

- `checkpoint`/`get_progress`/`clear_progress` are factory-built with
  injected dependencies (GitExec, cwd): hermetic mkdtempSync-fixture
  tests, mocked git, real symlink fixtures for defense branches
  (symlink tests lifted branch coverage 74%→91%).
- Filesystem markers (tasks.md checkboxes, dispatch artifacts) are
  authoritative for resumability; they kept /uf.unleash compliant
  when the MCP tools failed schema plumbing — deterministic, so skip
  rather than retry.
- State is keyed by git branch at write time: a checkpoint recorded
  before a mid-workflow branch switch strands under the pre-switch
  key; re-record after the switch.
- Sharp edge: implement-phase checkpoints append `implement-phase-<N>`
  to `completed_steps` regardless of verdict; consumers must consult
  `phases[<N>].verdict` for pass/fail truth. Payload step keys are
  underscore while reconciliation matches hyphenated names.

### Resumability Ordering

- Dispatch-artifact recency is ordered by the envelope timestamp
  field (`writtenAt`, epoch-0 fallback) with filename tie-break — not
  file mtime.
- GitExec contracts (uf_unleash_detect_resume): merge-base
  --is-ancestor exit 0 = ancestor-or-equal, exit 1 (via `.status`) =
  diverged, else fail-closed RESUME_DETECT_ERROR; specs dirty check
  is porcelain over featureDir (only tasks.md excluded; untracked
  dirs DIRTY); code-mode freshness is a pure head_sha string compare.
- Fakes: `readDir` returns bare file names; state I/O tests use the
  `vi.mock("node:fs")` pattern (lstatSync ENOENT default). The
  clarify probe substring-matches "[NEEDS CLARIFICATION" — backticked
  prose in completed specs counts (fail-safe).

### Fallback Semantics

- Fork base refs resolve upstream/main → origin/main → main; fork
  `origin/main` can lag upstream by thousands of commits, making
  `git diff main...HEAD` report phantom files. The closed literal
  candidate set doubles as a command-injection invariant.
- Fallback-form markers (completely bare or colon-empty) extract the
  raw marker text as the question; resolve_clarification logs it
  verbatim into `## Clarifications`, re-matching the grammar, so
  tool-mediated resolution never terminates (`remaining` never
  reaches 0). Terminating paths: manual removal of the marker syntax
  or the human clarify exit; other forms terminate normally.
- Prose-to-tool migrations: the tool's tests are the source of truth
  (normalize_model_name's digit-guard preserves `claude-sonnet-4`);
  claim "behavior pinned to the tested tool," not "zero behavioral
  change."
- `uf_delegate_command` HOST_MODEL_UNAVAILABLE is not locally
  repairable (no model-override parameter): fall back to the task
  tool with subagent_type cobalt-crush-dev plus manual bookkeeping
  (mark_task_complete, checkpoint, format_unleash_exit
  `implement-worker-failed`); the worktree path also works.

## History

- 2026-08: AskUserQuestion→question rename across 24 files — parallelize by file group, scaffold
  assets in lockstep (TestEmbeddedAssets_MatchSource), grammar-check articles after bulk renames.
- 2026-10-08: resolve_base_ref introduced (three-level fork fallback chain, injectable GitExec).
- 2026-10-12: checkpoint plugin replaced static checklists in 4 of 6 command files; agent-executor
  shared-lib extraction (and reversal) taught revert reconciliation and design justification.
- 2026-10-14: MCP checkpoint tools failed deterministically (empty schema object → "input.replace"
  TypeError); filesystem markers kept the pipeline compliant.
- 2026-10-15: consumer-first contract lessons from #716/#707.
- 2026-10-16: grammar disagreement found — countUncheckedCheckboxes counted any-indentation boxes
  while parse_tasks treated indented lines as detail, making skip-to-retrospective unreachable
  (each tool's tests passed while disagreeing). Fixed via the shared matchTaskLine normalization
  point (column-0 counting). Connecting tests established; review-dispatch parsing flagged as a
  fail-open drift risk lacking one.
- 2026-10-17: WORKFLOW_TIERS introduced (PR 745) but initially missed the hand-maintained
  DetectResumeInputSchema z.enum — a fourth validation surface falsifying the drift-impossibility
  claim at birth (fix: grep-sweep and classify every literal). Now derived (index.ts:2410); the
  value set grew two-tier ("speckit"/"openspec") → three-tier with "quick".
- 2026-10-19: fallback-form marker log treadmill documented and pinned by a resume-suite probe
  test over a log-mention-only steady state.
- 2026-10-20/22: branch-key stranding identified; delegate-failure fallback codified;
  implement-phase verdict sharp edge documented.
- Still open: extracting the progress-state filesystem contract into `.opencode/lib/`.
