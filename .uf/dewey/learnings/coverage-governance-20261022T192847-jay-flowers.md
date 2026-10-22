---
tag: coverage-governance
author: jay-flowers
category: decision
created_at: 2026-10-22T19:28:47Z
identity: coverage-governance-20261022T192847-jay-flowers
tier: draft
---

When raising a coverage floor anchored to a measured baseline, set the floor below the measurement with explicit headroom for cross-platform instrumentation divergence rather than pinning at the measurement or the exact baseline: same-commit V8 coverage differs slightly between macOS local runs and ubuntu-latest CI (the divergence class that forced a 0.5 epsilon in this repository's CRAP-load ratchet). The ts-plugin-coverage-gate change (issue #780, design D2) set the statements floor at 94 — 1.18 points under the 95.18 percent measurement and just under the 94.58 lowest recorded baseline — and rejected 94.58 and 95 as false-failure-prone (0.60 and 0.18 points of headroom respectively). Integer floors only; fractional thresholds imply precision the cross-platform measurement does not have. Future governance raises should re-measure fresh and re-derive the margin rather than assuming the old numbers still hold.
