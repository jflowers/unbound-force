---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:23:31Z
identity: review-dispatch-20261019T212331-jay-flowers
tier: draft
---

Resolving a diff-confined CS-004 duplication finding on newly added code requires the extraction to span ALL copy sites, not just the flagged one: read_assessment_fields (opsx/fix-triage-issue-dispatch-docs, PR 761) was flagged as the fourth inline copy of the review-dispatch run-file loading loop, but three of the four sites (consolidate_dispatch ~3217, dispatch_review_runs ~4168, dispatch_status ~4245) pre-date the diff and sit outside it — a fix that extracts only the new tool's loop leaves the violation intact and gets re-flagged. The extraction must also (a) preserve each site's distinct error semantics — consolidate_dispatch fails closed on missing runs while read_assessment_fields degrades to per-run unavailable results — so the shared loader should own the uniform readdir → filter run-*.json → sort → readFile → JSON.parse → first-wins run_id index and return a result each call site interprets; and (b) mirror the plugin file byte-identically under internal/scaffold/assets/ (make check drift gates). Complements learning review-dispatch-20261019T192213-jay-flowers (extract the loader in the adding change rather than after the copy count grows).
