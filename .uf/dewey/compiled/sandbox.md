---
tier: validated
compiled_at: 2026-10-25T16:33:22Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - sandbox-4
  - sandbox-5
  - sandbox-6
  - sandbox-7
  - sandbox-8
  - ollamaproxy-1
  - ollamaproxy-2
  - setup-doctor-1
  - devpod-1
  - doctor-1
  - setup-2
  - sandbox-20260509T220954-jay-flowers
  - sandbox-20260510T173304-jay-flowers
  - sandbox-20260510T173310-jay-flowers
  - sandbox-20260510T213808-jay-flowers
  - sandbox-20260510T233923-jay-flowers
  - sandbox-20260513T185048-jay-flowers
  - setup-testing-20260811T210704-jay-flowers
  - setup-architecture-20260811T210707-jay-flowers
  - doctor-20260816T184143-jay-flowers
topic: sandbox
---

# Sandbox

## Current State (October 2026)

### Backend detection and requirements

- `autoDetectBackend` (backend.go:130-139) selects DevPodBackend only when BOTH `devpod` is in PATH
  AND `.devcontainer/devcontainer.json` exists; otherwise it silently falls back to PodmanBackend —
  intentional and still live; the explicit devpod path errors when devcontainer.json is missing
  ("run `uf sandbox init`"). All 5 spec reviewers flagged silent DevPod preference as a behavioral
  break — dual requirement (binary + project config) is the standing pattern (sandbox-7).
- Requirements: Podman >= 4.3 (doctor `minVersion`, checks.go:136), DevPod >= 0.5.0. DevPod's
  standalone `podman` provider no longer exists: alias the Docker provider via `devpod provider add
  docker --name podman -o DOCKER_COMMAND=podman` (DOCKER_COMMAND, not DOCKER_HOST — socket path
  varies by UID and platform). Provider detection matches the exact first column of `devpod
  provider list`, never substrings (avoids "podman-custom" false positives).
- Adding a Backend: trace ALL callers of `isPersistentWorkspace()` (sandbox.go:459) — it originally
  detected only Podman named volumes, so DevPod workspaces silently fell through to the ephemeral
  Start() path and lost gateway wiring. It now also calls `devpod status` guarded by
  `LookPath("devpod")`.

### Credential isolation model

- Credential mounts were REMOVED (config.go:446-447) in favor of gateway-based isolation. Gateway
  path: sentinel `ANTHROPIC_API_KEY=gateway` (config.go:87) plus `ANTHROPIC_BASE_URL` pointing at
  `host.containers.internal:<port>`. No-gateway fallback forwards provider keys via `-e` env vars
  (config.go:133-148).
- Env injection into DevPod is a security boundary specified at design time, not during
  implementation (sandbox-8, HIGH severity, validated this cycle): `--workspace-env KEY=VALUE`
  (devpod.go:107-115, D4). `--dotfiles-env` applies only during dotfile installation and never
  reaches OpenCode at runtime — no `--dotfiles-env` exists anywhere in Go code. Spec reviews must
  reject deferred injection-mechanism decisions.
- Tokens flow via stdin pipes only, never command-line arguments (/proc/cmdline exposure).
- Gateway-adjacent proxies carry a reusable hardening checklist (ollamaproxy-1): loopback-only
  upstream SSRF validation, `redactToken` in errors, model-name charset validation before URL
  interpolation, 10MB body cap, 0o600 log perms. Shared lifecycle utilities (`internal/pidfile/`,
  `internal/auth/`) are extracted BEFORE building new proxy commands so nothing imports
  `internal/gateway` backwards.

### DevPod lifecycle and status handling

- DevPod snapshots devcontainer.json at workspace creation and never re-reads it; `uf sandbox init`
  is idempotent unless `--force` (sandbox.go:984-989). Template changes don't reach existing
  workspaces — handled by an SSH fallback in Start()/Create() (`devpod ssh <ws> -- sh -c 'nohup
  opencode serve --port 4096 ...'`, devpod.go:297) when the health check times out. Current
  postStartCommand only starts `opencode serve --port 4096`.
- `--ide` (none, vscode, openvscode, fleet, jupyternotebook, cursor) affects only the DevPod path;
  the ephemeral Podman path silently ignores it, and it never affects the OpenCode TUI (port 4096,
  `opencode attach`). Resolution chain: CLI flag > `UF_SANDBOX_IDE` > `.uf/config.yaml` sandbox.ide
  > "none".
- DevPod v0.6.x Bun tunnel crash ("The socket connection was closed unexpectedly", non-zero exit
  after successful workspace creation) is handled by status-based suppression, not string matching:
  on `devpod up` failure, check `devpod status <ws> --output json`; Running means a non-fatal
  tunnel issue (friendly message), not Running means report the original error (devpod.go:122-129,
  259-270).

### Probes and UID mapping

