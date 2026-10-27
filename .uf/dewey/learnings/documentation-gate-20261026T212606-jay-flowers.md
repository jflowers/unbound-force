---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:26:06Z
identity: documentation-gate-20261026T212606-jay-flowers
tier: draft
---

A single change can ship an empirical retrospective learning and instruction text that directly contradict each other, because the learning is stored during the retrospective — after the command/spec/design/CHANGELOG text was authored from design assumptions — and nothing reconciles them before PR submission. Verified on update-run-pipeline-plan (unbound-force/unbound-force PR 839, 2026-10-26): learning uf-workflow-20261026T182050 recorded that delegated children cannot surface question-tool prompts (two whole-pipeline /uf.unleash delegations timed out at the 30-minute cap, the first hung at the spec-review per-finding gate, parent had to relay), while the command file, its scaffold mirror, the spec's ADDED 'Direct Human Gate Surfacing' requirement, design D3, the CHANGELOG entry, and the docs-gate issue bodies filed under task 3.3 all claimed gates surface directly through parented child sessions. The docs gate verified documentation presence (CHANGELOG, mirror sync, filed issues), not accuracy of the claim against the change's own evidence — a checked doc-gate task can therefore ship a contradiction. Recipe: before PR submission, for each learning stored during the change, grep every documentation artifact the change ships (command file, scaffold mirror, spec delta, design doc, CHANGELOG entry, filed docs-issue bodies) for present-tense claims about the behavior the learning observed; scope, correct, or remove contradictions in every location, re-sync the drift-detection mirror, and correct the filed issue bodies. Precedence rule: a stored learning with observed specifics (timestamps, timeouts, task state, workaround performed) outranks instruction prose authored from an unverified design assumption; correct the prose, not the learning, unless new evidence shows the learning wrong.
