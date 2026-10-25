---
tag: test-coverage
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:35:06Z
identity: test-coverage-20261025T183506-jay-flowers
tier: draft
---

When converting a silent no-op (nil return) into a visible result, states that were previously observationally identical become distinct — and tests usually pin only the side the change touched. In fix-init-speckit-sentinel, "sentinel exists + binary found" became a visible "already configured" subToolResult while "sentinel exists + binary missing" (LookPath gate) stayed result-less. The combined missing-binary case is the only test that can discriminate a gate-ordering regression (sentinel check moved ahead of the LookPath gate would report "already configured" for an absent tool), yet it was codified as a MUST scenario (FR-019 scenario 2) without a pinning test. When a change alters the observable boundary of a branch, enumerate the adjacent no-result gates upstream of that branch and pin the combined scenarios (gate triggered + branch state present), not just the branch you changed.
