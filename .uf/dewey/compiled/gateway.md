---
tier: validated
compiled_at: 2026-08-14T19:53:39Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - gateway-2
  - gateway-3
  - gateway-4
  - gateway-5
topic: gateway
related: security-checklist, fail-fast, sandbox
---

# Gateway LLM Reverse Proxy

## Current State (August 2026)

The gateway (`internal/gateway/`) is a reverse proxy for LLM providers (Vertex AI, Bedrock, Anthropic). 4 learnings capture authentication, token lifecycle, and regional routing patterns.

## Key Patterns

### Regional Routing
Global region settings are incompatible with `rawPredict` Claude endpoints on Vertex AI. The gateway MUST error explicitly rather than silently falling back to `us-east5`. Fail-fast prevents confusing downstream errors from wrong-region responses.

### Token Lifecycle (Critical)
Three interrelated patterns govern token refresh:

1. **Failed refresh must clear stale tokens atomically**: When background token refresh fails, the old token MUST be cleared under `tokenMu` lock. Continuing to forward a stale token produces `ACCESS_TOKEN_TYPE_UNSUPPORTED` (401) errors that are difficult to diagnose.

2. **Proactive refresh with bounded blocking**: Use `sync.Mutex.TryLock()` with a 5-second timeout via goroutine+channel pattern. This prevents request pile-up during refresh while ensuring only one goroutine refreshes at a time.

3. **Detached gateway process**: When running detached, redirect output to `.uf/gateway.log` with `0600` permissions. This enables debugging token issues without exposing credentials.

### Test Breakage Pattern
Adding `tokenExpiry`/`credExpiry` fields to the gateway config struct breaks existing tests because zero-value `time.Time` is in the past (treated as expired). Fix: update ALL struct literals in tests (found 8 sites) to set valid future times.

## Credential Paths
- **Vertex AI**: Prefer `gcloud` shell-out (`os/exec`, injectable `ExecCommandFunc`, `sync.RWMutex` double-check cache) over manual `DEWEY_VERTEX_ACCESS_TOKEN` environment variable. Tokens expire ~1hr, making env vars a UX anti-pattern for long-running `dewey serve`.
- **Bedrock**: Uses `aws configure export-credentials`, not direct env-var reads (`internal/gateway/refresh.go`).

## History
- gateway-2, gateway-3: Token lifecycle and regional routing
- gateway-4: Proactive refresh pattern
- gateway-5: Test breakage from time field additions
