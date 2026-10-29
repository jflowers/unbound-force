## Context

`/uf.fix-ci` (`openspec/changes/uf-fix-ci/`, issue #858) repairs red
PRs through a gated loop, but its three mechanical fetches ship as
raw `gh` command prose: the PR-state fetch (`gh pr view`), the
check-suite fetch (`gh pr checks`), and the failure-log fetch
(`gh run view --log-failed`). Its design D1 records this as a
deliberate, documented deviation from constitution VI — no plugin
tool covered them, and extending the plugin layer was out of that
change's scope — with issue #861 named as the extraction follow-up
and "the retirement carrier for all three raw-gh fetch deviations."

The existing `fetch_pr_review_context` tool
(`.opencode/plugins/review-dispatch/index.ts`, factory at
`createFetchPrReviewContextTool`) returns review-dispatch fields
only. This change extends that tool, adds two sibling tools to the
same plugin, and re-routes `/uf.fix-ci` through them. The
constitution alignment assessment lives in `proposal.md` (all six
principles PASS); the decisions below cite the principles they
serve.

Field validity was verified against the gh CLI (2026-10-28, issue
#861; re-verified 2026-10-29 against PR #868):
`gh pr view --json` rejects `baseRepository` as unknown while
accepting `state`, `mergeable` (string enum `MERGEABLE` /
`CONFLICTING` / `UNKNOWN`), `mergeStateStatus`, `headRepository`
(object with `nameWithOwner`), `isCrossRepository`, and `url`
(always rooted at the base repository). `gh pr checks <N> --json
name,state,bucket,link` returns buckets `pass` / `fail` / `pending`
/ `skipping` / `cancel`, states such as `SUCCESS`, `SKIPPED`,
`NEUTRAL`, and links in both `/actions/runs/<id>/job/<id>` and bare
`/runs/<id>` forms.

## Goals / Non-Goals

### Goals

- The three raw-gh fetch classes execute as tested plugin tools on
  the same intent-level path as `fetch_pr_review_context`.
- `fetch_pr_review_context` carries the five PR-repair fields so
  PR-repair eligibility (terminal state, conflicted/behind, fork
  orientation) needs no separate fetch.
- `pr_number` becomes optional with current-branch resolution, so
  `/uf.fix-ci`'s auto-detect step also routes through the tool.
- The check-suite tool derives the eligibility classification,
  collapsing uf-fix-ci's bucket-keyed routing table.
- The failure-log tool persists bounded log evidence to disk with
  the diff-persistence security properties.
- `/uf.fix-ci` (canonical + mirror) is re-routed with observable
  behavior preserved, and the uf-fix-ci deviation records are
  retired.
- Scaffold mirrors stay byte-identical; the plugin suite covers the
  new surface under the existing coverage floors.

### Non-Goals

- Changing `fetch_pr_review_context`'s existing fields,
  `input_context` shape, or degradation contract (FR-003 is
  modified additively only — no existing field changes;
  FR-006/FR-007 of the original change stand; the `ci_checks`
  sub-call keeps its non-fatal review-dispatch semantics).
- Re-routing `/uf.review-pr`, `/uf.address-feedback`, or any other
  command — they already pass explicit PR numbers and consume the
  additive fields opportunistically or not at all.
- Extracting Phase 2.0's run-id derivation, Phase 1.3's remote
  resolution, or Phase 1.4's checkout verification — separate
  accepted items in uf-fix-ci design D1's inventory, not fetch
  classes; uf-fix-ci D1 already scopes their collapse separately.
- CI re-polling (`uf_finale_ci_poll` already owns it) or any
  mutation path (gates, rebase, push are untouched).
- Modifying the vitest coverage floors or any governance gate.

## Decisions

### D1: Three tools in the review-dispatch plugin, one intent-level
path

Both new tools join `fetch_pr_review_context` in
`.opencode/plugins/review-dispatch/index.ts`, registered in
`ReviewDispatchPlugin.server()`, reusing the established helpers:
`runGhCommand` (Bun.spawn argument arrays — no shell layer, so
untrusted PR and log text cannot inject), `classifyError`, and the
`FetchContextError` shape (`error`, `code`, `message`,
`retryable`). No new plugin registration, no new dependencies.
Rationale: constitution VI and the original change's D1 — PR
context fetching already lives here; the repair fetches are the
same concern (per Principle I, the tools are self-describing
artifacts with stable JSON contracts).

### D2: Additive output fields; base_repository derived from the url

The `gh pr view` field list grows
`state,mergeable,mergeStateStatus,headRepository,url` — not
`baseRepository`, which gh rejects. `base_repository` is parsed
from the PR `url` (`https://github.com/<owner>/<repo>/pull/<N>`,
always rooted at the base repository — verified on fork PR #868,
where `headRepository` is the fork and the URL names the base). An
unparseable `url` degrades to an empty string plus a warning, the
established graceful-degradation pattern. Fork orientation derives
from comparing `head_repository` with `base_repository`, so
`isCrossRepository` need not be a separate output field.
`input_context` is untouched — `dispatch_review_runs` consumes its
exact shape. Rationale: Principle III — the derivation is grounded
in fetched data and reported with provenance rather than
re-reasoned per invocation.

### D3: pr_number optional; omitted means current-branch resolution

`FetchPrReviewContextInputSchema` makes `pr_number` optional
(`.strict()` retained). Omitted, the tool runs `gh pr view` with no
number — gh resolves the current branch's open PR — and reports the
resolved number in the output's `pr_number`. This is the carrier
for `/uf.fix-ci` Phase 1.1's auto-detect (`gh pr view --json number
--jq '.number'`), whose retirement is required to close D1's
`gh pr view` fetch class honestly. Backward compatible: every
existing caller passes `pr_number` explicitly, and schema
validation still rejects extra fields. The `pr_not_found` error
covers both "no such PR" and "no open PR for this branch" (message
names which).

### D4: Dedicated fetch_pr_checks with exit-code-tolerant parsing

The check-suite fetch is a new tool rather than an extension of
`fetch_pr_review_context`'s internal `ci_checks` sub-call, for
three reasons:

1. **Different failure semantics.** `gh pr checks` exits non-zero
   when checks fail or are pending (gh documents exit 8 for
   pending; failing checks exit non-zero) while still printing the
   authoritative JSON to stdout. The existing sub-call wraps
   `runGhCommand`, which throws on non-zero exit, and degrades
   `ci_checks` to empty with a warning — correct for review
   dispatch (checks are advisory there; the degradation is the
   reviewed FR-007 contract) but fatal-loss for PR repair, where
   checks are the primary signal. The repair path needs the
   opposite default: stdout JSON is data regardless of exit code.
2. **Different fields.** The repair path needs `bucket` (the
   eligibility key) and `link` (the Phase 2.0 run-id source); the
   review path fetches `name,state,conclusion`.
3. **Different derivations.** The tool derives `eligibility`
   (`failing` / `pending` / `passing`) from observed buckets — the
   collapse uf-fix-ci D1 promised would "ride #861's intent-level
   path."

Parsing rule: on any exit code, if stdout parses as a JSON array
the result is check-status data; unparseable stdout is a fetch
failure classified through `classifyError` regardless of exit
code — including exit 0 (gh exit codes are not a reliable
indicator of stdout parseability). Unknown bucket values classify
as `pending` with a
warning — fail-closed, so an unrecognized status never proceeds to
fixing. The decision points (STOP outcomes, gate presentation)
stay in command prose, keyed on the derived enum. Rationale:
Principle VI — mechanical parsing and routing move into the tool;
judgment stays in prose.

### D5: fetch_failed_run_logs persists bounded evidence to disk

Input: `run_id` (string, `^[0-9]+$`, required) and `repo`
(optional, `owner/repo` pattern). The tool runs `gh run view
<run_id> [--repo <repo>] --log-failed` and persists the output to
`$TMPDIR/opencode/run-<run_id>-failed-logs.txt` using the exact
FR-005 diff-persistence pattern: unlink-then-`open` with `'wx'`
flags (`O_EXCL`), `0o600` file permissions, `0o700` parent, and an
explicit `chmod` against umask interference. The output returns
`run_id`, `repo`, `log_path`, `log_bytes`, `log_lines`, and
`warnings` — the log text itself is never returned inline (a big
CI failure can be megabytes; Principle I's bounded-consumption
pattern, mirroring `diff_path`). A zero-line fetch succeeds with
`log_lines: 0` and a warning, preserving `/uf.fix-ci` Phase 2.1's
STOP-on-empty decision as command prose. A missing or expired run
returns `run_not_found` (the `pr_not_found` precedent). `--repo`
anchoring matches uf-fix-ci Phase 2.1: PR checks report their
Actions runs in the base repository (fork PRs included), and the
explicit flag removes gh's local remote-resolution ambiguity on
fork checkouts. Input validation (`^[0-9]+$`, owner/repo pattern)
is defense in depth — Bun.spawn arrays already preclude shell
injection — per Principle V's validate-before-use rule.

### D6: Re-route scope and the deviation retirement edits

The re-route covers Phase 1.0 (availability prose collapses — the
tools validate `gh` and auth and return `gh_not_found` /
`gh_auth_failed`, which the command maps to its existing STOP
messages), Phase 1.1 (auto-detect calls `fetch_pr_review_context`
without `pr_number`), Phase 1.2 (state + check fetches become the
two tool calls; the exit-code caveat and bucket-categorization
prose collapse into `eligibility`; the Record list maps from tool
fields, with `IS_FORK` derived per D2), and Phase 2.1
(`mktemp` + `gh run view` becomes `fetch_failed_run_logs`; the
untrusted-text hygiene and log-file cleanup rules are retargeted to
`log_path`). Phase 2.1 is included although the issue says "Phase
1" because the failure-log fetch is one of the three deviation
classes the uf-fix-ci proposal binds to #861; the issue's
motivation names all three ("PR state, checks, failure logs").
Phase 2.0's run-id derivation and the Phase 1.3/1.4 git
choreography remain prose — separate accepted items in uf-fix-ci
D1's inventory, not fetch classes.

Retirement edits to the completed uf-fix-ci change are bounded to
the deviation-record fragments: design D1's three-raw-gh-fetch-
classes entry gains a closed-with-reference note, and spec FR-001
(the gh-availability verification whose "before any other step"
sequencing the tools' own validation now owns), FR-002 (pinned
`gh pr view` / `gh pr checks` invocations), FR-003
(`gh run view --log-failed` pin), and FR-010 (raw-bash reservation
list) are reworded to the tool-routed mechanics with scenario
intent preserved. This follows the rebase-onto-final-wording
practice that change's Dependencies section establishes for
overlapping fragments; its proposal already threads #861 as the
retirement carrier, so no proposal edit is needed. The retirement
authorization rests on that Dependencies-section designation plus
issue #861's own ask — both verified present — not on review
markers on the completed change's tasks.md (it carries none);
this change's own review council certifies the retirement edits.

### D7: Test strategy — extend, add, share

- `fetch-pr-review-context.test.ts` extends in place: the five new
  fields (pass-through and fork orientation), `base_repository`
  derivation (parse and unparseable-url warning), omitted
  `pr_number` (current-branch resolution and `pr_not_found`), and
  schema strictness with the input absent.
- `fetch-pr-checks.test.ts` and `fetch-failed-run-logs.test.ts`
  are new suites (one file per tool, the repo convention), covering
  happy paths, the exit-code-tolerant matrix (exit 0 green, exit 8
  pending, non-zero failing, unparseable-stdout failure), the
  eligibility derivation matrix including the unknown-bucket
  fail-closed case, `--repo` spawn-argument assertions, temp-file
  permissions and `O_EXCL`, `run_not_found`, the empty-logs
  warning, and input validation (run-id and repo patterns, extra
  fields).
- The Bun.spawn mock harness (text streams, response routing,
  `setupTool`) is extracted to `.opencode/test/helpers/
  gh-spawn-mock.ts` for the new suites — the `bun-runtime.ts`
  shared-extraction precedent (default.md CS-004); the existing
  suite's local copy migrates opportunistically, not by force.
- The review-dispatch tool lists in `scratch-smoke.test.ts` and
  `plugin-integration.test.ts` (one site each) gain the two names.
- `TestCommandContracts_FixCiCommandStructure` pins move from
  raw-gh fetch assertions to tool-routed ones — asserting the
  three tool names are present and the raw `gh pr view` /
  `gh pr checks` / `gh run view --log-failed` fetch blocks are
  absent — while keeping the `gh run rerun --failed` pin (rerun
  stays prose). Registration-surface tests enumerate tools
  dynamically and need no edits.
- Coverage floors (94 percent statements, 85 percent branches) are
  governance-controlled and unchanged; the new surface must clear
  them as-is (Principle IV; gatekeeping rule — no threshold edits).

### D8: Measurable instruction-text delta

Constitution VI requires measurable deltas when instruction text
changes. The re-route collapses approximately 100 lines of
mechanical fetch prose in `uf.fix-ci.md` — the Phase 1.0
availability blocks, the Phase 1.1 auto-detect invocation, the
Phase 1.2 bash blocks with the exit-code caveat and bucket table,
and the Phase 2.1 `mktemp` + fetch block — into tool-call
instructions. The implementation records the measured before/after
line counts in the CHANGELOG entry rather than asserting an
estimate.

## Risks / Trade-offs

### R1: gh pr checks exit-code semantics vary or drift

Non-zero exits must not be misread as fetch failures (that is the
current prose's documented behavior and the tool's core parsing
rule). Mitigation: stdout JSON is authoritative on any exit code;
unparseable stdout on non-zero exit is the only failure path; tests
pin exit 0, exit 8, and non-zero-failing cases; unknown buckets
classify fail-closed as `pending` with a warning.

### R2: Optional pr_number changes the input contract

A required-to-optional change could surprise schema-sensitive
callers. Mitigation: every existing caller passes `pr_number`
explicitly (verified across the command surface); `.strict()`
still rejects extra fields; tests pin both the omitted and
explicit paths.

### R3: Editing a completed change's artifacts

Retiring uf-fix-ci's deviation records touches artifacts that
carry passed review markers. Mitigation: edits are bounded to the
deviation-record fragments (design D1 inventory entries,
FR-001/FR-002/FR-003/FR-010) sanctioned by issue #861 and
anticipated by that change's own Dependencies text; scenario
intent is preserved; this change's review council certifies the
edits.

### R4: Log volume and disk accumulation

`--log-failed` output can be large and temp files accumulate.
Mitigation: only failed steps are fetched, content stays on disk
with the path returned (never inline), files land in `$TMPDIR`
which the OS cleans, and `/uf.fix-ci` Phase 2's existing
cleanup-on-completion-and-STOP rule is retargeted to `log_path`.

### R5: Bucket vocabulary drift

gh could introduce bucket values beyond the five known ones.
Mitigation: unknown buckets classify as `pending` (fail-closed)
with a warning naming the value, so drift degrades to "wait" rather
than a silent wrong path.

### R6: The existing ci_checks sub-call still degrades on red PRs

`fetch_pr_review_context`'s internal `ci_checks` sub-call keeps its
review-dispatch semantics — on a red PR it degrades to empty with
a warning. Repair consumers must use `fetch_pr_checks` instead.
Mitigation: the tool descriptions state their lanes; the
re-routed command consumes the dedicated tool; the distinction is
recorded here and in the spec scenario for unparseable stdout.
