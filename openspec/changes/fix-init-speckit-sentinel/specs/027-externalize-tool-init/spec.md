## ADDED Requirements

### Requirement: FR-017 — Specify sentinel detects a real install

The specify delegation's sentinel MUST be
`filepath.Join(".specify", "scripts")` — a path that only a real
`specify init` run creates. A bare `.specify` directory MUST NOT
satisfy the sentinel, including the directory that UF's embedded
constitution asset creates during the asset walk.

#### Scenario: Asset-walk constitution does not satisfy the sentinel

- **GIVEN** a fresh target directory where the asset walk created
  `.specify/memory/constitution.md` and `.specify/scripts` does
  not exist
- **WHEN** `uf init` evaluates the specify sub-tool
- **THEN** the sentinel check MUST NOT treat the directory as
  already installed
- **AND** the specify delegation MUST proceed

#### Scenario: Real specify install satisfies the sentinel

- **GIVEN** `.specify/scripts` exists in the target directory
- **WHEN** `uf init` runs without `--force`
- **THEN** the specify delegation MUST be skipped, reported per
  FR-019

### Requirement: FR-018 — Unconditional --force merge invocation

The specify entry's base delegation args MUST include `--force`,
producing the invocation
`specify init --here --integration opencode --offline --force`.
The `--force` flag is specify's documented non-empty-directory
merge path. `uf init`'s asset walk always leaves the target
directory non-empty before delegation runs, so the fresh-init
path needs the flag unconditionally — not only on
`uf init --force`.

The specify entry's conditional `forceFlag` MUST be empty so the
conditional append in `initSimpleTool` never fires for specify.
`uf init --force` MUST pass exactly one `--force` — from the base
args — on both the fresh-init and re-init paths.

#### Scenario: Fresh init records the merge invocation

- **GIVEN** a fresh target directory and the `specify` binary in
  PATH
- **WHEN** `uf init` runs without `--force`
- **THEN** the executed command MUST be
  `specify init --here --integration opencode --offline --force`

#### Scenario: Single --force under uf init --force

- **GIVEN** `.specify/scripts` exists and `uf init --force` runs
- **WHEN** the specify re-initialization command is constructed
- **THEN** the args MUST contain exactly one `--force`, supplied
  by the base args
- **AND** the conditional forceFlag append MUST NOT add another

### Requirement: FR-019 — Visible already-configured skip

When a simple tool's sentinel path exists and `opts.Force` is
false, `initSimpleTool` MUST return a `subToolResult` with the
tool's result name and action `"already configured"` instead of
returning nil. `ExecCmd` MUST NOT be invoked on this path. The
result MUST render through the existing summary pipeline — the
action is already part of the `subToolResult` vocabulary and
maps to the check symbol via `subToolSymbol`.

The LookPath gate (binary not in PATH) and the
`setup.tools.<name>.method: skip` config gate MUST continue to
produce no result.

#### Scenario: Existing install reports already configured

- **GIVEN** a simple tool's sentinel path exists and the tool's
  binary is in PATH
- **WHEN** `uf init` runs without `--force`
- **THEN** the summary MUST include a line reporting the tool
  with action `"already configured"`
- **AND** the tool's init command MUST NOT be executed

#### Scenario: Binary missing stays result-less

- **GIVEN** a simple tool's sentinel path exists but the tool's
  binary is NOT in PATH
- **WHEN** `uf init` runs
- **THEN** no subToolResult for the tool MUST be reported

### Requirement: FR-020 — Sentinel-integrity guard

The `simpleTools` table MUST be defined at package level so
tests can enumerate the real entries. A guard test MUST assert
that no embedded asset's mapped target path (via `mapAssetPath`
over the embedded asset FS) equals, or is a descendant of, any
`simpleTools` sentinel path. The guard MUST enumerate the
package-level table — a hardcoded sentinel list in the test
would not catch a future tool entry whose sentinel collides with
an embedded asset.

#### Scenario: Current assets pass the guard

- **GIVEN** the current embedded assets (including
  `specify/memory/constitution.md`)
- **WHEN** the sentinel-integrity guard runs
- **THEN** it MUST pass: no mapped asset path equals or falls
  under any sentinel path

#### Scenario: Future embedded asset under a sentinel fails CI

- **GIVEN** an embedded asset whose mapped target path equals or
  falls under a `simpleTools` sentinel path
- **WHEN** the sentinel-integrity guard runs
- **THEN** it MUST fail, preventing the asset walk from silently
  creating a sub-tool sentinel

### Requirement: FR-021 — Run-level fresh-init delegation coverage

