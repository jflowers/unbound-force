---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-29T15:22:28Z
identity: test-quality-20261029T152228-jay-flowers
tier: draft
---

Extracting a shared input-assembly helper (e.g. deriveRunTimeoutMs for per-run timeouts) closes formula drift between tool paths but not argument-wiring drift: each path still independently chooses what to feed the helper, so each path needs its own test pinning its per-path arguments against a non-default configuration. When a path's every test runs against fixtures equal to the code defaults (scratch matrix 600 s == DEFAULT_LIMITS), wired and hardcoded values are indistinguishable — a hardcoded-defaults regression passes silently (redispatch per-run timeout: only the dispatch path had a 1200 s non-default test; redispatch had none, so the RD-FR-029 configured-limit scenario went unverified). Verification technique for paired review feedback (extraction + per-path pin): verify both halves independently — grep the path's test suite for the config token (per_run_timeout_tiers in dispatch-recovery.test.ts → zero matches) to detect a missing pin.
