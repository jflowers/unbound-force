---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-26T21:49:50Z
identity: uf-workflow-20261026T214950-jay-flowers
tier: draft
---

When reviewer feedback corrects protocol text in a scaffolded command, enumerate every artifact that transcribes the protocol before scoping the fix: the canonical command file, its byte-identical scaffold mirror (the only mechanically enforced pair, via TestEmbeddedAssets_MatchSource), the OpenSpec spec delta (requirement text and scenarios), design.md decisions, and the completed tasks.md task text. Verified on PR 839 feedback item 4 (2026-10-26): the re-run phrase 'no routing context — the child resumes from its durable state' was transcribed in five places (.opencode/commands/uf.run-pipeline-plan.md:225, the scaffold mirror, the spec delta's ADDED requirement step 4 and its re-run scenario, design D4, and tasks 1.3), while the reviewer's sync list named three (spec req 4, design D4, mirror) — the tasks.md transcription would have silently retained the superseded semantics. Only the mirror pair fails CI on drift; spec, design, and tasks transcription drift is caught by review alone, so the fix surface must be enumerated from the diff, not inherited from the reviewer's list.
