---
tag: command-templates
author: jay-flowers
category: gotcha
created_at: 2026-10-23T15:59:52Z
identity: command-templates-20261023T155952-jay-flowers
tier: draft
---

Same-named inputs carry different schemas across tools in one documented uf.* command sequence: plan_review_dispatch takes changed_files as an array of {path, additions, deletions} objects, while dispatch_review_runs takes changed_files as a pre-formatted string and additionally requires diff_path (both enforced by superRefinement for every non-triage mode, feedback included). When writing or reviewing command-template documentation for a multi-tool call sequence, verify each input against that specific tool's zod schema (review-dispatch plugin index.ts) rather than carrying an adjacent tool's input description forward, and check wording parity against the sibling command that documents the same tool (uf.review-council.md §2). The uf.address-feedback.md §2.3.4 template originally described the dispatcher's changed_files with the planner's object format and omitted diff_path entirely, causing first-call input-validation failures (issue #763). Review tip: identical git blob hashes in a diff prove byte-identity of scaffold mirrors without reading both files.
