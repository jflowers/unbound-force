## Why

`uf setup` constructs RPM download URLs for companion tools (Gaze,
Replicator) using the `uf` binary's own build-time version
(`opts.Version`). Since these tools are independently versioned —
Dewey is at v3.2.0 while uf is at v0.15.0 — the constructed URLs
point to non-existent GitHub Releases, producing 404 errors on
Fedora/RHEL systems using the dnf/RPM fallback path.

This violates Constitution Principle II (Composability First):
heroes must be independently installable. Coupling companion tool
installation to uf's release cadence creates a time bomb — every
release where versions diverge breaks the RPM install path.

Fixes #455. Related: #268 (introduced RPM support), #214
(Fedora/RHEL workarounds), PR #270 (implementation that introduced
the coupling).

## What Changes

Replace the hardcoded `opts.Version` at the two `installViaRpm()`
call sites with a dynamically resolved latest release version for
each companion tool. Add a `resolveLatestRelease()` helper that
queries the companion tool's actual latest GitHub Release tag.

## Capabilities

### New Capabilities
- `resolveLatestRelease`: Resolves the latest release tag for a
  given GitHub repository, using `gh release view` or the GitHub
  API. Handles network failures gracefully.

### Modified Capabilities
- `installGaze`: Uses the resolved Gaze version instead of
  `opts.Version` when constructing RPM URLs.
- `installReplicator`: Uses the resolved Replicator version
  instead of `opts.Version` when constructing RPM URLs.

### Removed Capabilities
- None.

## Impact

- **Files**: `internal/setup/setup.go` (primary),
  `internal/setup/setup_test.go` (test updates)
- **Affected paths**: RPM/dnf fallback only. Homebrew (`@latest`)
  and `go install` (`@latest`) paths are unaffected.
- **Tools affected**: Gaze and Replicator only. Dewey does not
  use the RPM install path (line 1373: `"homebrew", "go"` only).
- **Runtime dependency**: `gh` CLI (already installed during
  setup). Graceful error with actionable message when resolution
  fails (e.g., `gh` not yet installed or network unavailable).
- **User-facing change**: `uf setup` on Fedora/RHEL will correctly
  install the latest version of companion tools regardless of uf's
  own version.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: PASS

This change does not alter artifact-based communication between
heroes. The version resolution is a build-time/install-time
concern that operates independently. No inter-hero runtime
coupling is introduced.

### II. Composability First

**Assessment**: PASS (fixes existing violation)

The current code violates this principle by coupling companion
tool installation to uf's version. This fix restores independent
installability — each companion tool's RPM URL will use its own
latest release version, not uf's. Heroes remain independently
versioned and installable.

### III. Observable Quality

**Assessment**: N/A

This change does not produce artifacts or quality metrics. The
RPM install step already reports structured `stepResult` output
with action and detail fields, which is preserved.

### IV. Testability

**Assessment**: PASS

The existing DI patterns (`opts.ExecCmd`, `opts.LookPath`) support
adding a version resolver as an injectable dependency. The
`rpmURL()` function is already a pure function testable in
isolation. New tests will verify the resolved version is used in
URL construction, and mock the GitHub API call for hermetic testing.

### V. Security by Default

**Assessment**: PASS (with design constraints)

The fix introduces a new external input (GitHub API response for
latest release tag). The design MUST:
- Validate the resolved tag format (semver pattern, bounded length)
  before interpolating into a URL
- Handle API failures gracefully (fall through to next install
  method, not crash)
- Use `gh` CLI (inherits user's auth context); `gh` works without
  a token for public repos
- Respect rate limits (5,000 req/hr authenticated, 60 req/hr
  unauthenticated via `gh`)
