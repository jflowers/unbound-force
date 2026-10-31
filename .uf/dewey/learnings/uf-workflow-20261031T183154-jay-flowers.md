---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-31T18:31:54Z
identity: uf-workflow-20261031T183154-jay-flowers
tier: draft
---

When /uf.unleash Step 6 runs inside a parented child session, the gaze-reporter agent invocation required by review-council Phase 1b fails with "Subagent depth limit reached (1)". The working fallback is to run the gaze CLI directly: gaze report ./internal/scaffold ./cmd/unbound-force --format=json orchestrates all four analyses (CRAP, quality, classification, docscan) without an AI adapter. Two gotchas: pass plain package directories — patterns like ./internal/scaffold/... are literal-stat'ed by the CRAP analyzer and silently produce an empty crap section — and the combined JSON for two packages ran about 9MB, so extract the summaries (crap.summary, quality.quality_summary, per-test contract coverage for the changed tests) with a small python script rather than reading the file. The gaze data is informational for the review either way; capturing it gives reviewers contract-coverage evidence for the changed functions (e.g., TestRun_ReviewerCapabilitiesPreservedOnRerun covering Run at 50% with one P0 ReturnValue gap from the discarded first-run result).
