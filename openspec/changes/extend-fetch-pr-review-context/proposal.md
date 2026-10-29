## Why

When `/uf.fix-ci` (#858, `openspec/changes/uf-fix-ci/`) landed, it pinned
its three mechanical fetches as raw `gh` command prose — the PR-state
fetch (`gh pr view`), the check-suite fetch (`gh pr checks`), and the
failure-log fetch (`gh run view --log-failed`) — because no existing
plugin tool covers them. That is a documented deviation from
constitution VI (Deterministic Execution), recorded in that change's
design D1 inventory and proposal Principle VI assessment.

`fetch_pr_review_context` (from the `fetch-pr-review-context` change)
returns review-dispatch fields only. It lacks `state`, `mergeable`,
`mergeStateStatus`, `headRepository`, and `baseRepository`, so it cannot
drive PR-repair eligibility (open vs CLOSED/MERGED, conflicted/behind
detection, fork-aware remote resolution), and no tool wraps the
check-suite or failure-log fetch. Issue #861 is the named extraction
follow-up bound by reference in the uf-fix-ci proposal's Dependencies
section — "the retirement carrier for all three raw-gh fetch
deviations" — and this change is its execution.

`originating_issue: 861` is set in `.openspec.yaml`.

## What Changes

1. **PR-repair fields on `fetch_pr_review_context`** (additive output):
   `state`, `mergeable`, `merge_state_status`, `head_repository`, and
   `base_repository`, passed through as `gh` returns them.
   `base_repository` derives from the PR `url` — `gh pr view --json`
   rejects `baseRepository` as an unknown field (verified 2026-10-28;
   re-verified 2026-10-29 against PR #868, whose URL is rooted at the
   base repository while `headRepository` names the fork). Fork
   orientation derives from comparing `head_repository` with
   `base_repository`.
2. **Optional `pr_number`**: when omitted, the tool resolves the
   current branch's open PR (`gh pr view` without a number) and reports
   the resolved number in `pr_number` — the carrier for `/uf.fix-ci`'s
   auto-detection step. All existing callers pass `pr_number`
   explicitly and are unaffected.
3. **New `fetch_pr_checks` tool**: the check-suite fetch
   (`gh pr checks <N> --json name,state,bucket,link`) with
   exit-code-tolerant parsing — a non-zero `gh pr checks` exit encodes
   check status (gh documents exit 8 for pending; failing checks exit
   non-zero) while its JSON stdout remains the authoritative record —
   and a derived `eligibility` classification (`failing`, `pending`,
   `passing`) that collapses uf-fix-ci's bucket-keyed eligibility
   routing.
4. **New `fetch_failed_run_logs` tool**: the failed-run log fetch
   (`gh run view <run-id> --log-failed`, anchored with
   `--repo <owner/repo>`), persisted to a `0o600` temp file with
   `O_EXCL` semantics (the diff-persistence precedent) and returned as
   a path plus byte/line counts — never inline.
5. **`/uf.fix-ci` re-route** (canonical command + scaffold mirror):
   Phase 1.0's gh availability checks collapse (the tools validate `gh`
   and auth themselves), Phase 1.1's auto-detect calls
   `fetch_pr_review_context` without `pr_number`, Phase 1.2's two raw
   fetches become `fetch_pr_review_context` + `fetch_pr_checks`, and
   Phase 2.1's `mktemp` + `gh run view` becomes `fetch_failed_run_logs`.
   Phase 2.1 is included beyond the issue's "Phase 1" phrasing because
   the failure-log fetch is one of the three deviation classes the
   uf-fix-ci proposal binds to #861 for retirement; without it the new
   log tool would be dead code. The raw-gh deviation records in the
   uf-fix-ci change are retired: design D1's fetch-class inventory
   entry and the spec FR-001 (gh-availability sequencing),
   FR-002/FR-003/FR-010 fragments that pin the raw invocations are
   updated to the tool-routed wording (the
   rebase-onto-final-wording practice that change's Dependencies
   section establishes for overlapping fragments).