A `scaffold.Run()`-level integration test MUST exercise a fresh
non-force init end to end: fresh `t.TempDir()`, stubbed
`LookPath` (specify found), stubbed `ExecCmd` recording
invocations. The test MUST assert that:

1. the recorder contains
   `specify init --here --integration opencode --offline --force`
2. `.specify/memory/constitution.md` exists on disk — the
   constitution coexists with the delegation
3. the sub-tool results include `.specify/` with action
   `initialized`

#### Scenario: Fresh init delegates and coexists

- **GIVEN** a fresh empty target directory with stubbed LookPath
  finding `specify` and a recording ExecCmd stub
- **WHEN** `scaffold.Run()` completes
- **THEN** the specify invocation is recorded with `--force`
- **AND** the starter constitution exists on disk
- **AND** `.specify/` is reported as initialized

## MODIFIED Requirements

### Requirement: FR-004 — Speckit delegation

`uf init` MUST delegate Speckit initialization to
`specify init --here --integration opencode --offline --force`
when the `specify` binary is in PATH and `.specify/scripts` does
not exist.

Previously: "`uf init` MUST delegate Speckit initialization to
`specify init` when the `specify` binary is in PATH and
`.specify/` does not exist" (spec 027's original text with its
bare `.specify` sentinel; fix-specify-init-invocation later
codified the `--here --integration opencode --offline`
invocation as FR-SPECIFY-INIT in its own scaffold-specify-init
capability delta without modifying this requirement). The
bare-directory sentinel let the embedded constitution asset
suppress the delegation on every fresh run, and the invocation
lacked the `--force` merge flag that the non-empty target
directory requires.

#### Scenario: Fresh init with constitution scaffolded

- **GIVEN** a fresh target directory (the asset walk creates
  `.specify/memory/constitution.md` before delegation runs)
- **WHEN** `uf init` runs without `--force` and `specify` is in
  PATH
- **THEN** the delegation MUST execute
  `specify init --here --integration opencode --offline --force`
- **AND** the result MUST report `.specify/` as `initialized`

### Requirement: FR-011 — Idempotency (clarification)

Each tool delegation MUST be idempotent — if the tool's sentinel
path exists and `opts.Force` is false, the step is skipped and
reported as a `subToolResult` with action `"already
configured"`. When `opts.Force` is true, the idempotency guard
is bypassed and the tool is re-initialized.

Previously: "if the tool's directory already exists, the step is
skipped" (spec 027), amended by fix-init-force-passthrough to
bypass the guard under force. The skip was a silent nil return;
it is now visible per FR-019.

### Requirement: FR-014 — Force flag passthrough for Group B tools

`initSimpleTool` MUST check `opts.Force` before applying the
sentinel-exists guard. When `opts.Force` is true and the sentinel
path exists, the function MUST re-run the sub-tool's init
command instead of returning the already-configured skip result.

When `opts.Force` is true, the sentinel path exists, and the
`simpleTool` entry declares a non-empty `forceFlag`,
`initSimpleTool` MUST append that flag to the args passed to
`ExecCmd`. Single-force invariant: a tool whose base `args`
already include its force flag MUST declare an empty `forceFlag`
so the conditional append can never duplicate the flag.

On first-time initialization (sentinel does not exist), the
`forceFlag` MUST NOT be appended regardless of `opts.Force`, and
the result MUST use action `"initialized"`.

Previously (fix-init-force-passthrough): the re-run clause ended
"instead of returning nil" — inaccurate under the visible skip —
and no single-force invariant existed, so a tool carrying its
force flag in base args and declaring `forceFlag: "--force"`
would receive the flag twice under `uf init --force`.

#### Scenario: Specify re-init passes exactly one --force

- **GIVEN** `.specify/scripts` exists and `uf init --force` runs
- **WHEN** the specify re-initialization executes
- **THEN** the recorded args MUST contain exactly one `--force`
- **AND** the result MUST report action `"re-initialized"`

### Requirement: FR-015 — simpleTool struct forceFlag field

The `simpleTool` struct MUST include a `forceFlag` field of type
`string`. Each entry in the `simpleTools` table MUST declare its
tool-specific force flag:

| Tool       | `--force` in base args | forceFlag   |
|------------|------------------------|-------------|
| specify    | yes                    | (empty)     |
| openspec   | no                     | `--force`   |
| gaze       | no                     | `--force`   |
| replicator | no                     | (empty)     |

An empty `forceFlag` means either the tool does not require a
force flag for re-initialization (replicator) or the flag is
already supplied unconditionally in the base args (specify, per
FR-018).

Previously (fix-init-force-passthrough): specify declared
forceFlag `--force` with no `--force` in its base args.

## REMOVED Requirements

None.

<!-- scaffolded by uf vdev -->
