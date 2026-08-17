## Context

The pre-flight skill (`.opencode/skills/pre-flight/SKILL.md`)
runs quality tools in two modes: `hard-gate` (run all, stop on
failure) and `ci-aware` (skip CI-verified tools). Both modes
determine which tools to run based solely on tool availability
(config file present + binary in PATH). Neither mode considers
whether the branch diff actually contains files relevant to each
tool.

This causes unnecessary work: on a YAML-only branch, Go tools
(`go vet`, `go build`, `go test`, `golangci-lint`) still execute,
consuming ~2 minutes and significant tokens. The tools find
nothing because no Go files changed.

See proposal.md for motivation and constitution alignment.

## Goals / Non-Goals

### Goals
- Skip tools whose file scope has zero intersection with the
  branch diff
- Preserve full tool execution when in-scope files exist
- Count scope-skipped tools as PASS (not as failures or warnings)
- Make the skip decision visible in the CI coverage matrix
- Support an "always run" designation for tools like `make check`
  that aggregate multiple concerns
- Apply the scope filter in both `hard-gate` and `ci-aware` modes

### Non-Goals
- Changing which tools are detected (Phase 2 is unchanged)
- Adding new tools or file extensions beyond issue #434's list
- Path-based filtering (e.g., only run Go tools on `internal/`)
  — extension-based is sufficient and simpler
- Runtime configuration of scope mappings — the mapping is
  hardcoded in the skill instructions

## Decisions

### D1: New Phase 2b between detection and CI matrix

The scope filter is a new phase (Phase 2b: Scope Filter) inserted
between Phase 2 (Local Tool Detection) and Phase 3 (CI Coverage
Matrix). This placement ensures:

1. Tool detection (Phase 2) completes first — we need the full
   tool list
2. The scope filter reduces the tool list before the CI matrix
   is built — fewer rows, cleaner output
3. Phase 3 and Phase 4 see only in-scope tools (plus always-run
   tools)

**Rationale**: Inserting a phase rather than modifying Phase 2
keeps detection and filtering as separate concerns. Phase 2 asks
"what tools exist?" Phase 2b asks "which of those tools are
relevant to this branch?"

### D2: Extension-based scope mapping table

The scope filter uses a static mapping from tool to file
extensions:

| Tool | In-scope extensions |
|------|-------------------|
| `go test` | `*.go`, `go.mod`, `go.sum` |
| `golangci-lint` | `*.go`, `go.mod`, `go.sum` |
| `ruff` | `*.py`, `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` |
| `pytest` | `*.py`, `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` |
| `yamllint` | `*.yml`, `*.yaml` |
| `make check` | (always run) |
| `pre-commit` | (always run) |

`go vet` and `go build` are omitted — they are not detected as
standalone tools by Phase 2 (they run through `make check` or CI
workflows). If Phase 2 is later extended to detect them, scope
mapping rows MUST be added here.

Tools not in this table default to "always run" — this is the
conservative choice that prevents false skips.

**Rationale**: Extension matching is simple, deterministic, and
covers the common case. Path-based filtering (e.g., "only run
Go tools if files under `internal/` changed") adds complexity
with marginal benefit — if a `.go` file changed anywhere, the
Go tools should run.

### D3: Branch diff via git

The scope filter computes the branch diff using:

```bash
git diff --name-only main...HEAD
```

This produces the list of files changed on the current branch
relative to main. If the command fails (e.g., detached HEAD,
no `main` branch), the scope filter is bypassed and all tools
are marked as in-scope (fail-open behavior).

**Rationale**: `main...HEAD` captures the complete branch diff,
not just staged/unstaged changes. This matches the CI perspective:
CI runs tools against the full PR diff, not incremental commits.

### D4: Scope-skipped tools count as PASS

When a tool is skipped because no in-scope files changed, it is
recorded as PASS with reason "no in-scope files changed" in the
execution results. It does NOT count as a skip in the ci-aware
sense (which means "CI already verified").

**Rationale**: A tool that has nothing to check cannot fail. The
scope filter is a correctness-preserving optimization, not a
risk-acceptance decision. Counting as PASS ensures the verdict
is not affected.

### D5: Always-run tools bypass the scope filter

`make check` (or `make lint`) and `pre-commit` are marked as
"always run" because they aggregate multiple concerns that may not
map cleanly to file extensions. For example, `make check` may run
formatters, linters, and tests across multiple languages.

**Rationale**: These meta-tools are the project's "run everything"
commands. Skipping them based on extension matching could miss
cross-concern checks (e.g., a Makefile target that validates YAML
schemas using Go code).

### D6: Diff file list is logged for auditability

Phase 2b outputs the list of changed files and the scope match
result for each tool. This makes the skip decision visible and
debuggable.

**Rationale**: Aligns with Observable Quality — if a tool is
unexpectedly skipped, the log shows exactly which files were in
the diff and why the tool's scope didn't match.

## Coverage Strategy

This change modifies instruction files, not compiled code.
Traditional unit test coverage is not applicable. The coverage
strategy is:

1. **Automated (scaffold sync)**: Existing `TestEmbeddedAssets_
   MatchSource` drift detection test verifies that
   `.opencode/skills/pre-flight/SKILL.md` and its scaffold copy
   remain in sync. Covers FR-008.
2. **Automated (CI parity)**: `make check` — build, lint, and
   test pass. Covers structural correctness.
3. **Behavioral (manual)**: Run the pre-flight skill on a
   YAML-only branch and confirm Go tools show "SKIP (scope)".
   Run on a Go-only branch and confirm Go tools execute.
   Covers FR-001, FR-005, FR-007.

## Risks / Trade-offs

### R1: False negatives from extension-only matching

A change to `go.mod` could affect test behavior even if no `.go`
files changed. The current mapping includes `go.mod` and `go.sum`
in the Go tool scope, which mitigates this for the Go ecosystem.
Python dependency/config files (`pyproject.toml`, `setup.py`,
`setup.cfg`, `requirements*.txt`) are now included in the `ruff`
and `pytest` scope to maintain parity with the Go ecosystem.

**Mitigation**: The mapping is conservative — dependency/config
files are included for both Go (`go.mod`, `go.sum`) and Python
(`pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt`).
`make check` is always-run, providing a catch-all. Unknown tools
default to always-run.

### R2: Stale diff on long-lived branches

If the branch is far behind `main`, the diff may include files
that have since been modified on `main`. This could cause tools
to run unnecessarily (false positives) but never to skip
incorrectly (false negatives).

**Mitigation**: False positives are harmless — the tool runs and
finds nothing. The scope filter optimizes the common case
(short-lived feature branches).

### R3: Fail-open on git errors

If `git diff --name-only main...HEAD` fails, all tools are marked
as in-scope. This means a git configuration issue silently
disables the optimization.

**Mitigation**: The fail-open output includes a warning explaining
why the scope filter was bypassed. This is preferable to
fail-closed (which would skip all tools on git errors).