6. **Dual-copy sync + tests**: the plugin canonical and scaffold
   mirror stay byte-identical; the command canonical and mirror stay
   byte-identical; the plugin suite extends
   `.opencode/test/fetch-pr-review-context.test.ts`, gains
   `fetch-pr-checks.test.ts` and `fetch-failed-run-logs.test.ts` plus a
   shared gh-spawn mock helper in `test/helpers/` (the `bun-runtime.ts`
   precedent), and the review-dispatch tool lists in
   `scratch-smoke.test.ts` and `plugin-integration.test.ts` gain the
   two new names.

Behavior is preserved: `/uf.fix-ci`'s observable flow — STOP messages,
gates, eligibility outcomes, never-merge rule — is unchanged; only the
fetch mechanics move from re-reasoned prose to tested tools.

## Capabilities

### New Capabilities
- None. The two new tools extend the existing PR-context-fetch
  capability surface in the review-dispatch plugin rather than opening
  a new capability area.

### Modified Capabilities
- `fetch-pr-review-context`: the tool's output gains the five
  PR-repair fields; `pr_number` becomes optional with current-branch
  resolution; sibling tools `fetch_pr_checks` and
  `fetch_failed_run_logs` join the same intent-level path; `/uf.fix-ci`
  fetch steps route through them.
- `fix-ci`: Phase 1 and Phase 2.1 fetch mechanics re-routed from raw
  `gh` prose to the plugin tools; the uf-fix-ci change's design D1
  deviation record and spec FR-001/FR-002/FR-003/FR-010 updated to
  the tool-routed wording.

### Removed Capabilities
- None. Every existing behavior (output fields, degradation rules,
  command STOP conditions) is preserved.

## Impact

- **Files created**:
  - `.opencode/test/fetch-pr-checks.test.ts` (new tool suite)
  - `.opencode/test/fetch-failed-run-logs.test.ts` (new tool suite)
  - `.opencode/test/helpers/gh-spawn-mock.ts` (shared Bun.spawn mock
    harness, extracted per the `bun-runtime.ts` shared-extraction
    precedent)
