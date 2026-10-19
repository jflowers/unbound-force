---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T19:22:13Z
identity: review-dispatch-20261019T192213-jay-flowers
tier: draft
---

When adding a plugin tool that consumes persisted dispatch run files, check whether an established loader exists before inlining one: read_assessment_fields in .opencode/plugins/review-dispatch/index.ts became the fourth inline copy of the run-file loading loop (readdir → filter run-*.json → sort → readFile → JSON.parse → index by run_id), joining consolidate_dispatch, dispatch_review_runs, and dispatch_status. Convention pack CS-004 requires extraction past two copies. Pattern: when a new consumer of a persisted-file format is added, extract the shared loader in the same change rather than after the copy count grows — consumers accumulate faster than the pattern gets refactored.
