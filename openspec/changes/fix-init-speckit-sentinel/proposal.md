## Why

Since commit ca57106 (2026-08-13, "fix(scaffold): embed starter
constitution in uf init"), a fresh non-force `uf init` never runs
`specify init`. The embedded starter constitution is written at
`.specify/memory/constitution.md` during the asset walk, and the
walk completes before `initSubTools()` runs (walk ends at
scaffold.go:315; delegation starts at scaffold.go:376). The
specify delegation's sentinel is the bare `.specify` directory
(simpleTools table, scaffold.go:1852), so `initSimpleTool` sees
the sentinel, returns nil silently (scaffold.go:1976-1978), and
the delegation is skipped on every fresh run.

The consequence is a half-installed Speckit framework. Empirical
reproduction (binary built from current source) shows a fresh
`uf init` produces `.specify/` containing only `memory/` — no
`templates/`, `scripts/`, or `workflows/` — and `.opencode/commands/`
is missing the five upstream speckit commands (speckit.specify.md,
speckit.plan.md, speckit.tasks.md, speckit.implement.md,
speckit.constitution.md) that only `specify init` provides. The
invocation contract fixed by the fix-specify-init-invocation
change (`--here --integration opencode --offline`) is dead code
on the fresh-init path. The skip is invisible: no summary line,
no warning.

The prior change intended coexistence — its proposal states "The
`specify init` call remains — it scaffolds templates, config, and
scripts that are still needed" — but FR-005 of its spec delta
codified the emergent skip as a requirement instead, and its
design affirmatively rejected strengthening the sentinel for
fear `specify init` would overwrite the starter constitution
with a `[PLACEHOLDER]` template. This change
restores the intended coexistence and supersedes that FR-005;
the overwrite fear is disproven by the `--force` merge
semantics verified against specify 1.1.0 (user-owned memory
preserved), which the prior design predates.

Investigation also surfaced a second root-cause layer that any
sentinel fix must account for (empirically verified against
specify 1.1.0): `specify init` refuses to run non-interactively
in a non-empty directory without `--force` ("Current directory is
not empty and no confirmation input is available. Re-run with
--force to merge into it."). `uf init`'s asset walk always leaves
the target directory non-empty before delegation runs, so
restoring the delegation without also amending the invocation
would turn the silent skip into a visible failure.

## What Changes

1. Strengthen the specify sentinel from the bare `.specify`
   directory to `.specify/scripts` — a path only a real specify
   install creates. UF's embedded assets under `specify/` never
   include it.
2. Append `--force` to specify's base delegation args (specify's
   documented flag to "skip confirmation when current directory
   not empty"), and clear specify's conditional forceFlag so
   `uf init --force` does not pass `--force` twice. Empirically,
   `specify init --force` merges the full framework while
   preserving the user-owned UF starter constitution.
3. Make the sentinel skip visible: `initSimpleTool` returns an
   "already configured" subToolResult instead of a silent nil.
4. Add a `scaffold.Run()`-level integration test that reproduces
   this regression: fresh directory, stubbed LookPath/ExecCmd,
   assert the specify invocation is recorded.
5. Add a sentinel-integrity guard: a test asserting no embedded
   asset maps to the sentinel path, so future embedded assets
   cannot silently reintroduce this bug.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `scaffold-specify-init`: the delegation sentinel now detects a
  real specify install (`.specify/scripts`) instead of any
  `.specify` directory; the invocation always passes `--force`
  to skip the non-empty-directory confirmation; sentinel skips
  are reported as "already configured" instead of being silent.
- `scaffold-constitution`: FR-005 (sentinel interaction — specify
  init skipped) is removed. The starter constitution and a full
  specify install now coexist: the constitution is written by
  the asset walk, and `specify init --force` merges around it
  without overwriting user-owned memory files.

### Removed Capabilities

- None.

## Impact

- **internal/scaffold/scaffold.go**: `simpleTools` specify entry
  (sentinel path, base args, forceFlag) and `initSimpleTool`
  (visible skip result). No changes to the asset walk,
  `mapAssetPath`, `isToolOwned`, or the embedded constitution
  itself.
- **internal/scaffold/scaffold_test.go**: update the simple-tool
  skip tests (Specify/Replicator/OpenSpec/Gaze) for the new
  visible-skip result, update
  `TestInitSubTools_SpecifyForcePassthrough` for the new sentinel
  and base args, and add the Run()-level integration test plus
  the sentinel-integrity guard test.
- **Behavior**: fresh `uf init` with specify installed now yields
  a full Speckit framework plus the UF starter constitution
  (verified end-to-end against specify 1.1.0). Existing installs
  (`.specify/scripts` present) are visibly skipped as "already
  configured". `uf init --force` re-init behavior is preserved
  with a single `--force`.
- **Out of scope**: openspec and gaze delegations (their
  sentinels are not created by the UF asset walk), the Dewey
  delegation, stealth mode, and DivisorOnly mode (sub-tool
  initialization is skipped entirely there).

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The delegation decision remains an artifact-level contract: the
sentinel path and invocation args live in the `simpleTools` data
table, not in runtime coupling. The "already configured" skip is
reported as a standard subToolResult in the scaffold summary, so
users, `uf doctor`, and CI can observe delegation outcomes
without interacting with specify itself.

### II. Composability First

**Assessment**: PASS

`uf init` remains fully usable without specify installed (the
LookPath gate is unchanged and the starter constitution is still
embedded). specify remains usable standalone. The fix restores
the optional, additive delegation that spec 027 defined instead
of introducing any mandatory dependency.

### III. Observable Quality

**Assessment**: PASS

The silent nil return is replaced with a machine-readable
subToolResult ("already configured") rendered through the
existing summary pipeline with the established action vocabulary.
The new tests assert observable side effects — recorded ExecCmd
invocations and on-disk file state — rather than implementation
details.

### IV. Testability

**Assessment**: PASS

Every change is testable in isolation with the scaffold engine's
existing stub infrastructure (stubScaffoldLookPath,
scaffoldCmdRecorder, t.TempDir). The bug itself was a test gap —
`TestInitSubTools_SpecifyInit` calls `initSubTools` directly and
bypasses `Run()`'s scaffolding phase, so CI stayed green while
the command was broken. This change closes that gap with a
`Run()`-level regression test that would have caught the
original regression.

### V. Security by Default

**Assessment**: N/A

No new dependencies, network access, file permissions, or
privilege boundaries. The `--force` flag goes to an
already-gated local CLI delegation whose merge semantics were
empirically verified to preserve user-owned files. The sentinel
path is a fixed table constant, not external input.

### VI. Deterministic Execution

**Assessment**: PASS

The fix converts an emergent, undocumented interaction (asset
walk silently creating a sentinel) into an explicitly codified
contract: sentinel path in a data table, invocation args in a
data table, and a guard test that mechanically enforces the
invariant that no embedded asset maps to the sentinel path. The
skip/initialize decision remains a pure filesystem check
executed in tooling, and the new tests pin the deterministic
behavior against drift.
