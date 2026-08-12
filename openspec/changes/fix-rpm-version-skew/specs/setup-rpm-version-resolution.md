# Setup RPM Version Resolution

Delta spec for `internal/setup/setup.go` — resolves companion
tool versions independently for RPM download URLs.

## ADDED Requirements

### FR-001: ResolveRelease injectable dependency

The `Options` struct MUST include a `ResolveRelease` field of
type `func(repo string) (string, error)` that resolves the
latest release tag for a given GitHub repository. The function
MUST return the version string without the `v` prefix. The
`defaults()` method MUST initialize this field to a production
implementation when nil.

#### Scenario: Default initialization

- **GIVEN** an `Options` struct with `ResolveRelease` set to nil
- **WHEN** `defaults()` is called
- **THEN** `ResolveRelease` MUST be set to a function that
  invokes `gh release view --repo {repo} --json tagName
  -q .tagName` via `ExecCmd`

#### Scenario: Test injection

- **GIVEN** an `Options` struct with `ResolveRelease` set to a
  stub function
- **WHEN** `defaults()` is called
- **THEN** the stub function MUST NOT be overwritten

### FR-002: Version tag validation

The production `ResolveRelease` implementation MUST validate
the resolved tag before returning it:

0. Trim leading and trailing whitespace (including newlines)
   from the raw `ExecCmd` output
1. Strip a leading `v` prefix if present
2. Verify the result matches `^[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}$`
3. Reject values longer than 20 characters

Invalid tags MUST produce an error with a descriptive message
including the raw tag value.

#### Scenario: Valid tag with v prefix

- **GIVEN** `gh release view` returns tag `v1.2.3`
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return `("1.2.3", nil)`

#### Scenario: Valid tag without prefix

- **GIVEN** `gh release view` returns tag `1.2.3`
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return `("1.2.3", nil)`

#### Scenario: Invalid tag format

- **GIVEN** `gh release view` returns tag `latest`
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return an error containing "invalid release
  tag format"

#### Scenario: Tag too long

- **GIVEN** `gh release view` returns a tag exceeding 20
  characters
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return an error containing "release tag
  too long"

#### Scenario: Tag with trailing whitespace

- **GIVEN** `gh release view` returns `"v1.2.3\n"` (trailing
  newline)
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return `("1.2.3", nil)`

#### Scenario: Empty tag

- **GIVEN** `gh release view` returns an empty string (no
  releases or null jq result)
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return an error containing "invalid release
  tag format"

#### Scenario: Pre-release tag rejected

- **GIVEN** `gh release view` returns tag `v1.2.3-rc.1`
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return an error containing "invalid release
  tag format"

#### Scenario: gh CLI failure

- **GIVEN** `gh release view` returns an error (network, auth,
  no releases)
- **WHEN** `ResolveRelease("unbound-force/gaze")` is called
- **THEN** it MUST return the error wrapped with context:
  `"resolve latest release for {repo}: {err}"`

### FR-004: `repo` parameter validation

The `repo` parameter passed to `ResolveRelease` MUST be
validated to match the GitHub `owner/repo` format before being
passed to `ExecCmd`. Invalid values MUST produce an error.

#### Scenario: Valid repo format

- **GIVEN** repo is `"unbound-force/gaze"`
- **WHEN** `ResolveRelease` is called
- **THEN** validation MUST pass (proceed to `gh` invocation)

#### Scenario: Malformed repo format

- **GIVEN** repo is `"not-a-valid-repo"`
- **WHEN** `ResolveRelease` is called
- **THEN** it MUST return an error containing "invalid
  repository format" without invoking `ExecCmd`

### FR-003: RPM path uses resolved version

`installGaze()` and `installReplicator()` MUST call
`opts.ResolveRelease()` to obtain the companion tool's version
before passing it to `installViaRpm()`. The functions MUST NOT
pass `opts.Version` to `installViaRpm()`.

#### Scenario: Successful RPM install with resolved version

- **GIVEN** `ResolveRelease("unbound-force/gaze")` returns
  `"0.15.0"`
- **AND** uf's `opts.Version` is `"0.16.0"`
- **WHEN** `installGaze()` selects the dnf method
- **THEN** the RPM URL MUST contain `v0.15.0` (Gaze's version)
- **AND** the RPM URL MUST NOT contain `v0.16.0` (uf's version)

#### Scenario: Successful RPM install with resolved Replicator version

- **GIVEN** `ResolveRelease("unbound-force/replicator")` returns
  `"2.1.0"`
- **AND** uf's `opts.Version` is `"0.16.0"`
- **WHEN** `installReplicator()` selects the dnf method
- **THEN** the RPM URL MUST contain `v2.1.0` (Replicator's version)
- **AND** the RPM URL MUST NOT contain `v0.16.0` (uf's version)

#### Scenario: Resolution failure returns descriptive error

- **GIVEN** `ResolveRelease("unbound-force/gaze")` returns an
  error
- **WHEN** `installGaze()` selects the dnf method
- **THEN** it MUST return a `stepResult` with action "failed"
- **AND** the detail MUST include the resolution error message

#### Scenario: Dry run with resolved version

- **GIVEN** `opts.DryRun` is true
- **AND** `ResolveRelease("unbound-force/gaze")` returns
  `"0.15.0"`
- **WHEN** `installGaze()` selects the dnf method
- **THEN** the dry-run detail MUST show the URL with `v0.15.0`

## MODIFIED Requirements

### Requirement: Options.Version field documentation

The GoDoc comment on `Options.Version` MUST be updated to
clarify it is the uf binary's own version and MUST NOT be used
for companion tool RPM URL construction.

Previously: "Version is the current binary version (e.g.,
'0.12.0'), used to construct GitHub Release RPM URLs."

New: "Version is the uf binary's build-time version (e.g.,
'0.12.0'). Not used for companion tool RPM URLs — those use
ResolveRelease to obtain the tool's own latest version."

### Requirement: installViaRpm version parameter semantics

The `version` parameter to `installViaRpm()` MUST represent
the target tool's version, not the uf binary's version. No
signature change is required — the semantics are clarified by
the callers' responsibility to resolve the correct version.

Previously: callers passed `opts.Version` (uf's version).

New: callers MUST pass a version obtained from
`opts.ResolveRelease()` or an equivalent per-tool resolution.

## REMOVED Requirements

None. No requirements are removed by this change.

<!-- scaffolded by uf vdev -->
