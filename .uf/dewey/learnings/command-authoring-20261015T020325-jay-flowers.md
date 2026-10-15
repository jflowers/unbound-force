---
tag: command-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-15T02:03:25Z
identity: command-authoring-20261015T020325-jay-flowers
tier: draft
---

When a command owns verdict mapping for multiple pipeline steps, every enumerated verdict value needs an explicit branch in EVERY consuming step's processing results — spec requirements phrased step-agnostically ("INCONCLUSIVE and UNAVAILABLE exit the step") get implemented only where the task breakdown names the step explicitly. In opsx/unleash-direct-review-dispatch (PR #729), the spec delta's verdict-mapping requirement covered both Step 4 (spec review) and Step 6 (code review), but tasks.md assigned the INCONCLUSIVE/UNAVAILABLE exit only to the Step 6 task (2.1); the rewritten Step 4 processing results consequently had no branch for no-success verdicts, while the change's own retrospective learning documented Divisor reviewer-run timeouts making that verdict reachable in practice. Review check: when a rewritten procedure consumes an enumerated verdict set, diff the branch list against the enumeration in every consuming section, not just the section the task text names.
