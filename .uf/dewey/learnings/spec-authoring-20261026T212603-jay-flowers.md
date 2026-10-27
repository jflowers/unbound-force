---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:26:03Z
identity: spec-authoring-20261026T212603-jay-flowers
tier: draft
---

A PR that ships both protocol-prescribing artifacts and retrospective learnings must reconcile them before submission: check each MUST-level runtime claim in the spec/command against the learnings' verified observations from the same change. Verified on update-run-pipeline-plan (PR 839, 2026-10-26, feedback item 1): design D3 assumed parented child sessions surface question-tool gates, and that assumption was codified as the ADDED 'Direct Human Gate Surfacing' requirement in the spec delta, the command text, the byte-identical scaffold mirror, and the CHANGELOG — while the same PR's learning (uf-workflow-20261026T182050) recorded the opposite from the change's own implementation: delegated children cannot surface question-tool prompts, and the whole-pipeline /uf.unleash delegation hung at the spec-review gate until the 30-minute cap. The claim predated and was disproved by the implementation, but no artifact was reconciled. Reviewer recipe: when a PR adds both protocol artifacts and dewey learnings, grep each runtime-behavior MUST against the learnings; a contradiction is a blocking multi-surface inconsistency, and the fix must propagate through every surface carrying the claim plus add a recovery path for the real behavior (explicit delegation timeout; human clears the gate interactively on the branch before re-delegating, or the parent re-anchors via get_progress/parse_tasks and drives the remaining steps). Related prior pattern: security-gate-delegation-20261014T220250 (parent delegation models must match child gate mechanics).
