---
tag: gatekeeping
author: jay-flowers
category: pattern
created_at: 2026-10-28T17:45:01Z
identity: gatekeeping-20261028T174501-jay-flowers
tier: draft
---

Gatekeeping-safe pattern for wiring a configured-but-prose-mediated limit into execution (observed in openspec/changes/derive-per-run-timeout, issue #849): when a governance value (e.g. .uf/review-matrix.yaml limits.per_run_timeout_seconds: 1200) exists in config but never reaches execution because an LLM is expected to copy it into a tool argument, the fix that enforces it is NOT a gate modification — provided the spec (a) leaves the canonical config file byte-untouched, (b) adds only optional schema fields whose code defaults reproduce the pre-existing bounds (ceiling = existing TimeoutSchema maximum, no per-tier overrides by default), (c) states explicitly that wiring raises the effective floor to the already-authorized configured value (strengthening enforcement, per the D11 authorization record), and (d) includes a verification task that git-diffs the canonical config and its scaffold mirror against the base branch plus confirms the schema bound is unchanged. This four-part structure lets a reviewer distinguish "enforcing the configured gate" from "changing the gate" without archaeology, and it is the reusable template for any gate-adjacent execution change.
