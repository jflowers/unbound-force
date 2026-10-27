---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:49:59Z
identity: spec-authoring-20261026T214959-jay-flowers
tier: draft
---

When a reviewer correction targets a protocol sentence that a change repeated across artifacts, enumerate every repetition site before editing — and grep per-clause, because line-wrapping splits phrases across lines. On update-run-pipeline-plan (PR 839, feedback item 4, 2026-10-26), the re-run instruction ('delegate /uf.unleash again with the same command_path and no routing context — the child resumes from its durable state') appeared in six places: canonical command (lines 224-226), scaffold mirror (line 225), spec delta requirement item 4 (lines 256-259), design D4 (lines 136-139) plus Goals (line 51), tasks.md task 1.3 (line 61), and the proposal's What Changes item 4 (line 64, as 're-runs /uf.unleash on the feature branch (resumability continues)'), while the reviewer's fix list named three (spec req 4, design D4, mirror — canonical implied by the mirror sync). The spec's instance was line-wrapped ('and no' ending one line, 'routing context' starting the next), so a single-phrase grep missed it entirely. Only the canonical↔mirror pair is drift-test-enforced; the spec delta, design, tasks, and proposal copies have no mechanical sync, so a partial fix leaves the requirement of record contradicting the corrected command. Recipe for feedback-mode text corrections: (1) grep the changed files and the change directory for each load-bearing clause of the offending sentence separately — the phrase, its wrapped fragments, and paraphrases (e.g. 'resumability continues' for 'resumes from its durable state'); (2) fix or consciously annotate every hit in one commit; (3) re-sync the mirror byte-identically; (4) record the correction in the docs issue(s) that document the protocol.
