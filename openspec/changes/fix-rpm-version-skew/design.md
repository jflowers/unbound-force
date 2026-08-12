## Context

`uf setup` installs companion tools (Gaze, Replicator) using a
fallback chain: Homebrew → dnf (RPM) → `go install` → skip. The
dnf path constructs GitHub Release RPM URLs via `rpmURL()`, which
takes a version parameter. Today, `installGaze()` (line 669) and
`installReplicator()` (line 857) pass `opts.Version` — the uf
binary's own build-time version — as that parameter.

Since companion tools are independently versioned (e.g., Dewey
v3.2.0 vs uf v0.15.0), the constructed URL references a
non-existent release, producing 404 errors on Fedora/RHEL.

This design describes how to resolve each companion tool's actual
latest release version before constructing the RPM URL.

## Goals / Non-Goals

### Goals
- Resolve the correct latest release version per companion tool
  before constructing RPM download URLs
- Preserve the existing DI pattern (`Options` struct with
  injectable functions) for testability
- Fail gracefully when version resolution is unavailable — fall
  through to the next install method in the chain
- Validate resolved version tags before URL interpolation

### Non-Goals
- Adding RPM support for Dewey (currently uses Homebrew/go only)
- Pinning companion tools to specific versions (always latest)
- Supporting pre-release or draft GitHub Releases
- GPG signature verification of downloaded RPMs (separate concern)
- Caching resolved versions across `uf setup` invocations

## Decisions

### D1: Resolution strategy — `gh release view`

Use `gh release view --repo {repo} --json tagName` to resolve
the latest release tag. This approach:

- Reuses the `gh` CLI already required by `uf setup`
- Inherits the user's GitHub authentication context
- Avoids rate-limiting issues (authenticated requests get
  5,000 req/hr vs 60 req/hr unauthenticated)
- Returns structured JSON, simplifiable to `--json tagName -q .tagName`

**Step ordering note**: `buildSteps()` installs Gaze at step 2
and `gh` CLI at step 3. On a fresh system without `gh`
pre-installed, `ResolveRelease` will fail for Gaze because `gh`
is not yet available. This is addressed by D6 (step reorder)
below. Replicator (step 8) is unaffected since it runs after
`gh` installation.

`gh` handles auth negotiation internally and works without a
token for public repos. No unauthenticated API fallback is
needed.

### D2: Injectable dependency via `Options.ResolveRelease`

Add a new field to `Options`:

```go
// ResolveRelease resolves the latest release tag for a GitHub
// repository (e.g., "unbound-force/gaze" → "0.15.0"). Returns
// the version string without the "v" prefix. Returns an error
// if resolution fails (network, no releases, invalid format).
ResolveRelease func(repo string) (string, error)
```

The production default calls `gh release view`. Tests inject a
stub that returns controlled values without network access.

This follows the established pattern: `ExecCmd`, `LookPath`,
`EvalSymlinks`, `Getenv`, `ReadFile`, `WriteFile` are all
injectable functions on `Options`.

### D3: Version tag validation

The resolved tag MUST be validated before URL interpolation:

0. Trim leading and trailing whitespace (including newlines) from
   the raw `ExecCmd` output (`strings.TrimSpace`)
1. Strip leading `v` prefix if present (GoReleaser tags as `v1.2.3`)
2. Verify the result matches `^[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}$`
   (basic semver — major.minor.patch, bounded digit counts, end
   anchor to reject trailing content like `-rc.1`)
3. Reject tags longer than 20 characters (defense-in-depth)

Invalid tags produce an error, causing the RPM path to return a
`stepResult` with action "failed" and a descriptive detail. The
caller (`installGaze` / `installReplicator`) falls through to
the next method in the chain.

### D4: Call site changes

Both `installGaze()` and `installReplicator()` change from:

```go
return installViaRpm(opts, "Gaze", "unbound-force/gaze", opts.Version)
```

to:

```go
version, err := opts.ResolveRelease("unbound-force/gaze")
if err != nil {
    return stepResult{
        name:   "Gaze",
        action: "failed",
        detail: "cannot resolve latest release: " + err.Error(),
        err:    err,
    }
}
return installViaRpm(opts, "Gaze", "unbound-force/gaze", version)
```

The fallback chain in the `switch` statement handles the "failed"
result by falling through to the `go install` or skip path, matching
the existing pattern where RPM failures are recoverable.

