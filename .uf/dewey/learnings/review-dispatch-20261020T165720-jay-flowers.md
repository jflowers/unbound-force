---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:57:20Z
identity: review-dispatch-20261020T165720-jay-flowers
tier: draft
---

In a single opencode session that dispatches MORE THAN ONE Divisor review (e.g., /uf.unleash spec review followed by code review), the review-dispatch plugin persists session metadata from the FIRST dispatch call only — /var/folders/.../T/opencode/dispatch-<session>/session-metadata.json keeps the first mode's values (mode, input context, change profile, plan, coverage), and consolidate_dispatch validates the CURRENT dispatch's runs against that stale metadata. Symptom (2026-10-20, seam-verification code review after spec review): INCONCLUSIVE with "artifact commit must equal the immutable reviewed head SHA" (metadata still carried the spec-review head SHA) and "run <uuid> has no included plan entry" (the stale plan skipped a reviewer the second dispatch included). Fix: after the second dispatch_review_runs and BEFORE consolidate_dispatch, rewrite session-metadata.json to the current dispatch's exact values (mode, base/head SHAs, line/file counts, plan entries, coverage), then re-run consolidate_dispatch with the same provenance. A failed consolidate persists nothing, so the retry is safe.
