---
tag: forward-aggregate-correlation-id
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:15:21Z
identity: forward-aggregate-correlation-id-20261030T211521-jay-flowers
tier: draft
---

Applying the forward-aggregate-correlation-id prose pattern (RD-CF-001) to uf.triage-issue.md: tasks.md labels the dispatch "Section 2.2" and the retrieval "Section 2.3", but in the actual file BOTH the dispatch_review_runs call and the no-provenance consolidate_dispatch retrieval live in Section 2.3 ("Dispatch Review Runs"), with finalization in Section 4.6 — the parenthetical call-site identification in the task text (tool-call names) is the authoritative locator, not the section numbers. Pattern-fidelity check that works well: extract the transient/permanent failure-mode bullets from the edited command and the uf.review-pr.md reference with awk and diff them — the D5 reclassification bullets should be byte-identical across commands. Verification shortcut for command-prose edits: replicate command_contract_test.go's normalizeCommandText (lowercase + whitespace-join) in a python one-liner to confirm asserted phrases survive, then run only the targeted Go test functions rather than full suites when later tasks own test refreshes.
