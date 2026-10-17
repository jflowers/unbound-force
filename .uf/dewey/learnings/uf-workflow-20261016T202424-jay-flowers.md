---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-16T20:24:24Z
identity: uf-workflow-20261016T202424-jay-flowers
tier: draft
---

Command-content tests that pin tool invocations must pin the distinguishing parameter names, not just the tool name, when a contract migrates — and re-check the between()-span end-marker when a rewrite adds a new tool call. Presence-of-call assertions pass while a stale invocation (right tool, pre-migration parameter list) fails schema validation at runtime and, in warn-and-continue pipelines like /uf.unleash Step 10, silently drops the artifact, reintroducing the defect the migration fixed (#707 null unleashSummary in /uf.finale). Observed on PR 745 (maintainer feedback item 2 of 13): the span marker chosen for format_unleash_demo ("Then persist the summary") sat immediately before the write_unleash_summary block, so the new invocation fell outside every asserted span. Fix pattern: pin the call, the parameters that distinguish the new contract from the old (review_verdicts, learnings_stored), and mechanically checkable scenario counts (strings.Count(command, "CHECKPOINT: Call") == 2) in the same command-content test the diff already touches — the embedded-asset read plus drift detection covers both mirror copies with one assertion. Corroborates uf-workflow-testing-20261016T162816 from the maintainer-feedback side.
