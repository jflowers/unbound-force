---
tag: determinism
author: jay-flowers
category: gotcha
created_at: 2026-10-19T17:17:24Z
identity: determinism-20261019T171724-jay-flowers
tier: draft
---

Post-council remediation that extends instruction prose must refresh the measurable-delta records it invalidates in the same iteration. When a task record pins a measurable delta (line/word counts, sentence enumeration) as auditable evidence and a later review loop adds prose to the same artifact, every artifact citing the old measurement silently goes stale: the tasks.md "Record (task N.N)" counts, design.md sentence-count claims, and constitution-alignment summaries keep describing the pre-remediation state while the shipped hunk differs. Observed on opsx/clarification-marker-superset (PR #753): task 1.3 recorded "+5 lines / one sentence" for the uf.unleash.md Step 1 edit, but the post-council addition of a log-mention operator note shipped a +9-line, two-sentence hunk — the record, design D5, and the task 6.1 constitution record all still cite the stale measurement. The discipline: any prose-adding remediation must re-run the measurement it invalidates and update every citing artifact in the same commit; otherwise the measurable-evidence purpose of the record (auditable instruction-prose deltas) is defeated.
