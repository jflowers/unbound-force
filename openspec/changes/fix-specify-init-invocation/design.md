## Context

`uf init` delegates sub-tool initialization to
`initSimpleTool()` (scaffold.go:1608-1626), which
builds arguments as `append([]string{"init"}, extraArgs...)`.
The specify entry in `simpleTools` (scaffold.go:1500-1501)
passes `nil` for extraArgs, producing bare `specify init`.

Upstream specify-cli (>= 0.9.4, current 0.16.2) re-
architected `init`:
- Bare `specify init` requires a project name or `--here`
  flag; exits 1 without either.
- `--ai` replaced by `--integration`; non-interactive
  sessions default to `copilot`, not `opencode`.
- Templates are now bundled in the wheel (`core_pack/`),
  eliminating the GitHub Releases download that caused
  the original #216 failure.
- `--offline` forces use of bundled assets.

The fix is a one-line change to the extraArgs in the
`simpleTools` slice, plus test updates.

## Goals / Non-Goals

### Goals

- Restore `uf init` creating `.specify/` with the correct
  OpenCode integration scaffolding.
- Make specify initialization fully non-interactive and
  offline-capable (Principle I: Autonomous Collaboration).
- Update test assertions to match the new invocation.
- Update spec 027 documentation to reflect the new CLI
  contract.

### Non-Goals

- Pinning specify-cli to an exact version. The current
  PyPI install (`uv tool install specify-cli`) works;
  version pinning is a separate concern.
- Changing the install source (PyPI vs. git). The root
  cause (missing bundled assets) was fixed upstream.
- Adding `--ignore-agent-tools`. In the real `uf init`
  flow, `uf setup` installs opencode first, so the
  agent-tools check will pass. This flag was only needed
  during isolated verification testing.
- Changing `--force` behavior. `uf init` already handles
  force via the sentinel check (`os.Stat(sentinelPath)`)
  and the `opts.Force` flag on `initSubTools`.

## Decisions

### D1: Use `--here` instead of `.` as project argument

The new specify CLI accepts both `specify init .` (which
internally sets `here=True`) and `specify init --here`.
We use `--here` because it is the explicit flag form
recommended by the upstream CLI, and it avoids positional
argument ambiguity when combined with other flags.

### D2: Include `--offline` flag

The `--offline` flag forces use of bundled `core_pack/`
assets, bypassing any network download path. This:
- Eliminates the original #216 failure mode (GitHub
  Releases with 0 assets) even on older versions
- Ensures deterministic output from bundled assets
  (Principle III: Observable Quality)
- Removes network dependency during initialization
  (Principle I: Autonomous Collaboration)

### D3: Keep PyPI install source unchanged

The proposal confirmed that current PyPI specify-cli
bundles templates. Switching to git source would:
- Pull unversioned main (breaking-change risk)
- Require build toolchain (hatchling)
- Be slower (clone + build vs. wheel download)

No change to setup.go `installSpecify()`.

### D4: Pass flags via `simpleTools` extraArgs

The `initSimpleTool` function already supports extraArgs
(used by openspec with `["--tools", "opencode"]`). The
fix adds `["--here", "--integration", "opencode", "--offline"]`
to the specify entry's args field, requiring zero
structural changes to the initialization framework.

## Risks / Trade-offs

### R1: Future specify CLI flag changes

If upstream removes or renames `--here`, `--integration`,
or `--offline`, `uf init` will break again. **Mitigation**:
These are core flags in the current architecture (not
experimental). Version pinning (non-goal) would provide
additional protection if needed later.

### R2: Speckit commands directory conflict

`specify init --integration opencode` creates
`.opencode/commands/speckit.*.md` files. `uf init`
also scaffolds `.opencode/commands/` from embedded
assets. The specify sentinel check (`.specify` exists
→ skip) prevents double-initialization, and `uf init`'s
own command scaffolding runs before sub-tool init.
File-level conflicts are unlikely but should be
verified during implementation.

### R3: Mocked tests do not catch CLI contract drift

Current tests mock `ExecCmd` and only verify argument
lists. They cannot detect when the real specify CLI
changes its interface. This is a pre-existing limitation
(not introduced by this change). A future integration
test against the real CLI would provide stronger
assurance but is out of scope.

**Coverage strategy**: Unit tests via mocked `ExecCmd`
(existing pattern). Integration testing against real
`specify-cli` is out of scope; the mocked tests verify
argument construction only, not CLI contract
compatibility. A follow-up issue for integration testing
of the specify CLI contract could be filed separately.
