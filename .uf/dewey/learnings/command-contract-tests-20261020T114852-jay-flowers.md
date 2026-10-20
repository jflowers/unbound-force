---
tag: command-contract-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-20T11:48:52Z
identity: command-contract-tests-20261020T114852-jay-flowers
tier: draft
---

When a spec artifact claims to enumerate "the invocations that remain unpinned" (or any "remaining X" set) for a command file, verify the enumeration mechanically rather than trusting bucket naming: grep every "Call `" occurrence out of the command markdown, collect the pinned tool names from the Go command-contract tests (scaffold_test.go TestUnleashCommand_* subtests plus command_contract_test.go's covered-command list), and diff the two sets. On seam-verification (issue #765), bucket-based enumeration (lifecycle/clarify/implement/exit-formatter) silently omitted dispatch_review_runs (Steps 5/9), the Step 6 forge worktree family, resolve_base_ref, and clear_progress from uf.unleash.md — all unpinned, none covered by command_contract_test.go, which pins only uf.review-council.md, uf.triage-issue.md, uf.address-feedback.md, and speckit.testreview.md. The same diff procedure settles whether a universal requirement clause ("every invocation the command depends on MUST be pinned") matches the tasks that operationalize it before the spec lands with an unmet normative claim.
