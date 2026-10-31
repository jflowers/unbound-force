## Why

Adding a custom Divisor review agent to a generated repository is
only half-persistent today. Registering an agent touches three
files, and they disagree on scaffold ownership:

1. `.opencode/agents/divisor-<name>.md` — user-owned; a plain
   `uf init` re-run seeds it once and never overwrites it.
2. `.uf/review-matrix.yaml` — project-owned ("project-owned
   extension point", `internal/scaffold/scaffold.go:675-679`);
   locally added `advisor` / `always:` / `runs:` entries survive
   plain re-runs.
3. `.uf/reviewer-capabilities.yaml` — tool-owned
   (`internal/scaffold/scaffold.go:672-674`); a plain re-run
   performs overwrite-on-diff, so locally added `reviewers:`
   entries are silently reverted to the embedded canonical
   whenever content differs.

The runtime already treats the capabilities manifest as the
project-side registration surface. Spec 005 FR-023 requires that
"unknown agents MUST require an explicit valid review entry" in
the manifest, and the review-dispatch plugin's fail-closed
remediation message for an unlisted discovered agent reads
"Remediation: add an entry for <agent> to
.uf/reviewer-capabilities.yaml"
(`.opencode/plugins/review-dispatch/index.ts:1897`). The
reviewer-capabilities JSON Schema accepts any
`^divisor-[a-z0-9-]{1,63}$` agent name, so project-added entries
are schema-valid. The scaffold's ownership classification
contradicts the runtime contract: the tool instructs an edit that
the next `uf init` silently reverts.

The only durable registration path today is editing the embedded
asset in unbound-force itself, syncing the deployed `.uf/` copy
(drift-detection tests), and shipping a release — a cross-repo
workflow for what is inherently a per-project extension.

Originating issue: #884.

## What Changes

- Reclassify `uf/reviewer-capabilities.yaml` from tool-owned to
  project-owned in `isToolOwned`, mirroring the existing
  `uf/review-matrix.yaml` branch and its rationale comment. The
  file is seeded once on first deploy (create-if-missing) and
  skipped on all subsequent plain re-runs.
- Keep `uf init --force` semantics unchanged: force remains a
  destructive reset that clobbers both review-config files. Only
  `specify/memory/constitution.md` is never-overwrite.
- Pin the new ownership split in the existing ownership test
  table and add a re-run regression test that models the issue
  scenario: a locally added `reviewers:` entry survives a plain
  re-run and is reverted only under `--force`.
- Update the File Ownership Model documentation and the review
  council configuration reference to state the seeding and
  survival semantics for both files symmetrically.
- Add a CHANGELOG entry under Unreleased → Changed.

No runtime changes: the review-dispatch plugin, the
reviewer-manifest library, and the reviewer-capabilities JSON
Schema are untouched — they already accept project-added entries
and fail closed on invalid ones.

## Capabilities

### New Capabilities

- `scaffold-ownership`: The reviewer capabilities manifest
  (`.uf/reviewer-capabilities.yaml`) is a project-owned
  extension point. A generated repository can durably
  register a custom Divisor agent's capability and scopes
  there, and the registration survives plain `uf init`
  re-runs, exactly as its matrix membership and agent file
  already do.

### Modified Capabilities

- None.

### Removed Capabilities

- None.

## Impact

Affected copies, enumerated per the originating issue:

- `internal/scaffold/scaffold.go` — the `isToolOwned` branch for
  `uf/reviewer-capabilities.yaml` (currently lines 672-674)
  flips to `return false` with an extension-point comment.
- `internal/scaffold/scaffold_test.go` — the ownership table
  (line 2800) flips the expected value; a new re-run + force
  regression test is added. The drift-detection pairs
  (lines 1933-1974) and the DivisorOnly deployment table
  (lines 3457-3458) are unaffected: embedded ↔ deployed
  equality still holds because this repository's `.uf/` copy
  remains byte-identical to the embedded asset, and both files
  still deploy in DivisorOnly mode.
- `docs/architecture.md` — File Ownership Model section gains
  the symmetrical extension-point semantics for the two
  review-config files.
- `docs/configuration.md` — Review Council Configuration table
  documents that `.uf/reviewer-capabilities.yaml` is seeded once
  and survives re-init (`--force` resets).
- Tutorial — the three-file registration workflow
  (`.opencode/agents/divisor-<name>.md` +
  `.uf/review-matrix.yaml` + `.uf/reviewer-capabilities.yaml`,
  all project-owned and surviving re-init) is tracked by the
  cross-repo website docs issue against `unbound-force/website`;
  task 2.4 files it under this change's documentation gates.
- `CHANGELOG.md` — Unreleased → Changed entry.
- File ownership model — `uf/reviewer-capabilities.yaml` moves
  from the tool-owned column (updated on diff) to the
  project-owned column (seeded once, skipped thereafter,
  `--force` resets). Generated repositories stop receiving
  automatic canonical capability-list updates on re-run; the
  accepted trade-off and its mitigations are recorded in
  design.md.
- Generated repositories — behavioral change on `uf init`
  re-run only: a locally modified capabilities file is skipped
  instead of updated. First-deploy behavior is unchanged.
- Runtime consumers — none. `review-dispatch`, `invoke-agent`,
  and `reviewer-manifest.ts` are unchanged; matrix limits
  (`max_personas: 16`, `max_total_runs: 24`) still cap added
  agents.

Out of scope: merge logic for either file, changes to
`.uf/review-matrix.override.yaml` (which remains
profiles-only), and any change to `--force` or
never-overwrite semantics.

## Constitution Alignment

Assessed against the Unbound Force org constitution
(v1.4.0, `.specify/memory/constitution.md`).

### I. Autonomous Collaboration

**Assessment**: PASS

The change removes a contradiction between two heroes'
artifacts rather than adding coupling. The scaffold's ownership
metadata and the review-dispatch runtime contract now agree that
`.uf/reviewer-capabilities.yaml` is the project-side
registration artifact. No synchronous interaction or new
exchange format is introduced; the manifest remains a
self-describing, schema-validated file at a well-known
location.

### II. Composability First

**Assessment**: PASS

Projects extend the review council through a documented
configuration extension point instead of patching or forking the
tool — directly serving "Heroes MUST expose well-defined
extension points ... rather than requiring modification of their
internals." The Divisor remains fully usable standalone; no new
dependency or mandatory peer is introduced.

### III. Observable Quality

**Assessment**: PASS

Every disposition remains observable and machine-parseable
through `Result.Created` / `Result.Skipped` / `Result.Updated`
and the printed scaffold summary. Behavior changes are pinned by
automated regression tests. No output format changes.

### IV. Testability

**Assessment**: PASS

The change is a pure predicate flip plus tests. The regression
test runs the real scaffold in `t.TempDir()` with injected
`io.Writer`, verifying observable side effects (disposition
lists, on-disk file content) with no external services — the
same pattern as `TestRun_ConstitutionPreservedOnRerun`.

### V. Security by Default

**Assessment**: PASS

Eligibility stays fail-closed: unlisted discovered agents still
block dispatch with a remediation message, the manifest is
still validated against its JSON Schema at load time, and
governance limits in the matrix are untouched. The change adds
no dependencies, no new input surfaces, and cannot weaken any
gate (it widens who MAY be registered, never bypassing
validation or caps).

### VI. Deterministic Execution

**Assessment**: PASS

The disposition stays a mechanical, tool-owned code path with
tests — a predicate change, not prose procedure. No instruction
text gains mechanical steps; the documented workflow for adding
an agent becomes simpler (edit three project-owned files) and
remains deterministic to re-run.
