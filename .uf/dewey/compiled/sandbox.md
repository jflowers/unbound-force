---
tier: validated
compiled_at: 2026-08-14T19:53:20Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - sandbox-4
  - sandbox-5
  - sandbox-6
  - sandbox-7
  - sandbox-8
  - sandbox-20260509T220954-jay-flowers
  - sandbox-20260510T173304-jay-flowers
  - sandbox-20260510T173310-jay-flowers
  - sandbox-20260510T213808-jay-flowers
  - sandbox-20260510T233923-jay-flowers
topic: sandbox
related: security-checklist, go-patterns, gateway
---

# Sandbox Configuration and Container Runtime

## Current State (August 2026)

The sandbox subsystem (`internal/sandbox/`) manages containerized development environments via Podman and DevPod backends. 10 learnings across unbound-force capture hard-won operational knowledge.

## Key Patterns

### Backend Detection
`autoDetectBackend()` requires BOTH `devpod` in PATH AND `.devcontainer/devcontainer.json` present. All 5 review council members flagged the risk of silent behavioral breaks if either condition changes. The function must also call `isPersistentWorkspace()` to detect new backends as they're added.

### DevPod Quirks
- **`--ide` flag**: Has no effect on OpenCode TUI (port 4096). Ignored entirely by the Podman code path.
- **`devcontainer.json` snapshots**: Created at workspace creation time and never re-read. New configuration requires `postStartCommand` for new workspaces + SSH fallback for existing ones.
- **DevPod v0.6.x**: Bun tunnel crash requires status-based suppression (`devpod status --output json` checking for `Running` state), NOT string matching on error output.
- **Environment variables**: Must use `--workspace-env` not `--dotfiles-env` (HIGH severity — must specify at design time, not discovered during implementation).

### Credential Injection
- `gh` CLI token: Piped via `git credential fill | gh auth login --with-token` in `postStartCommand`. Token MUST go through stdin only, never command-line arguments. Use `|| true` to prevent credential failures from blocking workspace startup.
- **User namespace mapping**: `runArgs --userns=keep-id:uid=1000` maps host user into container. macOS virtiofs has caveats with this approach.

### Security (Adversary-flagged)
- Container image selection for probes: Use `busybox:latest --entrypoint stat`, NOT development images. Dev images can be 1GB+, may execute arbitrary entrypoints, and may read sensitive files. This was rated HIGH severity.
- Status-based verification (`devpod status`) over stderr parsing — stderr format is unstable across versions.

### Testability
- `runtime.GOOS` is a compile-time constant — inject `GOOS string` or `Platform *PlatformConfig` for cross-platform testing.
- Constructor pattern `*T → (*T, error)` is mechanical; compiler finds all call sites that need updating.

## Gotchas
1. Adding a new `Options` field (e.g., `ResolveRelease`) breaks existing tests with nil panics — always add stubs to all test struct literals.
2. Two credential paths exist: gateway (no mount) vs direct-mount fallback — never conflate them in documentation or code.

## History
- sandbox-4 through sandbox-8: Core operational patterns (jay-flowers, May 2026)
- sandbox-20260509 through sandbox-20260510: DevPod integration details
- sandbox-20260510T233923: Security review findings
