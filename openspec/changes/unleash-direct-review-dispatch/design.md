# Design: unleash-direct-review-dispatch

## Context

`/uf.unleash` orchestrates the spec-to-PR pipeline. Steps 4 (Spec
Review) and 6 (Code Review) currently delegate to a
`cobalt-crush-dev` child session that receives the entire
`uf.review-council.md` (1,145 lines) plus a mode override, then calls
the review-dispatch tools on unleash's behalf. The child is a driver,
not a reviewer: the actual reviewers are `divisor-*` agents spawned
by `dispatch_review_runs`. The handoff costs a full agent session per
review step and introduces directive drift — most concretely,
unleash Step 4's "auto-fix them" instruction for LOW/MEDIUM spec
findings contradicts the council command's CRITICAL RULE requiring
explicit human confirmation before any spec auto-fix (issue #716,
defect 2).

The review-dispatch plugin already exposes the complete dispatch
surface (`resolve_base_ref`, `plan_review_dispatch`,
`dispatch_review_runs`, `consolidate_dispatch`), and the council
command already documents the local input-resolution path. Increment
1 of issue #716 therefore needs no new tools — only a command
rewrite.

## Goals / Non-Goals

### Goals

- Steps 4 and 6 call the review-dispatch tools directly from the
  parent command; no `cobalt-crush-dev` review-driver session.
- Unleash owns an explicit fix-gate policy that resolves the
  contradiction with the council's human-confirmation rule.
- Preserve every existing guarantee: fail-closed planning, immutable
  input validation, verdict semantics, 3-iteration cap, pre-flight
  soft gate on code review, tier-specific exit guidance, checkpoint
  ceremony, byte-identical mirrors.
- Keep `uf.review-council.md` and the `review-council` spec
  unchanged — the council remains standalone (Principle II).

### Non-Goals

- New plugin tools (`uf_unleash_branch_gate`, `uf_delegate_command`,
  `uf_unleash_detect_resume`, formatters, `write_unleash_summary`,
  clarify tools, implement-step granular tools, `uf_prepare_review`)
  — Increments 2-5 of issue #716.
- Touching Steps 0-3, 5, or 7 delegation structure (Step 6 code-fix
  delegation to `cobalt-crush-dev` is retained).
- Modifying plugin code, `lib/`, Go sources, or the council command.

## Decisions

### D1: Direct-call sequence replaces delegation

Each review step inlines the council's documented protocol as exact
tool calls, in order:

1. Announce the step and resolve base ref via `resolve_base_ref`
   (no network; abort with no fallback on failure).
2. Resolve head SHA; capture the immutable diff — tracked changes
   with `git diff <base_sha> -- .`, untracked files with
   `git ls-files --others --exclude-standard`; save it to a file and
   derive `changed_files` with per-file insertion/deletion counts.
   When the branch has no commits ahead, mark the local input context
   `uncommitted: true` with null `pr_number`.
3. Discover reviewers: enumerate regular `divisor-*.md` files in
   `.opencode/agents/`, strip extensions, sort. Zero reviewers →
   fail-closed exit. Manifest policy stays delegated to
   `plan_review_dispatch`.
4. Load the `dispatch-advisor` skill, then `plan_review_dispatch`
   with mode `specs` (Step 4) or `code` (Step 6), the full discovered
   list, `full: false`, `augment: false`, raw `changed_files`. Display
   the returned plan JSON exactly. Proceed only on status `ready`,
   null `workflow_result`, empty errors; otherwise finalize the
   failed dispatch and exit.
5. `dispatch_review_runs` once with mode, command `review-council`,
   `diff_path`, `changed_files`, `input_context`, `plan_entries`,
   `session_metadata` (command, mode, full, input context, change
   profile, plan, coverage), and plan limits
   (`max_parallel_runs`, `budget_usd`, `per_run_timeout_ms`).
   Step 4 passes spec artifacts as `review_context`; Step 6 passes
   `pre_flight_results` when pre-flight ran.
6. `consolidate_dispatch` exactly once per finalization attempt —
   including plan failure and no-success paths.

Mode is set explicitly by the step (`specs` vs `code`); there is no
auto-detection. This mirrors the council's "Resolve Immutable Input
Context" and "Shared Dispatch, Evidence, and Finalization Protocol"
sections, which are themselves the specification for these tool
calls — unleash now cites the protocol instead of embedding a second
copy of it as a delegation payload.

**Constitution**: Principles I and III — the collaboration surface
shrinks to self-describing artifacts (plan JSON, findings, verdict)
already emitted by the tools; observability is unchanged because
every dispatch still flows through the same tools.

### D2: Fix-gate policy — parent-side consent gate (Option B)