- Probe containers use busybox:latest with `--entrypoint stat` (detect.go:76, 87-93) — never dev
  images (quay.io/unbound-force/opencode-dev:latest): ~1GB pull vs ~5MB, and an image-defined
  entrypoint may execute services, bind ports, or read sensitive files despite `:ro` mounts.
  Adversary HIGH finding; standing pattern for any future probe container (sandbox-5).
- runArgs `--userns=keep-id:uid=1000,gid=1000` maps the host user to container UID 1000 (dev),
  eliminating the root:nobody ownership problem without chown, sudo, custom providers, or
  containerUser overrides; it reuses the Podman backend's `uidMappingArgs()` flag. `--uidmap` is
  the fallback. macOS depends on the Podman machine's virtiofs supporting keep-id (probed at
  detect.go:84-107); unsupported configs drop runArgs and chown via postStartCommand.
- Parallel-path discipline: buildPersistentRunArgs (podman.go) needed the same `--workdir` and
  `WORKSPACE=/workspace/<basename>` as the ephemeral buildRunArgs (config.go, PR #123 class) —
  `podman cp` of a directory plus filepath.Join trailing-dot normalization creates the directory
  itself, not its contents. When fixing one code path, always check parallel paths.

### Platform injection

- `runtime.GOOS` is a compile-time constant and cannot be overridden in tests: sandbox uses
  `opts.Platform *PlatformConfig` (OS, UIDMapSupported) to exercise darwin UID-probe logic on Linux
  CI runners, and `InitDevcontainerOptions.GOOS` drives cross-platform devcontainer generation.
  Doctor's `Options.GOOS` string is deliberately lighter (OS branching only) — always call
  `opts.goos()`, never `runtime.GOOS` directly.
- New Start() guards (parsePodmanVersion, isRootlessPodman) cascade-fail every existing test whose
  ExecCmd mock doesn't handle the new podman commands: add `podman --version` / `podman info`
  cases to the shared testOpts() helper or each individual test (sandbox-4).

### Doctor and setup integration

- Doctor enforces Podman >= 4.3 (minVersion, checks.go:136). Setup installs OpenCode -> GitHub CLI
  -> Gaze — gh before Gaze per D6, because gh-dependent helpers (ResolveRelease) require the CLI;
  fixed Aug 12 (e98360e), locked by TestBuildSteps_GHBeforeGaze.
- Doctor check pattern: `checkFoo(opts *Options) CheckResult` in checks.go, appended by the group
  function, `opts.ReadFile` for test injection, severity mapping (Fail = missing/required, Warn =
  misconfigured/optional, Pass = correct), InstallHint with runnable commands ("Run: uf init
  --force"), and fixture updates to TestCheckScaffoldedFiles / TestDoctorRun_AllPass.
- Setup churn gotchas: `[N/M]` step labels are hardcoded string literals in every fmt.Fprintf call
  — adding Podman/DevPod/DevPod-provider steps meant rewriting 13 labels plus assertions. Tool
  removal (mxf pattern): delete installXxx + coreTools entry, renumber steps, remove dedicated
  tests, and grep ALL test files for stale references. New DI fields (ResolveRelease, issue #455)
  nil-panic existing tests until stubs are injected; `defaults()` fills only nil fields.

## History

- Apr 2026: testability patterns established — Platform injection over runtime.GOOS, ExecCmd-mock
  cascades, busybox probe rule (Adversary HIGH).
- May 3 2026: Che -> DevPod backend replacement. isPersistentWorkspace extended; autoDetect dual
  requirement (all 5 reviewers flagged); sandbox-8 fixed --workspace-env at design time (HIGH) —
  validated Oct 2026 at devpod.go:107-115, with --dotfiles-env never landing in Go code.
- May 8 2026: DevPod Docker-provider aliasing (DOCKER_COMMAND), exact-match provider detection,
  doctor GOOS injection, setup step-label churn; shared pidfile/auth packages extracted so proxies
  stay independent of internal/gateway.
- May 10 2026: gh-credential relay (D9) added — postStartCommand piped `git credential fill` into
  `gh auth login --with-token` (stdin-only, `|| true` degradation) — then REMOVED the same day
  (commit 7e79388) after the DevPod v0.6.x tunnelserver crash; postStartCommand reduced to
  `opencode serve --port 4096`, stdin-only credentials remain guidance. Bun tunnel crash answered
  with status-based suppression; runArgs keep-id UID mapping added.
- May 13 2026: persistent-path --workdir/WORKSPACE parity fix (same class as PR #123).
- Aug 2026: setup ordering fix (gh before Gaze, issue #455, e98360e, TestBuildSteps_GHBeforeGaze);
  ResolveRelease DI-stub discipline; doctor check pattern codified.
- Oct 2026 audit: credential mounts fully replaced by the gateway sentinel model with -e
  provider-key fallback; --workspace-env confirmed live; silent Podman fallback, idempotent init,
  and status-based suppression verified current.
