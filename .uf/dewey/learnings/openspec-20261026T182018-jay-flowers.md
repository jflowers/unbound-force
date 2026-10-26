---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-26T18:20:18Z
identity: openspec-20261026T182018-jay-flowers
tier: draft
---

In unbound-force/unbound-force, an OpenSpec delta's MODIFIED/REMOVED requirement headers must be validated against the PREDECESSOR change's delta file under openspec/changes/<prior-change>/specs/, not the main registry at openspec/specs/ — that registry holds only review-council, ci, and graphthulhu-distribution, so a capability lookup there false-negatives and most changes are implemented-but-unarchived. Verified on update-run-pipeline-plan (2026-10-26, code review): the delta's four target requirement names (Per-Item Pipeline Protocol, Gate Relay Protocol, Guardrails, Progress Tracking) match openspec/changes/run-plan-command/specs/run-plan-command.md exactly — the unarchived predecessor that established the capability — while openspec/specs/ has no run-plan-command entry. Additional trap: the same command surface can carry two capability names (run-plan-command from the original change vs run-pipeline-plan from command-prose-pilot); a delta must target the one whose requirement headers it actually modifies, and a reviewer should confirm which predecessor file holds those headers before judging delta alignment. Recipe: before approving a delta, grep each '### Requirement:' name against the sibling changes' spec files (glob openspec/changes/*/specs/**) and confirm the modified names exist verbatim in the predecessor that owns the capability.
