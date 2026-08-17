## ADDED Requirements

### Requirement: FR-001 Scope Filter Phase

The pre-flight skill MUST include a Phase 2b (Scope Filter)
between Phase 2 (Local Tool Detection) and Phase 3 (CI
Coverage Matrix). Phase 2b MUST compute the branch diff,
map each detected tool to its file-extension scope, and mark
tools with zero in-scope files as "Skipped (no in-scope files)".

#### Scenario: Go tools skipped on YAML-only branch

- **GIVEN** the branch diff contains only `*.yml` and `*.yaml`
  files
- **AND** `go.mod`, `.golangci.yml`, and `Makefile` are present
  (tools detected: go test, golangci-lint, Make)
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** `go test` is marked "Skipped (no in-scope files)"
- **AND** `golangci-lint` is marked "Skipped (no in-scope
  files)"
- **AND** `make check` is marked "In scope" (always-run)

#### Scenario: All tools in scope on mixed branch

- **GIVEN** the branch diff contains `internal/foo.go` and
  `.github/workflows/ci.yml`
- **AND** `go.mod`, `.golangci.yml`, and `.yamllint.yml` are
  present
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** `go test`, `golangci-lint`, and `yamllint` are all
  marked "In scope"

#### Scenario: Scope filter fail-open on git error

- **GIVEN** `git diff --name-only main...HEAD` fails (e.g.,
  detached HEAD, missing remote, no `main` branch)
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** all detected tools are marked "In scope" with a
  warning that includes the git error message explaining
  why the scope filter was bypassed
- **AND** execution proceeds as if no scope filter exists

#### Scenario: Empty branch diff (no commits ahead)

- **GIVEN** the branch has zero commits ahead of `main`
  (e.g., just created, or all changes reverted)
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** `git diff` returns an empty file list
- **AND** all non-always-run tools are marked "Skipped
  (no in-scope files)"
- **AND** always-run tools are marked "In scope"
- **AND** a warning is emitted: "no files changed on
  branch — scope filter has nothing to match"

### Requirement: FR-002 Tool-to-Extension Mapping

The scope filter MUST use the following tool-to-extension
mapping:

| Tool | In-scope extensions |
|------|-------------------|
| `go test` | `*.go`, `go.mod`, `go.sum` |
| `golangci-lint` | `*.go`, `go.mod`, `go.sum` |
| `ruff` | `*.py`, `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` |
| `pytest` | `*.py`, `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` |
| `yamllint` | `*.yml`, `*.yaml` |

Tools not in this table MUST default to "always run".
Always-run tools (FR-003) are intentionally excluded from this
table — they bypass the scope filter entirely.

#### Scenario: Unknown tool defaults to always-run

- **GIVEN** a tool is detected that does not appear in the
  scope mapping table (e.g., a custom linter)
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** the tool is marked "In scope" (always-run default)

### Requirement: FR-003 Always-Run Tools

The following tools MUST be designated as "always run" and
MUST NOT be skipped by the scope filter regardless of the
branch diff:

- `make check` (or `make lint`)
- `pre-commit`

#### Scenario: make check runs on YAML-only branch

- **GIVEN** the branch diff contains only `*.yaml` files
- **AND** `Makefile` is present with a `check` target
- **WHEN** Phase 2b evaluates the scope filter
- **THEN** `make check` is marked "In scope" (always run)

### Requirement: FR-004 Branch Diff Computation

The scope filter MUST compute the branch diff using:

```bash
git diff --name-only main...HEAD
```

The result MUST be a list of file paths changed on the
current branch relative to `main`.

#### Scenario: Diff captures all branch changes

- **GIVEN** the current branch has three commits adding
  `foo.go`, `bar.yaml`, and `baz.py`
- **WHEN** the scope filter computes the branch diff
- **THEN** the diff list contains `foo.go`, `bar.yaml`,
  and `baz.py`

### Requirement: FR-005 Scope-Skipped Tools Count as PASS

Tools skipped by the scope filter MUST count as PASS for
verdict computation. In the execution results table, they
MUST appear with status "SKIP (scope)" and exit code "-".
They MUST NOT count as failures, warnings, or ci-aware
skips. The distinction: the tool's *verdict contribution*
is PASS; its *display status* is "SKIP (scope)".

#### Scenario: Scope-skipped tool in execution results

- **GIVEN** `golangci-lint` is skipped by the scope filter
- **WHEN** Phase 4 (Execution) processes the tool list
- **THEN** `golangci-lint` appears in the execution results
  table with exit code "-", status "SKIP (scope)", and does
  not affect the verdict

#### Scenario: All tools scope-skipped except always-run

- **GIVEN** only `make check` is in scope (all others
  scope-skipped)
- **AND** `make check` exits with code 0
- **WHEN** the verdict is computed
- **THEN** the verdict is PASS

## MODIFIED Requirements

### Requirement: FR-006 CI Coverage Matrix (Modified)

The CI coverage matrix (Phase 3) MUST reflect scope-filtered
tools. Tools marked "Skipped (no in-scope files)" in Phase 2b
MUST appear in the matrix with "Run locally?" set to
"No (no in-scope files)".

Previously: The matrix only distinguished between CI-verified
skips and tools to run. Now it has a third skip reason.

#### Scenario: Matrix shows scope-skipped tools

- **GIVEN** `go test` is scope-skipped (no `.go` files in diff)
- **AND** `yamllint` is in scope (`.yaml` files in diff)
- **WHEN** Phase 3 builds the CI coverage matrix
- **THEN** the matrix shows:
  - `go test`: Run locally = "No (no in-scope files)"
  - `yamllint`: Run locally = "Yes"

### Requirement: FR-007 Scope Filter in Both Modes

The scope filter MUST apply in both `hard-gate` and `ci-aware`
execution policies. In both modes, tools with no in-scope files
are skipped before CI status evaluation.

Previously: `hard-gate` mode ran ALL detected tools
unconditionally. Now it runs all *in-scope* detected tools.

#### Scenario: Hard-gate mode with scope filter

- **GIVEN** the pre-flight skill runs in `hard-gate` mode
- **AND** the branch diff contains only `*.py` files
- **AND** `go.mod` and `pyproject.toml` are present
- **WHEN** Phase 2b applies the scope filter
- **THEN** `go test` is scope-skipped
- **AND** `pytest` and `ruff` are marked "In scope"
- **AND** Phase 4 runs only `pytest` and `ruff`

#### Scenario: CI-aware mode with scope filter

- **GIVEN** the pre-flight skill runs in `ci-aware` mode
- **AND** the branch diff contains only `*.py` files
- **AND** CI check for `ruff` has status PASS
- **WHEN** Phase 2b and Phase 3 evaluate
- **THEN** `go test` is scope-skipped (Phase 2b)
- **AND** `ruff` is CI-skipped (Phase 3, CI PASS)
- **AND** `pytest` is run locally (in-scope, no CI coverage)

### Requirement: FR-008 Scaffold Sync

The modified pre-flight skill MUST be synced to its scaffold
copy at `internal/scaffold/assets/opencode/skills/pre-flight/
SKILL.md`. Existing drift detection tests MUST pass after sync.

#### Scenario: Scaffold copy matches source

- **GIVEN** `.opencode/skills/pre-flight/SKILL.md` has been
  updated with the scope filter
- **WHEN** the scaffold copy is synced
- **THEN** `internal/scaffold/assets/opencode/skills/
  pre-flight/SKILL.md` matches the source
- **AND** drift detection tests pass

## REMOVED Requirements

None — this change adds a scope filter without removing any
existing capability. Tools with in-scope files are still run
exactly as before.
