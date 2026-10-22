---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-22T19:28:50Z
identity: content-pipeline-20261022T192850-jay-flowers
tier: draft
---

Curator triage of quality-gate modifications (e.g., coverage-threshold raises via a spec-workflow governance change) should verify a four-part documentation pattern rather than flagging a missing docs issue: (1) a provenance comment in the gate config itself (recorded baselines, current measurement, tracking-issue link, governance constraint), (2) a CHANGELOG.md change entry, (3) an AGENTS.md convention bullet recording the gate value and its governance control, and (4) an explicit documentation-issue exemption claim in the proposal/tasks (quality-gate and CI-only changes have no user-facing surface per the AGENTS.md exempt list). The ts-plugin-coverage-gate change (issue #780, statements floor 90→94 in .opencode/vitest.config.ts) is the exemplar: all four artifacts present, README verified as not documenting coverage floors (it describes make plugin-test at the toolchain level only), and blog/tutorial thresholds correctly not triggered because a threshold raise introduces no new agent, CLI command, architectural migration, or workflow pattern. Contrast with repair changes (see learning content-pipeline-20261016T172845-jay-flowers), which compare significance against the intended pre-break baseline and may still require documentation issues when user-visible workflow behavior changes.
