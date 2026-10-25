---
tier: validated
compiled_at: 2026-10-25T16:40:58Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
  - error-handling-20261023T171909-jay-flowers
topic: fail-fast
---

# Fail Fast

## Current State (October 2026)

The anti-pattern: code silently falls back to a default, or reports
success with zero values masking a failure, when it should error
explicitly. All claims verified against current code.

### Still live

- **sandbox autoDetectBackend** (unbound-force
  `internal/sandbox/backend.go:130-139`): DevPod intended but
  `.devcontainer/devcontainer.json` missing (or devpod off PATH)
  → silent Podman fallback. The proposed warn-on-fallback
  convention rule was never adopted; the closest adopted rule is
  `default.md` CS-006 (errors MUST NOT be silently swallowed).
- **uf_finale_push_state** (unbound-force
  `.opencode/plugins/uf-finale/index.ts:381,387`): bare `catch`
  blocks swallow rev-list count failures, leaving `behindBy` at
  0 in a success envelope feeding the step-5 push gate (the
  base_state sibling defect; fixed there in 1f3e52f, live here).
- **dewey DetermineSanitizeMode** (`sanitize/sanitize.go:324`):
  web/github → warn, everything else → `off`; a new source type
  silently sanitizes as `off` unless the switch is updated.

### Fixed exemplars (patterns to copy)

- **gateway region** (`internal/gateway/provider.go:203-212`, fix
  79dc563): region "global" errors explicitly with override env
  vars named, instead of silently falling back to `us-east5` and
  failing later on rawPredict.
- **gateway token refresh** (`internal/gateway/provider.go:247-253`,
  fix 3f1bf3b): failed background refresh atomically clears the
  token under `tokenMu`, so `PrepareRequest` returns a clear error
  instead of forwarding a stale token into 401s.
- **gaze threshold flags** (`cmd/gaze/main.go:2127-2130`):
  thresholds use `*int` — nil = not provided, non-nil (including
  `*0`) = active threshold — making "unavailable" distinguishable
  from "computed zero".
- **replicator coverage averaging** (`Makefile:50`): the awk
  `END {if(c>0) ... else print "0.0"}` guard stops an empty or
  renamed package from silently yielding a passing 0.0% average.
- **uf_finale_base_state** (fix 1f3e52f, 2026-10-23): rev-list
  count failures now return a retryable failure envelope
  (`BASE_SYNC_COUNT`) treated as a soft gate, so `behindBy: 0`
  reliably means "current with base".

### The rule

Fail explicitly instead of defaulting silently when the default
differs from user intent, data could be lost or corrupted, the
fallback masks a configuration problem, or zero carries meaning
(use `*T` / nullable fields). Silent defaults remain appropriate
for the documented common case or backward compatibility — but
log a warning.

For tool envelopes (2026-10-23 learning): a success envelope with
default-zero numeric fields driving consumer branching is a false
negative — "genuinely zero" is indistinguishable from "count
failed". Return a failure envelope for decision-essential counts,
or make the field nullable (`behindBy: number | null`).

Related encodings: dewey's warn-by-default sanitization (findings
logged; blocking opt-in via strict mode) and the 5-tier trust
ordering — authored > curated > validated > draft > untrusted
(`source/config.go:79`) — whose extension required tracing every
consumer so untrusted never inherited draft treatment silently.

## History

- Compiled 2026-08-14; audited claim-by-claim, recompiled October
  2026.
- Two August claims were stale even at compile time: the
  `buildSteps()` ordering bug (Gaze before gh) was already fixed
  Aug 12 (e98360e), and dewey `ParseDocument`'s silent metadata
  overwrite no longer exists in current dewey.
- The 2026-10-23 error-handling learning (success-envelope
  catch-to-zero in finale tooling) is folded in above; its
  prescribed fix shipped the same day as 1f3e52f.
