---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-27T13:59:21Z
identity: documentation-gate-20261027T135921-jay-flowers
tier: draft
---

A claim-reconciliation fix must enumerate the compressed summary surfaces, not only the normative artifacts: a command file carries at least two claim surfaces (the ## Description bullets and the protocol body), and the proposal's What Changes items plus checked tasks.md task text restate delegation outcomes in shorthand — so a fix scoped to the protocol section, spec delta, and design leaves the summaries asserting the superseded behavior while the corrected normative text sits in the same file, and the byte-identical scaffold mirror propagates the contradiction to every uf init deployment. Verified on update-run-pipeline-plan iteration 2 (PR #839, 2026-10-27): the iteration-1 fix reframed Delegation 2's expected outcome to "a designed handoff at the commit-approval gate" in the command's Per-Item Pipeline Protocol, the spec delta, and design D5, but the same command's ## Description still read "The child session commits, pushes, and creates the PR" (line 37) while proposal.md What Changes item 5 and tasks.md task 1.4 still read "expected outcome is a PR URL" — three surfaces carrying the claim the fix corrected elsewhere. Recipe: when applying a reviewer correction to a behavioral claim, grep each load-bearing clause of both the old and new phrasing (subject + verb, e.g. "child session commits", "expected outcome") across every artifact the diff adds — including ## Description and frontmatter summaries, proposal What Changes items, and completed task text — because summary surfaces restate claims just as normatively for any reader who stops early.
