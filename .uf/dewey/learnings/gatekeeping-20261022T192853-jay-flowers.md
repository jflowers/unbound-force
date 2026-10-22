---
tag: gatekeeping
author: jay-flowers
category: pattern
created_at: 2026-10-22T19:28:53Z
identity: gatekeeping-20261022T192853-jay-flowers
tier: draft
---

Gate-value changes reviewed by divisor-guard should be assessed against the archived gatekeeping-protection spec scenarios (openspec/changes/archive/2026-04-28-gatekeeping-protection/): a change that weakens a gate (e.g., lowers a coverage threshold) without documented human authorization is a violation to flag; a change that strengthens a gate through a full spec-workflow governance change is the authorized path and should be noted, not flagged. The ts-plugin-coverage-gate change (issue #780) is the exemplar: statements floor 90→94 in .opencode/vitest.config.ts with design decisions D1-D7, a provenance comment naming the recorded baselines and the governing issue, AGENTS.md/CHANGELOG documentation, and executable proof of both gate modes (passing: 95.18% ≥ 94; failing: CLI override --coverage.thresholds.statements=96 exits 1 naming metric, measured value, and threshold).
