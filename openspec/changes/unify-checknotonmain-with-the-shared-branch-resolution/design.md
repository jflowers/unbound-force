## Context

`uf gate` evaluates phase gates for the active change. Since
the PR #582 round-3 remediation, `Run()`
(internal/gate/gate.go) resolves the change once per run
into a `runContext`: `resolveChange` detects the branch via
`detectBranch`, recovers a detached HEAD from CI refs
(`GITHUB_HEAD_REF`, then `GITHUB_REF_NAME`, validated by
`validCIRef`), maps the branch to a change directory, and
carries any branch-detection failure on
`changeResolution.BranchErr`. `report.Branch` records
`res.Branch`.

The PR #582 round-4 advisory (issue #938) noted that
`checkNotOnMain` still re-ran `git rev-parse --abbrev-ref
HEAD` itself, so the `pr` phase spawned git three times per
run (resolution, check, commit detection) and a detached CI
checkout whose recovered ref was `main` passed branch
protection while the report claimed `main` — one report,
two branches. The round-5 remediation (commit e4bb9953)
unified the runtime: `checkNotOnMain` consumes
`ctx.res.Branch`, surfaces `ctx.res.BranchErr` verbatim, and
the shared `execGit`/`gitError` helpers classify
git-unavailable (with a `uf doctor` hint), bounded-timeout,
and command-failure errors once for all callers. The `pr`
phase now spawns git twice per run (branch resolution plus
commit detection) — the floor without changing semantics,
since the two invocations fetch different data.

What did not follow the code: GATE-FR-008. The requirement
still mandates the check's own `git rev-parse` subprocess and
documents that a detached HEAD passes unconditionally. Two
test gaps remain against issue #938's acceptance criteria:
no test pins the bounded-timeout failure class, and no
Run-level test asserts `report.Branch` in the attached-`main`
and detached-literal-`HEAD` modes.

This change reconciles the spec with the merged behavior,
records the design decision behind it, and closes the test
gaps. Constitution alignment is assessed in proposal.md —
all six principles PASS; the decisions below note the
principles they touch (I, III, IV, VI most directly).

## Goals / Non-Goals

### Goals

- Amend GATE-FR-008 to the unified contract: consume the
  shared resolution, no own git spawn, classified failures,
  qualified detached-HEAD semantics (acceptance criterion
  2).
- Assert `report.Branch` agreement with the evaluated branch
  by test in every resolution mode (criterion 4).
- Pin the bounded-timeout failure class with a deterministic
  test (criterion 3).
- Keep `go test -race -count=1 ./internal/gate/...
  ./cmd/unbound-force/...` green with CI parity
  (criterion 5).
- Verify — not re-implement — the already-merged consumption
  behavior (criterion 1).

### Non-Goals

- No change to `checkNotOnMain`'s or `resolveChange`'s
  production logic: this change ratifies merged behavior.
- No new gate-command requirements and no FR renumbering;
  GATE-FR-012's resolution rules are untouched.
- Wiring `uf gate` into CI harnesses (issue #869).
- Collapsing the remaining commit-detection spawn:
  `detectCommit` fetches different data, so two spawns per
  `pr` run is the semantic floor.

## Decisions

### D1: Detached-HEAD semantics — consume the recovered CI
ref

**Decision.** `checkNotOnMain` evaluates the run's resolved
branch, including the CI-ref recovery. A detached HEAD with
no recoverable CI ref resolves to the literal `HEAD` and
passes (it is not `main`). A detached HEAD whose recovered
ref is `main` fails.

**Rationale (repository evidence).**

1. GATE-FR-012 already mandates that the resolution be
   computed once per run, shared by every check, and that
   the report's `branch` provenance reflect the branch the
   checks resolved against. A check evaluating anything
   other than the resolution contradicts FR-012 by
   construction.
2. The headless CI checkout is the command's primary
   target — FR-012's CI-ref recovery exists precisely for
   it. Branch protection that passes when the recovered ref
   is `main` (push event to main, fork PR whose head branch
   is main) fails in exactly the environment where the gate
   runs unattended.
3. The merged code already implements this (commit
   e4bb9953) with the regression test
   `TestRun_PRPhase_DetachedHead_CIRefMain_Fails`. A check
   that re-ran git itself would see only the literal `HEAD`
   and pass, so that test failing is the behavioral pin
   for criterion 1 (no second `git rev-parse` on the happy
   path).

**Rejected alternative (issue option (b)).** Keep FR-008's
unconditional detached-HEAD pass and align only the
provenance output. Either the report records `HEAD` —
contradicting FR-012's provenance mandate, since artifact
resolution used the recovered ref — or the report records
the recovered ref while the check evaluated `HEAD`, which is
the one-report-two-branches defect the advisory flagged.
Option (b) would also revert merged, regression-tested
behavior. FR-008's scenario is amended instead (criterion
2), qualifying the pass to checkouts with no recoverable CI
ref.

