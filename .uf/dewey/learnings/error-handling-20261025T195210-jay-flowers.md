---
tag: error-handling
author: jay-flowers
category: pattern
created_at: 2026-10-25T19:52:10Z
identity: error-handling-20261025T195210-jay-flowers
tier: draft
---

Fix recipe for subprocess-count catch-to-zero (shipped 2-for-2 in the uf-finale plugin: BASE_SYNC_COUNT via PR 812, PUSH_SYNC_COUNT via issue #821): (1) merge per-catch swallowing try blocks into ONE try/catch around both count execs; (2) parse through a strict helper that validates the full trimmed token is digits (/^\d+$/) before parseInt runs — parseInt is prefix-tolerant, so "2x" parses as 2 and must be rejected; keep the Number.isFinite check as defense-in-depth for overflow-length digit strings; (3) route exec throws AND parse throws through one retryable failure envelope with a distinct code; (4) wire the consumption side in the same increment — a soft-gate branch in the consuming command file plus its byte-identical scaffold mirror and a usage-doc clause naming a safe fallback mode; (5) regression-test all three failure shapes: exec throw, garbage/empty stdout, and prefix-numeric stdout ("2x"). Post-sweep grep (2026-10-25) confirms no remaining parseInt(...) || 0 count coercions in .opencode/plugins/ — the remaining parseInt sites parse regex-captured issue/PR numbers, a different shape without a gate-deciding zero sentinel.
