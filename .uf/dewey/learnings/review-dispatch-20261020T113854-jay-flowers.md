---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T11:38:54Z
identity: review-dispatch-20261020T113854-jay-flowers
tier: draft
---

When reviewing spec artifacts for dispatch/finalization pipeline changes, verify that the emitter-validator derivation pattern is preserved: the emitter must call the validator's exact derivation function (not a parallel derivation), so that emitted payloads pass validation by construction. This pattern was established by dispatch-finalize-determinism (per-run layer) and extended by fix-dispatch-verdict-derivation (top-level layer). The validator's documented contract stays authoritative; the fix is always at the emission point. Relaxing the validator would change documented command-spec rules and per-kind enum contracts pinned by tests.
