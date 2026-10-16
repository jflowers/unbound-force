---
tag: uf-workflow-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-15T21:32:17Z
identity: uf-workflow-testing-20261015T213217-jay-flowers
tier: draft
---

Fixture pitfall when testing uf_unleash_detect_resume with dispatch artifacts (unleash-resume.test.ts, task 3.3 of unleash-deterministic-tools): the branch filter uses rev-parse --abbrev-ref HEAD, so every artifact fixture MUST carry the scenario's branch — artifactJson defaults the envelope context.branch, and a fixture built for the default opsx branch while the fake GitExec reports a speckit branch (018-unleash-command) is silently filtered out (spec_review/code_review false, all_complete false) with no error — it looks like a derivation bug but is correct mode/branch filtering. Real envelope verification: the review-dispatch producer writes timestamp as an RFC3339 string (dependencies.now().toISOString() in envelopeFor), so parseDispatchArtifact's Date.parse(string) is correct; a numeric epoch-ms timestamp would hit the epoch-0 fallback and sort oldest (fail-safe, never produced in practice). With an existing ProgressState served through the mocked node:fs surface, readState runs TWICE per invocation (reconcile at the report site, then again inside recordAutoCheckpoint) and lstatSync fires three times (state file x2 for the reads, then the progress dir inside writeState before mkdirSync), so mock implementations must path-match the exact state file path rather than count calls.
