---
tag: test-coverage-strategy
author: jay-flowers
category: pattern
created_at: 2026-10-09T17:10:38Z
identity: test-coverage-strategy-20261009T171038-jay-flowers
tier: draft
---

When testing aggregate orchestration tools that thread optional parameters through to internal function calls (like per_run_timeout_ms → dispatchAgentRun.timeout, or model/tier/variant conditional passthrough), create test fixtures that vary these optional parameters to exercise all conditional branches. A single default fixture shape (e.g., model: null, tier: "standard") leaves conditional passthrough logic untested. Use the promptCalls tracking array or custom promptHandler to verify that threaded values reach the internal calls.
