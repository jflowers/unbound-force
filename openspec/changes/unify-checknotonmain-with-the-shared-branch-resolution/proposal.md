## Why

Issue #938 (epic #1060, v0.22.0 release plan, Tier 4) tracks
a MEDIUM advisory from PR #582's review council (round 4,
architect): after the round-3 remediation centralized
once-per-run change resolution in `Run()` via `runContext`
and added detached-HEAD CI-ref recovery to `resolveChange`,
`checkNotOnMain` (internal/gate/checks.go) kept its own
`git rev-parse --abbrev-ref HEAD` subprocess — kept for a
richer failure classification the best-effort path
discarded. Two sources of truth for "the current branch"
produced one report claiming two branches: on a detached
HEAD CI checkout (the default actions/checkout state) whose
recovered ref is `main` (push event to main, or a fork PR
whose head branch is main), `report.Branch` recorded `main`
while not-on-main evaluated the literal `HEAD` and passed —
the branch-protection check passing in the headless CI
environment that is the command's primary target. The `pr`
phase also spawned git three times per run.

The runtime unification landed with the PR #582 round-5
remediation (commit e4bb9953): `checkNotOnMain` now consumes
`ctx.res.Branch`, branch-detection failures travel on
`changeResolution.BranchErr` with their classified messages,
and `TestRun_PRPhase_DetachedHead_CIRefMain_Fails` pins the
recovered-`main` failure. GATE-FR-008, however, still
documents the pre-unification contract — it mandates the
check's own `git rev-parse` subprocess and states that a
detached HEAD passes unconditionally. The spec is now the
straggler, and two acceptance gaps remain against issue
#938: no test pins the bounded-timeout failure class, and no
Run-level test asserts `report.Branch` in the attached-`main`
and detached-literal-`HEAD` modes.

This change amends GATE-FR-008 to the unified contract,
records the detached-HEAD design decision (design D1), and
closes the test gaps. It does only issue #938.

## What Changes

- Amend GATE-FR-008 (PR phase checks) in the gate-command
  capability: the not-on-main check MUST consume the
  once-per-run branch resolution shared by every check
  (GATE-FR-012), including CI-ref recovery for a detached
  HEAD, and MUST NOT spawn its own git process to re-detect
  the branch; failure classification is surfaced from the
  resolution (git unavailable with a `uf doctor` hint,
  bounded-timeout message, descriptive not-a-repository
  message); the detached-HEAD pass is qualified to checkouts
  with no recoverable CI ref; a detached HEAD whose recovered
  ref is `main` fails; new scenarios cover the recovered
  `main` failure and the git timeout; `report.Branch` MUST
  record the branch the check evaluated.
- Extend `internal/gate/gate_test.go`: Run-level provenance
  pins for the attached-`main` and detached-literal-`HEAD`
  modes, and a deterministic timeout-classification test.
- Add a CHANGELOG entry and assess the documentation gate.

Production code is unchanged: the amendment ratifies the
merged behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gate-command`: GATE-FR-008 amended — not-on-main consumes
  the shared branch resolution; detached-HEAD semantics
  qualified and extended with recovered-`main` and
  git-timeout scenarios; provenance-agreement mandate added.

### Removed Capabilities

None.

## Impact

- This change's `specs/gate-command/spec.md` delta — the
  amended contract.
- `internal/gate/gate_test.go` — test pins only; no
  production change.
- `CHANGELOG.md` — Unreleased entry.
- Archive-order coupling: this delta's MODIFIED requirement
  applies against GATE-FR-008's base text, which enters
  `openspec/specs/gate-command/` only when the `uf-gate`
  change archives; `uf-gate` MUST archive first (design D3).
- Behavior note: relative to GATE-FR-008's previously
  documented text, a detached CI checkout whose recovered ref
  is `main` now fails not-on-main. Relative to the merged
  code, runtime behavior is unchanged.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The gate report remains a self-describing artifact. This
change closes the last divergence between the branch the
checks evaluated and the branch the report records, so a
consumer reading `report.Branch` alongside the not-on-main
result sees one consistent story without consulting the
producing code.

### II. Composability First

**Assessment**: PASS

No new dependencies and no new extension surface: the gate
remains standalone, and the check consumes a resolution its
own package already computes once per run.

### III. Observable Quality

**Assessment**: PASS

Provenance agreement — `report.Branch` equals the branch
not-on-main evaluated, in every resolution mode — is the
core observable this change mandates and test-pins. The JSON
artifact shape is unchanged, so existing tooling keeps
parsing it.

### IV. Testability

**Assessment**: PASS

Every amended scenario maps to a deterministic test:
`t.TempDir()` git fixtures, pinned `GITHUB_HEAD_REF` /
`GITHUB_REF_NAME`, and for the timeout class an expired
context rather than a wall-clock wait. No external services,
no shared mutable state.

### V. Security by Default

**Assessment**: PASS

No new input surface. The CI-ref path this change binds the
check to is untrusted external input already validated by
`validCIRef` (traversal, absolute paths, backslashes,
control runes — landed with e4bb9953). The amendment
tightens a protection — branch protection now holds on
headless main — it does not weaken one.

### VI. Deterministic Execution

**Assessment**: PASS

The change removes the second, redundant git subprocess:
branch resolution executes once per run in `resolveChange`
instead of being re-derived per check. No new procedural
prose is introduced.
