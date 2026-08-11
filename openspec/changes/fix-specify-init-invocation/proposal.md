## Why

`uf init` calls `specify init` with no arguments
(scaffold.go:1500-1501, nil extraArgs). The upstream
Speckit CLI (specify-cli >= 0.9.4) re-architected its
`init` command: bare `specify init` now exits with
error 1 ("Must specify either a project name, use '.'
for current directory, or use --here flag"), the `--ai`
flag was removed and replaced by `--integration`, and
non-interactive sessions default to Copilot instead of
OpenCode.

This means `uf init` silently fails to create `.specify/`
on every new project. Fixes #216.

The original report's root cause (PyPI wheels downloading
templates from GitHub Releases at runtime) has been fixed
upstream — current PyPI specify-cli bundles all assets in
the wheel. The proposed git-source fix is no longer needed
and would introduce risk (unversioned main, build toolchain
dependency, slower installs).

Additionally, issue #213 reported that `specify init`
needs interactive input (no TTY). The new `--here` +
`--integration` flags resolve this by making the command
fully non-interactive.

## What Changes

### Modified Capabilities

- `uf init` specify invocation: Change from bare
  `specify init` to
  `specify init --here --integration opencode --offline`
  by updating the `simpleTools` entry in scaffold.go to
  pass `["--here", "--integration", "opencode", "--offline"]`
  as extraArgs instead of nil.

### Removed Capabilities

- None.

### New Capabilities

- None. This is a bugfix that restores the intended
  behavior of `uf init` creating `.specify/` with the
  correct OpenCode integration.

## Impact

- **scaffold.go**: Update the specify entry in
  `simpleTools` (line 1500-1501) to include
  `--here --integration opencode --offline` as extraArgs.
- **scaffold_test.go**: Update mocked tests (~4066-4171,
  ~6359-6398) that assert bare `specify init` to expect
  the new argument list.
- **setup.go**: No change needed — the PyPI install
  (`uv tool install specify-cli`) already works with
  current bundled versions.
- **setup_test.go**: No change needed (install path
  unchanged).
- **spec 027**: Line 307 asserts "specify init is
  non-interactive" — needs rewording to reflect the
  new CLI contract (it is non-interactive WITH the
  correct flags).
- **CHANGELOG.md**: Bugfix entry.

## Constitution Alignment

Assessed against the Unbound Force org constitution v1.2.0.

### I. Autonomous Collaboration

**Assessment**: PASS

This change ensures `uf init` correctly scaffolds
`.specify/` with OpenCode integration artifacts,
maintaining the artifact-based collaboration model.
The `--offline` flag strengthens autonomy by removing
network dependency during initialization.

### II. Composability First

**Assessment**: PASS

The change keeps specify-cli as an independently
installed tool via PyPI. No new mandatory dependencies
are introduced. The `--integration opencode` flag
explicitly selects the correct integration without
requiring other heroes to be present.

### III. Observable Quality

**Assessment**: PASS

The fix ensures `.specify/` initialization produces
the expected integration manifests (`integration.json`,
`opencode.manifest.json`) with provenance metadata
(version, timestamps, file hashes). The `--offline`
flag produces deterministic output from bundled assets.

### IV. Testability

**Assessment**: PASS

Existing tests mock `ExecCmd` and verify argument
lists. The change updates expected arguments in mocked
tests. The fix was verified live against specify-cli
0.16.2: bare `specify init` fails (exit 1),
`specify init --here` defaults to Copilot,
`specify init --here --integration opencode --offline`
produces correct `.specify/` + `.opencode/commands/`
scaffolding.

### V. Security by Default

**Assessment**: PASS

Keeping PyPI install (vs. git source) uses the package
manager's built-in verification. The `--offline` flag
eliminates runtime network downloads, reducing the
attack surface during project initialization. No new
dependencies are added.