**Correction**: The current fallback chain does NOT automatically
retry with the next method — each `case` branch returns directly.
The failed RPM result will be returned as-is. This is acceptable:
the user sees a clear error message with context, and can either
re-run with `--method go` or configure `tool_methods.gaze: go` in
their config. This matches the existing behavior when dnf itself
fails (line 993-1001).

### D5: `opts.Version` field — no removal

The `opts.Version` field is NOT removed. It may still be used for
other purposes (e.g., displaying the uf binary version during
setup). The GoDoc comment is updated to clarify it is the uf
binary's version, not used for companion tool RPM URLs.

This design resolves versions independently per tool, making
coordinated releases unnecessary. Issue #455's alternative
approach ("OR decision documented to coordinate releases") is
rejected because it would re-introduce the Principle II violation
by coupling hero release cadences.

### D6: Step reorder — `installGH` before `installGaze`

`buildSteps()` MUST be modified to install the GitHub CLI before
Gaze. The current order places Gaze at step index 1 and `gh` at
step index 2. Since `ResolveRelease` requires `gh`, the `gh`
installation step MUST precede any step that may invoke
`ResolveRelease`.

New step order (affected steps only):
1. OpenCode (unchanged)
2. GitHub CLI (moved up from step 3)
3. Gaze (moved down from step 2)
4. Node.js (unchanged)
...remaining steps unchanged.

This is a minimal reorder that preserves all other step
dependencies. `installGH` has no dependency on Gaze or OpenCode,
so moving it earlier is safe.

### D7: `repo` parameter validation

The `repo` parameter passed to `ResolveRelease` MUST be validated
before being interpolated into the `gh release view --repo {repo}`
command. Although today's callers pass hardcoded string literals,
the function signature accepts arbitrary strings. Per Constitution
Principle V (Security by Default), inputs to security-sensitive
operations MUST be validated.

The `repo` parameter MUST match `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`
(GitHub owner/repo format). Invalid values MUST produce an error
before `ExecCmd` is called.

## Risks / Trade-offs

### R1: Network dependency at resolution time

Version resolution adds a network call (`gh release view`) before
the RPM download. The resolution uses the GitHub API (via `gh`)
while the RPM download uses GitHub Releases CDN — these are
different services. However, since the current code always
produces 404s with the wrong version, the resolution step adds
no new failure mode in practice. If the API is unreachable, the
error handling causes a graceful failure with an actionable
error message.

### R2: gh CLI version requirements

`gh release view --json` requires gh >= 2.0. The `installGH`
step checks for `gh` availability but not its version. On older
systems with gh 1.x, the `--json` flag will produce an error
caught by `ResolveRelease`'s error handling, causing a graceful
fallback. This is acceptable — gh 2.0 was released in 2021 and
all supported platforms ship recent versions.

### R3: Rate limiting on public repos

`gh` uses the user's auth token when available. For unauthenticated
users on public repos, GitHub allows 60 API requests/hour. A single
`uf setup` run resolves at most 2 versions (Gaze, Replicator),
well within this limit.

### R4: TOCTOU between resolution and download

There is a theoretical window between resolving the latest tag and
downloading the RPM where a new release could be published. This is
harmless — the user gets the version that was latest at resolution
time, which is a valid release. Accepted.

### R5: RPM content integrity — accepted risk

Constitution Principle V requires content-hash verification for
downloads outside a package manager's built-in verification.
`dnf install -y {url}` downloads an RPM from a GitHub Release URL.
For direct URL installs, `dnf` does not apply `gpgcheck` — the
RPM is installed without signature verification unless the signing
key is in the RPM keyring. GoReleaser does not sign RPMs by
default.

This is an accepted risk for this bugfix scope:
- The RPM is served over HTTPS from GitHub's CDN (transport
  security)
- GoReleaser produces `checksums.txt` but `dnf` cannot consume it
- Adding manual checksum verification is a separate enhancement
  (not in scope for this change)
- This pre-existing gap exists in the current code and is not
  introduced by this change

## Test Strategy

All tests are unit tests using injected `ResolveRelease` stubs.
No integration or e2e tests are required — the `ExecCmd` DI
pattern provides hermetic testing without network access.

Coverage targets:
- All FR-002 validation paths (valid, invalid, whitespace, empty,
  pre-release, too long, CLI failure)
- Both FR-003 call sites (Gaze and Replicator)
- Error path (resolution failure returns descriptive stepResult)
- Dry-run path (URL displayed with resolved version)
- Repo validation (FR-004 malformed input)

Coverage ratchets in CI will enforce no regression from the
existing baseline.

<!-- scaffolded by uf vdev -->
