## ADDED Requirements

### Requirement: Replicator version floor

The `uf doctor` Replicator check group (Spec 024, FR-011) MUST
verify that an installed Replicator is v0.7.0 or greater. The
floor value MUST be defined exactly once, as a named constant
in the doctor package, so future floor bumps are single-point
changes.

When the `replicator` binary is present, the check group MUST
execute a version-floor sub-check that runs the Replicator
version command, parses the reported version, and compares it
against the floor. The comparison MUST use semantic-version
ordering of the major.minor.patch core and MUST ignore
development or build suffixes (for example, a git-describe dev
build past v0.7.0 satisfies the floor).

The sub-check result MUST have severity Warn — never Fail —
in all non-passing outcomes, consistent with the Spec 024
design decision that every Replicator group check warns rather
than fails because Replicator is optional under Constitution
Principle II (Composability First). An outdated install MUST
NOT be treated more harshly than a missing install.

The sub-check MUST NOT suppress the remaining sub-checks of
the group (doctor delegation, `.uf/replicator/`, MCP config);
they MUST still execute regardless of the version outcome.

The sub-check result MUST serialize into `uf doctor` JSON
output alongside the existing results, with the detected
version, the applicable floor, and the severity visible to
machine consumers.

A change record MUST be added to `CHANGELOG.md` describing the
new version floor and the upgrade path for older installs.

#### Scenario: Version at or above the floor passes

- **GIVEN** the `replicator` binary is in PATH and reports
  version v0.7.0 or greater
- **WHEN** `uf doctor` runs the Replicator check group
- **THEN** the version-floor sub-check reports Pass with the
  detected version in its message

#### Scenario: Version below the floor warns with an upgrade hint

- **GIVEN** the `replicator` binary is in PATH and reports a
  version below v0.7.0 (for example v0.6.0)
- **WHEN** `uf doctor` runs the Replicator check group
- **THEN** the version-floor sub-check reports Warn, its
  message states the detected version and the floor, and its
  install hint tells the user how to upgrade
- **AND** `uf doctor` completes without failing on this check

#### Scenario: Dev build past the floor satisfies the floor

- **GIVEN** the `replicator` binary reports a development
  version whose core is at or above v0.7.0 (for example
  v0.7.0-3-gabcdef)
- **WHEN** `uf doctor` runs the version-floor sub-check
- **THEN** the sub-check reports Pass, because development
  suffixes are ignored in the comparison

#### Scenario: Version command failure fails open to a warning

- **GIVEN** the `replicator` binary is in PATH but its
  version command exits non-zero or times out
- **WHEN** `uf doctor` runs the version-floor sub-check
- **THEN** the sub-check reports Warn with a message that the
  version could not be verified
- **AND** the remaining Replicator group sub-checks still run

#### Scenario: Unparseable version output fails open to a warning

- **GIVEN** the `replicator` binary is in PATH but its version
  command emits output the parser cannot extract a version
  from
- **WHEN** `uf doctor` runs the version-floor sub-check
- **THEN** the sub-check reports Warn with a message that the
  version could not be verified
- **AND** the remaining Replicator group sub-checks still run

#### Scenario: Absent binary preserves existing early return

- **GIVEN** the `replicator` binary is not in PATH
- **WHEN** `uf doctor` runs the Replicator check group
- **THEN** the group reports the existing binary-not-found
  warning and no version-floor result is emitted, preserving
  the Spec 024 early-return behavior

#### Scenario: Version verdict visible in JSON output

- **GIVEN** the `replicator` binary is in PATH reporting any
  version
- **WHEN** `uf doctor --format json` runs
- **THEN** the Replicator check group's results include the
  version-floor result with its severity and message, so JSON
  consumers can key on it
