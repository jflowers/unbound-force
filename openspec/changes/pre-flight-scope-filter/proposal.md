## Why

The pre-flight skill's `hard-gate` mode unconditionally runs ALL
detected tools regardless of whether the branch diff contains files
in each tool's scope. On a YAML-only branch (e.g., CI workflow
tweaks, yamllint config), the skill still executes `go vet`,
`golangci-lint`, `go test`, and `go build` — wasting approximately
two minutes of wall-clock time and significant tokens for zero
diagnostic value.

The root cause is in Phase 3 of the pre-flight skill (CI Coverage
Matrix, hard-gate decision rules): "ALL detected and available
tools are marked 'Run locally = Yes' regardless of CI status."
There is no mechanism to intersect the tool's file scope with the
actual branch diff.

Fixes: [#434](https://github.com/unbound-force/unbound-force/issues/434)

## What Changes

Add a file-scope filter to the pre-flight skill that maps each
tool to the file extensions it operates on, computes the branch
diff (`git diff --name-only main...HEAD`), intersects the two,
and skips tools with zero matching files. Skipped-for-scope tools
are counted as PASS in the verdict. The filter applies in both
`hard-gate` and `ci-aware` modes, inserted between Phase 2 (tool
detection) and Phase 3 (CI coverage matrix).

## Capabilities

### New Capabilities
- `scope filter`: A new Phase 2b in the pre-flight skill that
  maps tools to file-extension scopes, computes the branch diff,
  and marks tools as "Skipped (no in-scope files)" when the diff
  contains zero files matching their scope

### Modified Capabilities
- Phase 3 (CI Coverage Matrix): The matrix gains a new possible
  value in the "Run locally?" column: "No (no in-scope files)"
- Phase 4 (Execution): Tools marked as scope-skipped are not
  executed; their result is recorded as PASS with reason
  "no in-scope files changed"
- Phase 5 (Result Format): The execution results table shows
  scope-skipped tools with status "SKIP (scope)"

### Removed Capabilities
- None — tools with in-scope files are still run exactly as
  before. The scope filter only eliminates provably unnecessary
  tool invocations.

## Impact

### Files Changed
- `.opencode/skills/pre-flight/SKILL.md` (add scope filter phase)
- `internal/scaffold/assets/opencode/skills/pre-flight/SKILL.md`
  (scaffold sync)

### Follow-up
- The tool-to-extension mapping is hardcoded in the skill
  instructions. If new tools are added to Phase 2, their scope
  mapping MUST also be added to the scope filter table. This is
  a documentation-level concern (not a code dependency).
- The `git diff` command hardcodes `main` as the base branch.
  Projects using a different default branch (e.g., `master`,
  `develop`) will trigger the fail-open path. A future iteration
  could auto-detect the default branch via `git symbolic-ref
  refs/remotes/origin/HEAD`.
- TypeScript/JavaScript tool mappings (e.g., `eslint` to
  `*.ts`, `*.tsx`, `*.js`, `*.jsx`) should be added when
  TypeScript tools are added to Phase 2's detection table.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instruction files only. No artifact
formats, metadata, or inter-hero exchange patterns are affected.

### II. Composability First

**Assessment**: PASS

The scope filter is an additive phase within the existing skill.
Commands that load the pre-flight skill continue to work unchanged
— they get faster execution with identical correctness guarantees.
No new dependencies are introduced.

### III. Observable Quality

**Assessment**: PASS

The scope filter adds visibility: the CI coverage matrix now shows
*why* a tool was skipped (no in-scope files vs. CI-verified vs.
tool-ran-and-passed). The filter's diff file list is logged for
auditability.

### IV. Testability

**Assessment**: PASS

The change is instruction-only (no compiled code). Behavioral
verification: run `/review-council` on a YAML-only branch and
confirm Go tools are skipped. Run on a Go-only branch and confirm
Go tools still execute. Scaffold drift tests enforce sync.

### V. Security by Default

**Assessment**: PASS

The scope filter reads branch diff output (already available in
git) and compares file extensions. No new input vectors, no
external network calls, no secrets handling. The filter is
conservative: `make check` is always-run, and unknown tools
default to always-run.