- **Files modified**:
  - `.opencode/plugins/review-dispatch/index.ts` (extended
    `fetch_pr_review_context`; new `fetch_pr_checks` and
    `fetch_failed_run_logs` tools; registration)
  - `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
    (byte-identical mirror)
  - `.opencode/commands/uf.fix-ci.md` (Phase 1 and 2.1 re-route)
  - `internal/scaffold/assets/opencode/commands/uf.fix-ci.md`
    (byte-identical mirror)
  - `internal/scaffold/command_contract_test.go`
    (`TestCommandContracts_FixCiCommandStructure` pins updated from
    raw-gh fetch assertions to tool-routed assertions)
  - `.opencode/test/fetch-pr-review-context.test.ts` (new fields,
    optional `pr_number`)
  - `.opencode/test/scratch-smoke.test.ts` and
    `.opencode/test/plugin-integration.test.ts` (review-dispatch tool
    lists)
  - `openspec/changes/uf-fix-ci/design.md` (D1 fetch-class entry
    retirement note)
  - `openspec/changes/uf-fix-ci/specs/fix-ci/spec.md` (FR-001,
    FR-002, FR-003, FR-010 tool-routed wording)
  - `CHANGELOG.md` (Unreleased/Added entry with spec and
    documentation footers)
- **No manifest changes**: both scaffold assets already exist and are
  listed in `expectedAssetPaths`; no new asset files ship, so
  `scaffold_test.go` counts are untouched.
- **Behavior**: additive output fields and an optional input on an
  existing tool (backward compatible; `input_context` unchanged — it is
  consumed by `dispatch_review_runs`); two new tools; `/uf.fix-ci`
  fetch mechanics re-routed with observable behavior preserved.
- **Verification**: `make plugin-test` (the 94 percent statements /
  85 percent branches floors hold unchanged — no threshold edits per
  the gatekeeping rule), `make check` (CI parity), scaffold drift and
  contract tests green, `openspec validate` zero-ERROR profile
  (known-benign warnings plus the archive-refusal INFO on the
  MODIFIED deltas).
- **Documentation gate**: user-facing capability surface changes (new
  plugin tools shipped to every uf-init consumer via the scaffold
  mirror) — a documentation issue is filed against this repo
  before PR merge, recording the tool additions, the
  behavior-preserving re-route, and the website-target resolution:
  a search-first pass over open `unbound-force/website` issues
  (`fix-ci`, `fetch_pr_checks`, `fetch_failed_run_logs`, `plugin
  tools`) consolidates on the on-point trackers
  `unbound-force/website#342` (the `/uf.fix-ci` command-reference
  docs for the command file this change rewrites) and
  `unbound-force/website#310` (plugin tool parameter behavior)
  rather than filing duplicates — the repo precedent
  (fetch-pr-review-context → repo docs #696 with no website issue;
  uf-fix-ci → repo docs #862 + `unbound-force/website#342`) —
  with `/uf.fix-ci`'s observable behavior unchanged and the
  search-first result recorded in the issue body.
- **Security**: no new dependencies; all `gh` calls use Bun.spawn
  argument arrays; `run_id` (`^[0-9]+$`) and `repo` (`owner/repo`
  pattern) validated even though spawn arrays already preclude shell
  injection (defense in depth, constitution V); log files written
  `0o600` with `O_EXCL` semantics and `0o700` parents; untrusted log
  text returned as a path with counts, never interpolated.
- **Content pipeline**: both opportunities disposed with recorded
  rationale — blog declined (internal extraction below the
  significance threshold; no new user-facing capability debuts),
  tutorial declined (no new user workflow; the command surface is
  unchanged). Dispositions recorded in the documentation issue.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The three fetches become self-describing tool artifacts with stable
JSON contracts (structured output or structured error with code and
retryability). No runtime coupling is introduced: `/uf.fix-ci` and the
review commands consume the tools through their documented contracts,
and the tools neither block on nor require any other hero. Provenance
is carried in the payloads themselves (PR number, run id, repository).

### II. Composability First

**Assessment**: PASS

Each tool is independently invocable and useful alone:
`fetch_pr_review_context` extended fields serve any PR-state consumer,
`fetch_pr_checks` any check-status consumer, `fetch_failed_run_logs`
any failure-log consumer. All three ship in the review-dispatch plugin
already bundled with the meta package — no new mandatory dependency
for `/uf.fix-ci`, and the additive output keeps every existing
consumer working unmodified.

### III. Observable Quality

**Assessment**: PASS

Every fetch returns machine-parseable JSON with provenance (PR number,
run id, repository, byte/line counts) and derived fields grounded in
fetched data (`eligibility` from observed buckets, `base_repository`
from the PR URL) rather than re-reasoned prose. Failures return
structured error codes (`run_not_found`, `timeout`, `rate_limited`)
instead of verbatim shell text, making degradation machine-triageable.

### IV. Testability

**Assessment**: PASS

The tools are testable in isolation through the established
Bun.spawn mock harness — no network, no GitHub, no external services.
Tasks extend the dedicated suite (one file per tool, plus a shared
mock helper) covering every error code, the exit-code-tolerant parsing
paths, the eligibility derivation matrix, file-permission and `O_EXCL`
semantics, and input validation. The governance-controlled coverage
floors (94 percent statements, 85 percent branches) verify the new
surface without requiring external resources.

### V. Security by Default

**Assessment**: PASS

No new dependencies. All `gh` invocations use Bun.spawn with discrete
argument arrays — untrusted PR and log text never passes through a
shell layer. Inputs are validated before use (`pr_number` bounds,
`run_id` `^[0-9]+$`, `repo` owner/repo pattern, `.strict()` schemas
rejecting extra fields). Log files are created with `O_EXCL`
semantics and `0o600` permissions under a `0o700` temp directory,
and their content is returned as a path, never inline.

### VI. Deterministic Execution

**Assessment**: PASS

This change is the principle applied: the three mechanical fetch
classes that uf-fix-ci shipped as documented prose deviations are
extracted into executable, tested tools, and the deviation records
themselves are retired. Judgment stays in prose where it belongs —
root-cause classification, gate presentation, path selection keyed on
the tool's derived `eligibility`. The task list records the measured
instruction-text delta (constitution VI's measurable-efficiency rule)
as the re-routed command prose collapses to tool-call instructions.
