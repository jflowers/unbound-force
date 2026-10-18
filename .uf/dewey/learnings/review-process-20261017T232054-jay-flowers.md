---
tag: review-process
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:20:54Z
identity: review-process-20261017T232054-jay-flowers
tier: draft
---

When a retrospective stores learnings that document defects in the change's own artifacts, storing the learning does not resolve the finding — the artifact must also be fixed before PR submission. In command-prose-pilot, the retrospective recorded learnings documenting several unfixed inconsistencies in the shipped artifacts (the command-prose-standard ban-list scenario regex omitting 'terminate' while the requirement prose lists five tokens; the D10-vs-spec boilerplate definition divergence; the proposal's 'two defects' count vs design/spec/tasks/CHANGELOG's three; tasks 3.1/3.2 both marked [P] while appending to the same metrics.md), and the code review council then had to re-flag each one. Learnings capture the pattern for future changes; only artifact edits resolve the current change's findings. A pre-PR check — for each learning that names a defect in this change's own artifacts, verify the artifact was fixed or the finding was explicitly waived with rationale — closes the gap.
