# Proposal: unleash-direct-review-dispatch

## Why

`/uf.unleash` Steps 4 (Spec Review) and 6 (Code Review) currently delegate
to `cobalt-crush-dev` via the Task tool, passing the full contents of
`uf.review-council.md` plus a mode override. The child agent is a pure
driver: it loads a 1,145-line command into a fresh session, re-derives
input context, calls the review-dispatch tools, and returns the verdict.
The actual reviewers are `divisor-*` agents spawned by
`dispatch_review_runs` — the child adds a session boundary, not a
judgment layer.

The delegation also creates a policy contradiction (issue #716, defect
2). `uf.unleash.md` Step 4 instructs the driver to "auto-fix them" on
LOW/MEDIUM spec findings, while the council command's Spec Review Mode
carries a CRITICAL RULE: never apply spec auto-fixes without explicit
human confirmation via the question tool. When unleash and the council
directive disagree, behavior is undefined.

Issue #716 audits `uf.unleash.md` for deterministic-instruction
migration and orders the work in five increments. This change is
Increment 1: it requires no new plugin tools, because the
review-dispatch plugin already exposes the full dispatch surface, and
the council command already documents the local review input-resolution
path this change reuses.

## What Changes

- **Step 4 (Spec Review) and Step 6 (Code Review)** in
  `uf.unleash.md` are rewritten to invoke the review-dispatch tools
  directly instead of delegating to `cobalt-crush-dev`:
  `resolve_base_ref` → immutable diff capture (tracked
  `git diff <base_sha>`, untracked `git ls-files --others`) →
  reviewer discovery from `.opencode/agents/divisor-*.md` →
  `plan_review_dispatch` (mode `specs` or `code`) →
  `dispatch_review_runs` (command `review-council`) →
  `consolidate_dispatch` → verdict processing owned by unleash.
- **Fix-gate policy (defect 2)**: on a spec-review REQUEST CHANGES with
  only LOW/MEDIUM findings, the parent `/uf.unleash` presents the
  council's three options (Apply auto-fixes / Review findings first /
  Skip auto-fixes) via the question tool. Only on explicit consent does
  the parent apply LOW/MEDIUM fixes, then re-resolve input, re-validate
  the plan, and rerun every included reviewer (max 3 iterations).
  HIGH/CRITICAL findings exit the pipeline unchanged. This aligns
  unleash with the council's consent rule instead of contradicting it.
- **Guardrail amendment**: the "NEVER pause between steps" guardrail is
  amended to name the spec auto-fix consent gate as the single
  legitimate mid-pipeline human interaction.
- **Code-review pre-flight** (Phase 1a) is preserved as a soft-gate run
  by the parent before dispatch; branch-caused failures stop the step
  with CRITICAL findings and fail-closed finalization.
- `cobalt-crush-dev` delegation remains for Step 6 code-fix iterations
  and is untouched in Steps 2, 3, and 5 (later increments).
- `uf.review-council.md`, the `review-council` spec, and all plugin
  code are unchanged. The council command remains standalone; unleash
  simply stops embedding it as a delegation payload.
- Both byte-identical mirrors of `uf.unleash.md` are updated together
  (`.opencode/commands/` and
  `internal/scaffold/assets/opencode/commands/`).

## Capabilities

### New

- `unleash` — `/uf.unleash` directly dispatches review councils via
  the review-dispatch tools and owns its spec auto-fix consent gate,
  iteration, and exit policy.

### Modified

- None. `review-council` and `ci` capabilities are untouched.

### Removed

- `cobalt-crush-dev` as the review-driver delegation target in
  Steps 4 and 6 of `uf.unleash.md` (delegation for code-fix
  application in Step 6 iterations is retained).

## Impact

- **Files**: `.opencode/commands/uf.unleash.md` and
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  (byte-identical pair; drift tests already enforce this).
- **No code changes**: no plugin, lib, or Go source is modified.
- **Runtime effect**: eliminates one child agent session per review
  step (a session that loaded the full council command and re-derived
  input context) and removes contradictory directives. Command
  markdown length may grow slightly; call sequences replace delegation
  text. Measurable line/token deltas are recorded during
  implementation per constitution Principle VI.
- **Out of scope** (later increments in issue #716):
  `uf_unleash_branch_gate`, `uf_delegate_command`,
  `uf_unleash_detect_resume`, checkpoint auto-recording, formatters,
  `write_unleash_summary`, clarify tools, implement-step granular
  tools, `uf_prepare_review`.
- **Docs**: CHANGELOG entry expected; user-facing command behavior
  change (review dispatch path) warrants a documentation issue per the
  documentation gate, plus the cross-repo issue in
  `unbound-force/website` required by the org constitution's
  Cross-Repo Documentation rule (see tasks 6.2-6.3).
- **Content**: blog coverage of the deterministic-instruction
  migration (issue #716) is intentionally deferred until the
  migration completes; the line/token deltas recorded per increment
  will serve as the concrete evidence at that time.

## Constitution Alignment

- **I. Autonomous Collaboration — PASS**: collaboration happens through
  self-describing artifacts (dispatch plans, findings, verdicts).
  Removing the child driver session removes a runtime coupling while
  keeping every artifact the council already emits.
- **II. Composability First — PASS**: `uf.review-council.md` remains
  standalone and unchanged; unleash consumes the same public plugin
  tools the council documents. No new mandatory dependencies.
- **III. Observable Quality — PASS**: every dispatch still flows
  through `plan_review_dispatch` / `dispatch_review_runs` /
  `consolidate_dispatch`, preserving machine-parseable plans, findings,
  run counters, and provenance. Verdict processing moves one hop closer
  to the observable surface.
- **IV. Testability — PASS (as spec)**: the change is command-markdown
  only; behavior is verified by the existing byte-identical drift
  tests plus `make plugin-test` and `make test`. No new code paths;
  coverage strategy is defined in tasks.md.
- **V. Security by Default — PASS**: no new dependencies, no input
  surfaces added. The consent gate strengthens the existing protection
  around human-reviewed spec artifacts. Reviewer dispatch remains
  manifest-gated by `plan_review_dispatch`.
- **VI. Deterministic Execution — PASS**: the dispatch call sequence,
  iteration counting, verdict mapping, and exit conditions are
  deterministic procedures now prescribed as exact tool calls in the
  parent command. The judgment (review, fix application) stays with
  the divisor agents and the human consent decision. Measurable
  before/after line and token deltas are recorded at implementation.
