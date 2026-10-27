## Context

The `uf doctor` Replicator check group (Spec 024, FR-011, in
`internal/doctor/checks.go` `checkReplicator`) currently runs
four sub-checks — binary presence, `replicator doctor`
delegation, `.uf/replicator/` existence, and `mcp.replicator`
in `opencode.json` — and reports "installed" for any binary
regardless of version. Replicator v0.7.0 (2026-10-27) makes
`replicator init` smart-sync agent-kit scaffolding by default;
unbound-force's `uf init` and scaffold maintenance now rely on
that behavior, so machines on older Replicator versions are
silently degraded.

Observed version-command contract (captured from a real
binary, 2026-10-27):

    $ replicator --version
    replicator version v0.6.0-7-gea86d27-dirty

The doctor package already has a version-check vocabulary for
Core Tools (`toolSpec.versionCmd/versionParse/minVersion/
versionCheck` and `parseVersionParts`), but it is
major.minor-only and lives in the Core Tools group's
`checkOneTool` path, which is a different reporting surface
from the Replicator group.

Constitution alignment is assessed in the proposal; the
decisions below note where each decision touches those
principles.

## Goals / Non-Goals

### Goals

- Warn, with an actionable upgrade hint, when the installed
  Replicator is below v0.7.0.
- Report the detected version on pass, in both text and JSON
  doctor output.
- Fail open (Warn, "version could not be verified") when the
  version command fails or its output cannot be parsed.
- Keep the floor as a single named constant.
- Preserve all existing Replicator group behavior, including
  the binary-absent early return and the remaining sub-checks
  running regardless of the version outcome.
- Full unit-test coverage using the existing stub injection
  pattern — no real Replicator binary needed in tests.

### Non-Goals

- Enforcing the floor in `uf setup` (setup already resolves
  and installs the latest release).
- Failing (`Fail` severity) or blocking on an old version.
- A configurable floor (config file, env var, flag).
- Platform-specific upgrade hints beyond the Homebrew command
  plus the releases URL.
- Touching the Core Tools `replicator` presence entry, which
  stays presence-only.

## Decisions

### D1: Dedicated sub-check inside `checkReplicator`

The version floor is a new discrete `CheckResult` named
`replicator version`, appended by a new sub-check inside
`checkReplicator`, placed between binary presence (Check 1)
and `replicator doctor` delegation (Check 2).

Alternatives rejected:

- **Reuse `toolSpec` version fields on the Core Tools
  `replicator` entry**: the result would surface in the Core
  Tools group, duplicating Replicator reporting across two
  groups, and `checkOneTool`'s below-minimum severity is
  `Fail`, which contradicts the Replicator group's all-Warn
  model (D2).
- **Enrich the binary-presence result message** ("installed
  (v0.6.0)"): fewer rows, but the version verdict loses its
  own severity, name, and install hint, and JSON consumers
  cannot key on it. A discrete result matches the group's
  existing grain (`replicator`, `replicator doctor`,
  `.uf/replicator/`, `MCP config`) and Spec 024's
  contract-table style.

Constitution tie-in (Observable Quality): the discrete result
serializes into `uf doctor --format json` with its own name,
severity, and message.

### D2: Severity is Warn in every non-passing outcome

Below floor, version-command failure, and unparseable output
all report `Warn`. `Fail` is never used.

Rationale: Spec 024's design decision — every check in the
Replicator group warns because Replicator is optional under
Constitution Principle II (Composability First). A missing
install is Warn; an outdated install must not be treated more
harshly than a missing one. Concretely, `Fail` would flip
`uf doctor`'s exit status for a state that is strictly softer
than "not installed". This also matches the fail-open edge
handling already used by Core Tools version checks
("installed, version could not be verified" → Warn).

### D3: Version acquisition via `replicator --version` with a timeout

The sub-check runs `opts.ExecCmdTimeout(5*time.Second,
"replicator", "--version")` — timeout-protected for defensive
parity with the group's existing execution pattern (the
`replicator doctor` delegation uses `ExecCmdTimeout` with 10s;
version reporting is a fast local operation, so 5s is
generous). A hung or corrupted binary feeds the same
"version could not be verified" warn path as a non-zero exit.

`replicator version` (multi-line, with commit/built lines) was
rejected: `--version` is single-line and sufficient.

### D4: Dedicated parser and three-part comparison

A `parseReplicatorVersion(output string) (string, error)`
helper extracts the core version from
`replicator version v0.6.0-7-gea86d27-dirty`:

1. find the `version` keyword token, take the following
   token;
2. strip a leading `v`;
3. cut at the first `-` (git-describe and semver-prerelease
   suffixes), yielding `0.6.0`;
4. validate the remainder is `major.minor.patch` digits, else
   return an error.

