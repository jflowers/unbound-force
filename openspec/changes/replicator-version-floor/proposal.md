## Why

Replicator v0.7.0 (released 2026-10-27) makes `replicator init`
smart-sync agent-kit scaffolding by default, including drift
repair for scaffolded `.opencode/` copies. The unbound-force
CLI delegates per-repo setup to `replicator init` (Spec 024,
FR-009) and delegates health reporting to `replicator doctor`
(FR-011). Machines running Replicator older than v0.7.0
silently miss the smart-sync behavior — scaffolded copies
drift instead of repairing — and `uf doctor` currently reports
them as healthy because it only checks binary presence.

Today the version floor is invisible: `uf doctor` reports
"installed" for any replicator binary regardless of version.
A user on v0.6.0 (the immediately preceding release, one day
older) cannot tell that their environment is missing
capabilities the current unbound-force workflow expects.

## What Changes

The `uf doctor` Replicator check group (per FR-011, Spec 024)
gains a version-floor sub-check:

- The installed Replicator MUST be v0.7.0 or greater.
- When the binary is present, `uf doctor` runs the Replicator
  version command and compares the reported version against
  the floor using semantic-version ordering of the
  major.minor.patch core (build/dev suffixes are ignored, so
  a dev build past v0.7.0 satisfies the floor).
- Below the floor: the check reports a warning with an
  upgrade hint (`brew upgrade unbound-force/tap/replicator`)
  and a link to the Replicator releases page. Severity is
  Warn, not Fail — consistent with every other check in the
  Replicator group, per the Spec 024 design decision that
  Replicator is optional under Constitution Principle II
  (Composability First). Treating an outdated install as
  blocking (Fail) while treating a missing install as Warn
  would be incoherent: absence is already the harsher state.
- Version command failure or unparseable output: the check
  reports a warning ("version could not be verified") and
  the remaining sub-checks still run — matching the
  fail-open edge-case pattern already used by the Core Tools
  version checks (go, node, podman).
- At or above the floor: the check passes and reports the
  detected version.
- The floor value lives in a single named constant in the
  doctor package, so future floor bumps are one-line changes.

Out of scope: `uf setup` (it already installs the latest
release and resolves versions from the GitHub API), config
file overrides of the floor, and platform-specific upgrade
hints beyond the Homebrew path (the dominant install path;
the releases URL covers the rest).

## Capabilities

### New Capabilities

- `replicator-version-floor`: `uf doctor` verifies the
  installed Replicator is v0.7.0 or greater and warns with
  an actionable upgrade hint when it is older, when the
  version cannot be determined, or when the version command
  fails.

### Modified Capabilities

- `doctor-replicator-group` (Spec 024, FR-011): the
  Replicator check group gains a fifth sub-check — version
  floor — placed between binary presence and the
  `replicator doctor` delegation. Existing sub-checks
  (binary, doctor delegation, `.uf/replicator/`, MCP
  config) are unchanged.

### Removed Capabilities

None.

## Impact

- **Files**: `internal/doctor/checks.go` (new sub-check,
  version parse helper, floor constant),
  `internal/doctor/doctor_test.go` (new test cases for
  above-floor, below-floor, unparseable, and
  version-command-failure paths).
- **Behavior**: `uf doctor` output (text and JSON) gains one
  result row in the Replicator group when the binary is
  present. Exit-code behavior is unchanged — the new check
  warns and does not fail. Machines on Replicator < v0.7.0
  (including the common just-upgraded-to-dev-build case)
  now see an explicit upgrade recommendation.
- **Users**: anyone running `uf doctor` with an older
  Replicator sees the warning immediately instead of a
  silent "installed" pass.
- **No breaking changes**: the CheckResult shape, group
  name, and existing result names are unchanged; JSON
  consumers see an additive row.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

The version floor is evaluated entirely from the local
`replicator` binary's own version output — no synchronous
interaction with Replicator or any other hero. The check
result is a self-describing CheckResult artifact carrying
name, severity, message, install hint, and URL, which flows
into `uf doctor`'s existing text and JSON outputs for any
consumer to interpret without consulting the producing hero.

### II. Composability First

**Assessment**: PASS

Replicator remains independently installable and optional.
A missing Replicator still warns (unchanged); an outdated
one now warns too — neither blocks `uf doctor` or any other
unbound-force function. No hero becomes a hard prerequisite:
unbound-force delivers its core value with Replicator
absent, old, or new. The floor only improves the diagnostic
quality of an already-optional integration.

### III. Observable Quality

**Assessment**: PASS

The check produces a machine-parseable CheckResult that
serializes into `uf doctor --format json`, so the version
verdict (detected version, floor, severity, upgrade hint)
is consumable by tooling, not just humans. The floor itself
is a single named constant with provenance in this change,
and the comparison logic ships with automated regression
tests (per Principle IV) so the quality claim "warns below
v0.7.0" is backed by reproducible evidence.

### IV. Testability

**Assessment**: PASS

The sub-check is testable in isolation following the
existing doctor test pattern: stub LookPath/ExecCmd
injections supply deterministic version outputs (above
floor, below floor, dev-suffix builds, unparseable text,
command failure) — no real Replicator binary, network, or
external service is required. Coverage strategy is defined
in the tasks artifact.

### V. Security by Default

**Assessment**: PASS

No new dependencies, no network access, no secrets. The
version string parsed from local command output is used
only in a numeric comparison and displayed messages; it is
never used in file path construction or shell execution.
Unparseable input fails open to a warning, never to an
unvalidated action.

### VI. Deterministic Execution

**Assessment**: PASS

The version parse and comparison are mechanical procedures
extracted into tested Go code within the doctor package —
not prose re-reasoned per invocation. The floor is a named
constant, and the observed version-command output format
(`replicator version v0.6.0-7-gea86d27-dirty`) is captured
verbatim in tests so format drift is caught by regression.