### D2: Failure classification via error carriage, not a
re-execution fallback

**Decision.** `detectBranch` remains the single git
invocation for branch identity; its classified error —
`errGitUnavailable` carrying the `uf doctor` hint, the
bounded-timeout message, or the not-a-repository stderr
detail — travels on `changeResolution.BranchErr`, and
`checkNotOnMain` surfaces it verbatim.

**Rationale.** The issue sketched preserving classification
by "falling back to the existing exec path only when
resolution produced no branch." The landed design reaches
the same preservation with zero fallback spawns:
classification happens once in `execGit`/`gitError` and the
error travels with the resolution every check already
consumes. One classification site, no per-check git path
(Constitution VI).

**Rejected alternative.** A check-local fallback that
re-executes git when `res.Branch` is empty. It preserves
classification but re-adds a spawn path and a second
classification site to keep in sync — the duplication the
advisory asked to collapse.

### D3: Amendment vehicle — this change's MODIFIED delta

**Decision.** The amended GATE-FR-008 lives in this change's
`specs/gate-command/spec.md` delta, not as an in-place edit
of the `uf-gate` change's spec.

**Rationale.** The `uf-gate` change's fix loop closed with
PR #582; issue #938 is its own tracked unit with its own
review trail. Cross-change MODIFIED deltas are established
practice in this repository
(`compaction-storm-detector-sums-compactio` modifies
DT-FR-002; `per-task-delegation-budgets` modifies
delegation-timeouts requirements).

**Rejected alternative.** Editing the `uf-gate` delta in
place. It blurs change provenance — the `uf-gate` change
would carry semantics its merged PR never reviewed — and
its recorded history would no longer describe its spec.

### D4: Remaining scope is test pins; production code
unchanged

**Decision.** Implementation work is confined to
`internal/gate/gate_test.go` plus documentation: (a) a
Run-level pin of the detached-literal-`HEAD` mode
(`report.Branch` records `HEAD`, not-on-main passes); (b) an
attached-`main` provenance assertion in
`TestRun_PRPhase_FailOnMain`; (c) a deterministic
timeout-class test calling `gitError` with an
already-expired context — the asserted message names the
`gitCommandTimeout` bound, and the test adds no wall-clock
wait.

**Rationale.** Auditing the merged code against issue
#938's five acceptance criteria shows criteria 1, 3
(code-level), and 4 (by construction) already satisfied;
the residual risk is undocumented semantics and unpinned
modes. Tests, not re-implementation, close that risk
(zero-waste).

**Rejected alternative.** Re-touching `checkNotOnMain` to
restate the consumption. There is no behavioral delta to
deliver; it would be churn.

## Coverage Strategy

Unit tests only, in `internal/gate/gate_test.go` (standard
library `testing`, `t.TempDir()` git fixtures, pinned CI-ref
environment variables). New coverage: a unit test for the
`gitError` timeout classification, and Run-level
integration tests for provenance agreement in the
detached-literal-`HEAD` and attached-`main` modes. Coverage
target: >= 80% for `internal/gate` (the scope-based coverage
gate's `helper` threshold); the change adds tests to an
already-covered package, so the ratchet only moves up. Run
with `go test -race -count=1 ./internal/gate/...
./cmd/unbound-force/...`.

## Risks / Trade-offs

- **Archive-order coupling.** This delta's MODIFIED
  requirement applies against GATE-FR-008's base text,
  which enters `openspec/specs/gate-command/` only when
  `uf-gate` archives. `uf-gate` MUST archive first (or in
  the same batch ahead of this change). This mirrors the
  delegation-timeouts precedent and is noted in
  proposal.md.
- **Stricter than the previously documented spec.** A
  detached CI checkout whose recovered ref is `main` now
  fails not-on-main. That is the point of the change: any
  pipeline relying on the old pass on headless main was
  bypassing branch protection. The CHANGELOG entry
  documents it.
- **Timeout test depth.** The timeout test pins the
  classification — message text naming the bound — not an
  end-to-end 10 s kill. Accepted: an end-to-end pin would
  add 10 s of wall clock to every run for the same
  information, and the exec wiring is shared with the
  paths the other classification tests already cover.
- **Test-only production surface.** Because production
  code is untouched, the change's value is contract
  ratification and regression pinning — the residual risk
  the advisory actually identified.
