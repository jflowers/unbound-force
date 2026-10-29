---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:38:10Z
identity: review-dispatch-20261029T133810-jay-flowers
tier: draft
---

When a change introduces a shared pure function to keep two tool paths from drifting, audit the input assembly at each call site, not just the function: sharing the formula while duplicating its wiring leaves the drift class half-closed. On PR #860 (feedback item 9), derivePerRunTimeoutMs was single-sourced in .opencode/lib/run-timeout.ts but its input assembly was duplicated verbatim at .opencode/plugins/review-dispatch/index.ts:4895-4906 (dispatch) and :6405-6416 (redispatch) — three of seven inputs structurally identical, only four varying legitimately. The drift risk is live: redispatch derivation tests pin only default-matrix derivations (no per-tier overrides), and the adjacent resolveTimeoutLimits consumption already diverged between the same two paths (dispatch surfaces the degraded warning; redispatch drops it). Rule of thumb: two verbatim-identical call-site assemblies are one adapter instantiated twice — extract the invariant wiring into a helper parameterized by the varying inputs (mirroring the resolvePlanEntryRuntime / resolveTimeoutLimits precedents in the same file), and pin each path with one test using non-default configuration (e.g., a per_run_timeout_tiers override).
