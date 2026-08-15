---
tier: validated
compiled_at: 2026-08-14T19:57:14Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: security-checklist
related: gateway, sandbox, mcp-transport, review-council
---

# Theme: Security Checklists from Adversary Findings

## Current State (August 2026)

The Adversary (Divisor) agent consistently identifies security patterns that should be standardized into reusable checklists. Findings span proxy services, credential handling, container operations, and CI pipelines.

## Proxy/Service Security Checklist

Derived from ollamaproxy-1 (rated from first principles by Adversary):

1. **SSRF Prevention**: Loopback-only validation for proxy targets
2. **Token Redaction**: `redactToken()` in all log output
3. **Input Validation**: Model name safe-charset validation (`[a-zA-Z0-9._-]+`) to prevent path traversal
4. **Body Limits**: 10MB request/response body limit (`io.LimitReader`)
5. **File Permissions**: Log files at `0o600`
6. **Package Extraction**: Extract reusable security primitives (`internal/pidfile/`, `internal/auth/`) BEFORE building new commands to avoid backwards dependencies

## CI/Pipeline Security

1. **Shell Injection**: Pass `github.ref`/`inputs` via `env:` bindings, NOT `${{ }}` string interpolation (replicator ci-release-preflight, Adversary caught)
2. **String Construction**: Shell commands via string concatenation are fragile even when sanitized — `projectName` regex is necessary but insufficient (security-20260512)
3. **Branch Validation**: Prevent releases from feature branches (replicator)

## Credential Handling

1. **Mask display**: Show only last 4 characters (`maskKey()`)
2. **Never in argv**: Credentials via stdin only, never command-line arguments (sandbox gh auth)
3. **Token expiry awareness**: Env vars with expiring tokens are UX anti-patterns for long-running processes
4. **Atomic clearing**: Failed token refresh MUST clear stale token atomically, not continue forwarding

## AI/LLM-Specific

1. **Model name validation**: `[a-zA-Z0-9._-]+` before git trailer insertion — prevents trailer injection, shell injection, newline injection (ai-attribution)
2. **Extraction algorithm**: Strip after last `/`, after first `@` — explicit, documented, testable
3. **Fallback value**: `'unknown-model'` must pass validation

## Container Security

1. **Probe images**: Use `busybox:latest --entrypoint stat`, NOT dev images (1GB+, may execute entrypoints, may read files) — Adversary HIGH
2. **User namespace**: `--userns=keep-id:uid=1000` for host user mapping
3. **File permission**: `.uf/gateway.log` at `0600`

## Convention Pack Candidate

**Proposed rule**: "Any new service endpoint, proxy, or CLI tool accepting external input MUST pass the Adversary Security Checklist: SSRF validation, token redaction, input charset validation, body size limits, file permission enforcement."

## History
- ollamaproxy-1, ollamaproxy-2: Full proxy security audit
- ai-attribution: Model name injection prevention
- ci-release-preflight: Shell injection via github.ref
- sandbox learnings: Container security patterns
- gateway learnings: Token lifecycle security
