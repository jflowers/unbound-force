## Context

Since commit ca57106 ("fix(scaffold): embed starter constitution in
uf init"), a fresh non-force `uf init` never runs `specify init`.
The causal chain:

1. `Run()` scaffolds embedded assets first. The starter
   constitution lives at `assets/specify/memory/constitution.md`,
   and `mapAssetPath()` maps the `specify/` prefix to `.specify/`
   (FR-002 of the fix-constitution-scaffold change). The walk
   completes at scaffold.go:315.
2. `Run()` delegates to sub-tools afterwards (scaffold.go:376).
3. The specify delegation's sentinel is the bare `.specify`
   directory (`simpleTools` table, scaffold.go:1852), so
   `initSimpleTool` sees the sentinel, returns nil silently
   (scaffold.go:1976-1978), and the delegation is skipped.

The result is a half-installed Speckit framework: `.specify/`
contains only `memory/` — no `templates/`, `scripts/`, or
`workflows/` — and `.opencode/commands/` is missing the five
upstream speckit commands that only `specify init` provides. The
invocation contract fixed by fix-specify-init-invocation
(`--here --integration opencode --offline`) is dead code on the
fresh-init path. CI stayed green because
`TestInitSubTools_SpecifyInit` (scaffold_test.go:6248) calls
`initSubTools` directly, bypassing `Run()`'s scaffolding phase,
and no `TestRun_*` test stubs `LookPath` for specify — the real
`exec.LookPath` in CI finds no specify binary, so the delegation
silently no-ops there too.

A second root-cause layer (verified empirically against specify
1.1.0): `specify init` refuses to run non-interactively in a
non-empty directory without `--force`. `uf init`'s asset walk
always leaves the target directory non-empty before delegation
runs, so restoring the delegation without amending the
invocation would turn the silent skip into a visible failure.

This is a bug fix, not a new feature. It restores the coexistence
the fix-constitution-scaffold change intended (its proposal:
"The `specify init` call remains — it scaffolds templates,
config, and scripts that are still needed") and supersedes that
change's FR-005, which codified the emergent skip as a
requirement.

One prior decision deserves an explicit rebuttal. The
fix-constitution-scaffold design (its design.md, lines 60-64)
considered strengthening the specify sentinel and rejected it:
"Rejected because it would cause `specify init` to run after
our scaffold, potentially overwriting the starter constitution
with a `[PLACEHOLDER]` template. The sentinel serving as a
skip gate is correct." That rejection predates the `--force`
merge invocation and rested on an assumption of destructive
overwrite that the merge semantics verified against specify
1.1.0 disprove — `specify init --force` merges into the
non-empty directory and preserves user-owned memory files
(see the Risk: specify `--force` semantic drift section and
FR-007's non-displacement guarantee in the
scaffold-constitution delta). This change therefore adopts
the alternative that design rejected, on evidence it did not
have.

## Goals / Non-Goals

### Goals

- A fresh non-force `uf init` with specify in PATH produces a
  full Speckit framework AND the UF starter constitution
  (coexistence, empirically verified against specify 1.1.0)
- The specify sentinel detects a real specify install
  (`.specify/scripts`), not any `.specify` directory
- The delegation succeeds in the non-empty target directory
  (`--force` merge semantics, exactly one `--force` under
  `uf init --force`)
- Sentinel skips are visible: "already configured" subToolResult
  through the existing summary pipeline instead of a silent nil
- Regression protection that would have caught the original bug:
  a `Run()`-level integration test and a sentinel-integrity
  guard test

### Non-Goals

- No changes to the asset walk, `mapAssetPath`, `isToolOwned`,
  or the embedded constitution itself
- No changes to delegation ordering — the asset walk still runs
  before `initSubTools()`
- No changes to the openspec/gaze/replicator delegation logic
  beyond the shared visible-skip result
- No re-embedding of Speckit assets (spec 027's externalization
  stands)
- No changes to stealth mode or DivisorOnly mode (sub-tool
  initialization is skipped entirely there)
- No specify version pinning, network behavior, or installation
  changes

## Decisions

### D1: Strengthen the specify sentinel to `.specify/scripts`

The `simpleTools` specify entry's sentinel changes from
`.specify` to `filepath.Join(".specify", "scripts")` (matching
the `filepath.Join` style of the openspec and gaze entries).
`.specify/scripts` is a path only a real `specify init` run
creates; UF's embedded assets under `specify/` contain only
`memory/constitution.md` (verified — no `scripts/` subtree
exists under `assets/specify/`).

**Alternatives considered and rejected**:

- *Reorder delegation before the asset walk.* Breaks established
  ordering invariants: `.gitignore` is ensured before delegation
  so it is ready before sub-tools create runtime files
  (scaffold.go:350-352); the stealth-mode snapshot happens before
  delegation so sub-tool mutations can be reverted
  (scaffold.go:364-373); `migrateCommandDir` runs after
  `initSubTools()` specifically to catch files `specify init`
  creates in the legacy `.opencode/command/` directory
  (scaffold.go:395-400). High blast radius for a sentinel bug.
- *Post-init constitution write* (write the constitution after
  delegation if absent). Splits the asset walk into two phases,
  breaks the single-walk `Result` accounting (created/skipped/
  overwritten categorization), and races with specify's own
  `memory/` scaffolding. Also bypasses the FR-003 user-owned
  preservation logic that operates during the walk.
- *Sentinel strengthening* (chosen). One data-table entry;
  preserves every ordering invariant; the guard test (D4) makes
  the invariant mechanical.

**Constitution alignment**: Composability First — the delegation
contract stays an artifact-level entry in a data table;
Deterministic Execution — the skip/initialize decision remains a
pure filesystem check.

### D2: `--force` in specify base args; conditional forceFlag cleared

The specify entry's `args` gain `--force`, producing
`specify init --here --integration opencode --offline --force`,
and its conditional `forceFlag` changes from `"--force"` to `""`.

**Rationale**: `--force` is specify's documented flag to skip the
non-empty-directory confirmation. Because `uf init`'s asset walk
always leaves the target non-empty, the fresh-init path needs it
unconditionally — not only on `uf init --force`. Empirically
verified against specify 1.1.0: the full framework merges while
user-owned memory files (including the UF starter constitution)
are preserved.

**Single-force invariant**: with `forceFlag` empty, the
conditional append in `initSimpleTool` (scaffold.go:1986-1988)
never fires for specify, so `uf init --force` passes exactly one
`--force` — from the base args — on both the fresh-init and
re-init paths. This supersedes the specify forceFlag value
introduced by fix-init-force-passthrough (its D1/FR-015 table)
and supersedes the FR-SPECIFY-INIT invocation from
fix-specify-init-invocation via a MODIFIED FR-SPECIFY-INIT
delta in this change's scaffold-specify-init capability
delta. The other tools' forceFlag entries
are unchanged.

**Constitution alignment**: Observable Quality — the invocation
contract is explicit in the data table rather than emergent from
two interacting flags.

### D3: Visible sentinel skip — "already configured" result

`initSimpleTool`'s early return changes from `return nil` to
`return &subToolResult{name: tool.result, action:
"already configured"}` when the sentinel exists and Force is
false.

**Rationale**: "already configured" is already part of the
action vocabulary — the `subToolResult` doc comment lists it
(scaffold.go:895-897), `subToolSymbol` maps it to ✓
(scaffold.go:2018), and `configureOpencodeJSON` already emits it.
No rendering changes are needed; `printSummary` picks the result
up through the existing sub-results loop. `ExecCmd` is still not
invoked, and the goroutine `collect` loop's `if r != nil` guard
stays as defense in depth (the LookPath and config-skip paths
still produce no result).

The `initSimpleTool` GoDoc is updated to describe the
already-configured result, replacing the "Returns nil if the
sentinel already exists" wording that becomes inaccurate.

**Constitution alignment**: Observable Quality — machine-
parseable outcome with the established vocabulary; Autonomous
Collaboration — users, `uf doctor`, and CI can observe delegation
outcomes without interacting with specify.

### D4: Hoist `simpleTools` to package level; sentinel-integrity guard

`simpleTools` is currently a local slice inside `initSubTools`
(scaffold.go:1849), unreachable from tests. Hoist it to a
package-level `var simpleTools = []simpleTool{...}` with the
table contents unchanged at that step.

**Rationale**: the guard test must enumerate the real table — a
hardcoded sentinel list in the test would not catch a future
tool entry whose sentinel collides with an embedded asset. The
guard test asserts that no embedded asset's mapped target path
(`mapAssetPath` over the embedded FS) equals or is a descendant
of any `simpleTools` sentinel path. All four current sentinels
are clear today (verified), so the test pins the invariant
mechanically: a future embedded asset that recreates this bug's
precondition fails CI.

**Constitution alignment**: Testability — the table becomes
directly testable; Deterministic Execution — the invariant is
enforced by tooling, not review vigilance.

### D5: `Run()`-level integration regression test

A new test (e.g. `TestRun_SpecifyDelegationOnFreshInit`) runs
the full `scaffold.Run()` on a fresh `t.TempDir()` with stubbed
`LookPath` (specify found) and stubbed `ExecCmd`
(`scaffoldCmdRecorder`), then asserts:

- the recorder contains
  `specify init --here --integration opencode --offline --force`
- `.specify/memory/constitution.md` exists on disk (the
  constitution coexists with the delegation)
- the sub-tool results include `.specify/` initialized

**Rationale**: this is the test that would have caught the
original regression. Existing `TestRun_*` tests never stub
`LookPath` for specify, so the delegation silently no-ops under
the real `exec.LookPath` in CI; `TestInitSubTools_SpecifyInit`
bypasses `Run()` entirely. The new test mirrors the stub
patterns of `TestRun_CreatesFiles` /
`TestRun_ConstitutionScaffolded` but is the first to exercise a
simple-tool delegation at the `Run()` level.

## Risks / Trade-offs

### Risk: specify `--force` semantic drift

The merge semantics of `--force` are verified empirically
against specify 1.1.0 (full framework merges; user-owned
memory files, including the starter constitution, are
preserved). specify is invoked unpinned from PATH, so a
future version could change `--force` to destructive
overwrite and displace the user-owned constitution. Unit
tests stub `ExecCmd`, so they pin the invocation contract,
not specify's merge behavior; detection is behavioral
rather than version-gated — init results are visible
("initialized" / "already configured" summary lines), so
a semantic regression surfaces in every run's output.
Users who want no specify delegation can set
`setup.tools.specify.method: skip` in `.uf/config.yaml`.
Accepted: `--force` is specify's documented
non-empty-directory merge path; a semantic change there
is specify's breaking change to surface. If a destructive
`--force` ever ships, the follow-up is a specify version
check at delegation time — out of scope for this change
until such a version exists.

### Risk: visible skip changes summary output for all simple tools

Runs against existing installs now print "already configured"
lines for replicator, specify, openspec, and gaze where before
they printed nothing. The vocabulary, symbol mapping, and
summary pipeline are unchanged and already exercised by
`configureOpencodeJSON` results; consumers parse actions
additively. Accepted — visibility is the point of the fix.

### Risk: half-installed `.specify` directories now get a real init

Users whose `.specify/` contains only `memory/constitution.md`
(the broken state this change fixes) will get a full
`specify init --force` merge on their next `uf init` — intended.
Users who deliberately want only the constitution can set
`setup.tools.specify.method: skip` in `.uf/config.yaml` (the
existing config gate in `initSubTools`).

### Trade-off: superseded requirement text in unarchived sibling changes

The unarchived fix-specify-init-invocation and
fix-init-force-passthrough deltas contain now-outdated scenario
text (bare `.specify` sentinel, nil skip return, no `--force` in
base args, specify forceFlag `--force`). This change's deltas
document the supersession explicitly — MODIFIED FR-004,
FR-011, FR-014, and FR-015 plus ADDED FR-017 through FR-021
in the 027-externalize-tool-init delta; MODIFIED
FR-SPECIFY-INIT in the scaffold-specify-init delta; REMOVED
FR-005 and ADDED FR-007 in the scaffold-constitution delta —
and sibling change
history is not rewritten.

### Trade-off: the sentinel depends on specify's on-disk layout

`.specify/scripts` is specify's stable scaffold location. If
specify relocates it, the sentinel weakens and delegation runs
on existing installs — which `--force` merge semantics makes
safe-ish but noisy. The guard test protects UF's side of the
invariant only. Accepted: the location is core to specify's
operation and has been stable across its released versions.
