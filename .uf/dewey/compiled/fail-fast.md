---
tier: validated
compiled_at: 2026-08-14T19:58:08Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: fail-fast
related: gateway, ci-coverage
---

# Theme: Fail-Fast Over Silent Defaults

## Current State (August 2026)

A consistent anti-pattern across all repos: code silently falls back to a default behavior when it should error explicitly. 10+ learnings demonstrate the cost of silent defaults.

## Examples by Severity

### CRITICAL: Silent Data Loss
- **dewey content-sanitizer**: `vault.ParseDocument()` silently overwrites metadata Properties during frontmatter parsing. Fix: merge-after-parse. Without this, stored metadata is lost without warning.
- **gaze ci-gate-integrity**: `int` type for threshold results reports `0` when data is unavailable — silently passes gates that should fail. Fix: `*int` (nil = unavailable, 0 = computed zero). Required changes across 5 types and 5 test files.

### HIGH: Wrong Behavior
- **gateway region**: Global region silently works for most endpoints but fails for rawPredict Claude. Fix: error explicitly, don't fall back to `us-east5`.
- **gateway token refresh**: Failed background refresh kept forwarding stale token → 401 errors. Fix: clear atomically on failure.
- **replicator coverage ratchet**: Renamed package produces 0.0% coverage. `bc` empty-string comparison silently passes. Fix: `[ -z ]` guard + awk `END { if (c>0) }` guard.
- **dewey identity format**: Old parser silently misparsed new format instead of erroring → wrong tag extraction.

### MEDIUM: Confusing Behavior
- **dewey source type**: Adding a new source type without updating `DetermineSanitizeMode()` switch → silent wrong sanitization mode.
- **sandbox autoDetectBackend**: Missing `.devcontainer/devcontainer.json` silently falls back to Podman instead of erroring when DevPod is intended.
- **unbound-force setup**: `buildSteps()` ordering installs tools in wrong order (Gaze before gh) → confusing failures.

## The Rule

**Prefer explicit errors over silent defaults when:**
1. The default behavior differs from user intent
2. Data could be silently lost or corrupted
3. The fallback masks a configuration problem
4. Zero-value has semantic meaning (use pointer types)

**Silent defaults ARE appropriate when:**
1. The default is genuinely the common case
2. The behavior is documented and expected
3. Backward compatibility requires it (but log a warning)

## Convention Pack Candidate

**Proposed rule**: "Functions MUST NOT silently fall back to default behavior when the fallback differs from documented intent. Use explicit errors, `*T` for nullable values, and `warn-by-default` for configuration-dependent behavior."

## Related Patterns
- Content sanitization: `warn-by-default` mode (dewey) — log warnings about potentially dangerous content rather than silently accepting or rejecting
- Tier system: Extending from 4-tier to 5-tier (adding `untrusted`) required tracing every consumer — silent defaults would have meant untrusted content treated as draft

## History
- dewey content-sanitizer: Silent metadata overwrite
- gaze ci-gate-integrity: int vs *int for nil-vs-zero
- gateway-2,3: Region fallback, token clearing
- replicator ci-coverage-ratchets: Empty-string silent pass
- dewey identity-format-change: Silent misparse
