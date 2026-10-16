---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-16T13:56:17Z
identity: uf-workflow-20261016T135617-jay-flowers
tier: draft
---

Two tools that consume the same markdown grammar must share one line-matching definition. In the unleash-deterministic-tools change (2026-10-16), uf_unleash_detect_resume's countUncheckedCheckboxes counts any-indentation '- [ ]' lines (so implement stays incomplete while any indented box is unchecked), while parse_tasks/mark_task_complete's TASK_LINE_PATTERN treats indented checkbox lines as continuation detail, not tasks. Consequence: a tasks.md with an indented '- [ ]' detail line can never report all_complete: true — every /uf.unleash re-run re-enters implement and re-runs the phase pre-flight; the skip-to-retrospective path is unreachable. Each tool's tests pinned its own grammar, so both passed while disagreeing. When multiple tools parse the same file format, extract the grammar (regex or matcher) to one shared definition and test the disagreement away — passing tests per tool prove nothing about cross-tool agreement.
