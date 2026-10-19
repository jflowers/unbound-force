---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T18:23:57Z
identity: review-dispatch-20261019T182357-jay-flowers
tier: draft
---

DE-001 extractions: derive a new plugin tool's test matrix from the tool's full executable branch surface and its published description, not from the spec task's enumerated scenario list. The read_assessment_fields extraction (opsx/fix-triage-issue-dispatch-docs) initially covered task 2.2's enumerated scenarios (parser bounds, type mismatches, contract-shape validation, missing/empty child text) but left five branches untested: in-execute validation_error, no-session not_found, unknown run_id, multi-run mapping, and corrupt-run-file skip. Sibling tools dispatch_status and fetch_pr_review_context already test their not_found branches — branch-surface derivation would have matched that convention automatically. Practical rule: for each distinct return path in a tool's execute body, name the test that triggers it before declaring the suite complete.
