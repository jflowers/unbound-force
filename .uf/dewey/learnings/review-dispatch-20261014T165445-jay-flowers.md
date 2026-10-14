---
tag: review-dispatch
author: jay-flowers
category: reference
created_at: 2026-10-14T16:54:45Z
identity: review-dispatch-20261014T165445-jay-flowers
tier: draft
---

When a change's diff includes retrospective learnings produced during its own workflow, treat those learnings as an open-issues ledger for review: several may describe defects that persist in the change's final artifacts rather than problems that were fixed. In determinism-codification (PR #723), the shipped learnings flagged (a) AGENTS.md's "where an executable tool is feasible" qualifier diverging from the unqualified MUST in Constitution Principle VI / pack DE-001, (b) tasks 1.1 and 1.9 both marked [P] while editing the same constitution file against the template's same-file rule, and (c) constitution-check.md's "four org principles" enumeration left two-behind by the amendment — yet all three conditions remained in the merged candidate unchanged. Review recipe: for each learning in the diff that names a file also present in the diff, compare the learning's complaint against the current artifact state and score it as a finding if unresolved; learnings describing already-fixed conditions drop out naturally. Learnings are written to capture what was learned, not what was remediated — the two sets must not be conflated.