On a spec-review REQUEST CHANGES with only LOW/MEDIUM findings, the
parent presents the council's exact three options via the question
tool: "Apply auto-fixes", "Review findings first", "Skip auto-fixes
— report only". On consent, the parent itself applies LOW/MEDIUM
fixes (formatting, status fields, terminology, cross-references,
obvious gaps, stale metadata — per `.opencode/uf/packs/severity.md`;
HIGH/CRITICAL are report-only), then follows the iteration
semantics in D3. On decline or a remaining REQUEST CHANGES, the
pipeline exits at spec review with tier-specific recovery guidance
(Speckit: `/speckit.clarify`; OpenSpec: update artifacts under
`openspec/changes/<name>/`). HIGH/CRITICAL findings exit immediately,
unchanged from today.

The "NEVER pause between steps" guardrail is amended to name this
gate as the single legitimate mid-pipeline human interaction.

Rejected alternatives:

- **A) Exit on any REQUEST CHANGES** — rejects trivially fixable
  findings (typos, metadata) and stalls the pipeline the council
  was designed to keep moving; too heavy for LOW/MEDIUM.
- **C) Autonomous auto-fix without consent** — mutates
  human-reviewed spec artifacts without consent, which is the exact
  practice the council's CRITICAL RULE forbids; directive drift
  would just move from the child into the parent.

Code fixes (Step 6) get no consent gate: council code mode has none,
and the fix loop stays delegated to `cobalt-crush-dev` (fix
application is content work, not review driving).

**Constitution**: Principle VI — the gate is a preserved
human-judgment decision point expressed as an exact tool call with
fixed options; everything around it stays deterministic.

### D3: Iteration semantics after fixes

After consented spec fixes (and between code-review fix rounds):
re-resolve immutable input, recompute and validate the full plan,
rerun **every** included reviewer (not only blocking personas; not
absent/content-only/skipped ones), reuse one sibling-evidence
acquisition, keep the iteration counter. Cap: 3 iterations; on the
fourth encounter the step exits with persistent findings and
recovery guidance. Checkpoints record iteration data mid-loop, as
today.

### D4: Code review keeps pre-flight Phase 1a as a soft gate

Step 6 runs pre-flight in **soft-gate** mode before dispatch:
execute all checks without stopping at the first failure, establish
the baseline (CI API first, worktree fallback), classify causality.
Branch-caused failures stop the step — each reported as a CRITICAL
finding with full output — and the dispatch finalizes fail-closed
with no child reviewers. Pre-existing failures are recorded and do
not block. Gaze (Phase 1b) remains conditional and informational;
its absence is non-blocking. This is the council's Phase 1a
semantics, executed by the parent.

### D5: Verdict mapping is owned by unleash

`consolidate_dispatch` output maps to pipeline decisions:
APPROVE / APPROVE WITH ADVISORIES → proceed (advisories recorded for
the final report); REQUEST CHANGES → D2 gate (specs) or fix loop
(code); INCONCLUSIVE / UNAVAILABLE → exit with the council's
no-success reasons. At least one successful assessment is required
for any progressing verdict. Unchanged from today's processing — the
difference is that the mapping now lives in unleash text rather than
being split across a delegation prompt and a child's judgment.

### D6: Mirrors and verification

Both `uf.unleash.md` copies (`.opencode/commands/` and
`internal/scaffold/assets/opencode/commands/`) are edited
byte-identically; existing drift tests enforce this. Verification is
`make test`, `make plugin-test`, `make lint` — no new code, so no
new coverage surface. Tasks record before/after line counts and
approximate token deltas for Steps 4, 6, and the guardrails section
as the Principle VI measurable outcome.

## Risks / Trade-offs

- **Command length may grow**: the call sequences replace
  three-line delegation blocks. Accepted: the win is runtime (one
  fewer agent session per review, no 1,145-line payload, no
  re-derivation of input context) and correctness (one policy owner).
  Later increments (formatters, `uf_prepare_review`) can shrink the
  text if needed.
- **Protocol duplication**: Steps 4/6 now prescribe the dispatch
  protocol while `uf.review-council.md` remains its own copy for
  standalone use. Mitigated: unleash cites the council's protocol
  sections as the normative reference and inlines only the call
  sequence, not the full protocol prose. Full deduplication is
  out of scope for Increment 1.
- **Consent gate adds a pause to an otherwise autonomous pipeline**:
  scoped to the single decision the council already mandates;
  guarded by the amended guardrail; cannot fire on HIGH/CRITICAL
  (immediate exit) or on approving verdicts.
- **Behavioral risk of rewriting live pipeline text**: mitigated by
  the scenario coverage in `specs/unleash/spec.md`, drift tests, and
  the plugin test suite; the review-council command itself is
  untouched.