The comparison uses a three-part numeric compare
(major.minor.patch) against the floor constant — not the
existing `parseVersionParts` (major.minor only), which cannot
distinguish patch levels and would make a future floor like
`0.7.1` indistinguishable from `0.7.0`.

Suffix semantics: anything after the core is ignored, so
`v0.7.0-3-gabcdef` (a dev build past v0.7.0) satisfies the
floor while `v0.6.0-7-gea86d27-dirty` does not. Strict semver
(prerelease sorts below release) was considered and rejected:
this org routinely runs local dev builds, and flagging a build
that is *newer* than the floor as outdated would be a false
positive for the floor's purpose — catching stale installs.

A note on the parser inventory (added in review-council round
1): `checks.go` also carries a strict three-component validator
for the review-plugin runtime checks (`parseExactSemver` /
`parseSemverComponent`), which the alternatives survey above
missed. Reusing it was considered and rejected: only the final
core-validation step could delegate — the token-after-keyword
extraction and suffix cut are this parser's actual substance —
and delegating that remainder would import strict-SemVer
semantics the floor deliberately does not enforce.
`parseSemverComponent` rejects leading-zero components and
bounds them to uint32; here padded cores such as `v0.07.0`
order as `0.7.0`, consistent with the suffix policy above (the
floor targets stale installs, not pre-release or padding
hygiene), and the comparator's fail-closed contract (malformed
input can never satisfy the floor) is expressed in an
`(int, ok)` shape rather than `(uint32, error)`.

### D5: Floor as a named constant

`replicatorMinVersion = "0.7.0"` (or equivalent) at package
level in `internal/doctor/checks.go`. Single source of truth;
a future bump is a one-line change plus tests. A configurable
floor was rejected: the floor is a dependency statement of
this CLI version, not a user preference.

### D6: Result shapes

| Condition | Severity | Message | InstallHint |
|---|---|---|---|
| core >= floor | Pass | `v0.7.0` | — |
| core < floor | Warn | `v0.6.0 (requires >= v0.7.0)` | `brew upgrade unbound-force/tap/replicator` |
| command fails / times out | Warn | `version could not be verified` | `Run: replicator --version manually` |
| unparseable output | Warn | `version could not be verified` | `Run: replicator --version manually` |

The below-floor result carries
`InstallURL: https://github.com/unbound-force/replicator`,
matching the existing `installURL("replicator")` value for
non-brew installs. Hint text is hardcoded in the check,
following the established `checkReplicator` pattern (its
binary-not-found hint is likewise inline).

### D7: No early return; remaining sub-checks always run

Unlike binary absence (which early-returns because nothing
further can run), the version outcome never suppresses the
doctor delegation, `.uf/replicator/`, or MCP config checks.
An old binary still yields a full diagnostic picture.

### D8: Testing approach

Table-driven unit tests in `internal/doctor/doctor_test.go`
using the existing stub pattern (stub `LookPath`, `ExecCmd`,
`ExecCmdTimeout`, `ReadFile` maps — see
`TestCheckReplicator_AllPass`):

- v0.7.0 exactly → Pass, message contains `v0.7.0`.
- v0.8.2 → Pass.
- v0.6.0 → Warn, message contains floor, hint contains
  `brew upgrade`.
- `v0.6.0-7-gea86d27-dirty` (the verbatim real-world case)
  → Warn.
- `v0.7.0-3-gabcdef` (dev build past floor) → Pass.
- version command error / timeout → Warn, "version could not
  be verified", remaining sub-check results still present.
- unparseable output → Warn, "version could not be verified".
- binary absent → no `replicator version` result (existing
  early return preserved).
- Parser unit tests feed the verbatim captured outputs and
  malformed variants (missing `v`, missing patch, empty,
  bare `replicator version` with no token).

## Risks / Trade-offs

- **Version output format drift**: the parser depends on the
  `replicator version vX.Y.Z...` line format. Mitigation:
  fail-open Warn path plus regression tests that pin the
  verbatim observed format; if Replicator ever changes the
  format, doctor degrades to a warning, never a false pass
  or crash.
- **Prereleases at the floor core pass** (`v0.7.0-rc1` counts
  as `v0.7.0`): accepted; the floor targets stale installs,
  not pre-release hygiene.
- **Warn does not block CI or scripts** on old versions:
  intentional per Composability First; the cost is that
  stale installs persist until a human acts on the warning.
  Escalating to Fail later is a one-line severity change if
  the org decides Replicator is a hard dependency.
- **brew-centric hint**: RPM and manual installs get the
  releases URL rather than a platform-specific upgrade
  command; extending `environ.go` with per-platform upgrade
  hints is deferred until users ask for it.
- **Floor bumps require a code change**: accepted; the
  constant plus its tests make the bump mechanical.
