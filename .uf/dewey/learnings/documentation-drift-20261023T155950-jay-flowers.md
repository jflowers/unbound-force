---
tag: documentation-drift
author: jay-flowers
category: gotcha
created_at: 2026-10-23T15:59:50Z
identity: documentation-drift-20261023T155950-jay-flowers
tier: draft
---

Two review-dispatch tools share the `changed_files` parameter name with different shapes: `plan_review_dispatch` accepts an array of `{path, additions, deletions}` affected-file objects, while `dispatch_review_runs` requires a pre-formatted string list (with `diff_path` as a separate required string for every non-triage mode). Command templates that document both calls in adjacent sections (e.g. /uf.address-feedback §2.3.3 vs §2.3.4) must describe each tool's actual shape. When correcting one tool's input description, grep the parameter name across the whole command before assuming residual occurrences are missed fixes — in uf.address-feedback, §2.3.3's "sorted affected-file objects" is correct for the planner and must NOT be "fixed" to the string form. All four dispatch command templates (uf.review-council, uf.review-pr, uf.triage-issue, uf.address-feedback) carry parallel dispatch_review_runs input lists; verify a schema-drift fix in one against the others. The golden-comment pattern in dispatch-review-runs.test.ts (a comment enumerating the documented input list) acts as a doc-drift tripwire that forces test updates to travel with command-template doc changes.
