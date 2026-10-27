---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:35:00Z
identity: uf-workflow-20261026T213500-jay-flowers
tier: draft
---

Same-PR retrospective learnings are the nearest evidence when a spec, design, or CHANGELOG asserts a runtime capability, and a learning that falsifies the claim leaves the PR internally contradictory until every carrying artifact is corrected in lockstep. Observed on update-run-pipeline-plan (PR 839, 2026-10-26): the spec delta's ADDED requirement, design D3, proposal, command, scaffold mirror, and CHANGELOG all asserted "human gates inside delegated commands surface directly to the human through parented child sessions," while the same PR's learning uf-workflow-20261026T182050 recorded that uf_delegate_command children cannot surface question-tool prompts — a whole-pipeline /uf.unleash delegation hung at the spec-review question gate until the 30-minute cap. Review recipe: when triaging intent-drift feedback on a capability claim, first grep the change's own learnings for observed behavior; a dated, specific learning controls over an unsourced claim (content.md FA-001, VB-004). Fix recipe: correct every artifact carrying the claim in one pass — canonical command, byte-identical scaffold mirror (TestEmbeddedAssets_MatchSource), spec delta, design, proposal, CHANGELOG — because patching only the surface where the contradiction was found leaves the requirement-of-record and the user-facing changelog asserting the falsified behavior. Mechanism note: a delegated child that reaches an interactive gate hangs until the delegation timeout, and re-delegation resumes at that same gate (a loop, not a recovery); the documented recovery is re-anchoring on durable state (get_progress, parse_tasks, git status) and driving the remaining steps in the parent session.
