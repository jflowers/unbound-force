## Context

Five speckit command files have the STOP HERE gate positioned
after the workflow steps it governs. This was identified in the
root cause analysis (#346) and partially fixed by #363 for
`speckit.tasks.md` and `speckit.plan.md`. The remaining 5 files
need the same treatment.

The established pattern (from #363) places the STOP HERE block
as a bolded preamble immediately after the first major section
heading (`## Outline`), before any workflow steps.

## Goals / Non-Goals

### Goals
- Move the STOP HERE block to preamble position in all 5
  remaining speckit command files
- Follow the exact pattern established by PR #363
- Ensure agents encounter the STOP constraint before reading
  any workflow steps

### Non-Goals
- Changing the STOP HERE wording or behavior
- Adding new headings or restructuring the command files beyond
  the gate relocation
- Fixing non-speckit command files (those use a different
  pattern and are tracked separately)

## Decisions

### D1: Insert position relative to first major heading

The STOP HERE block is inserted immediately after the first
major `## ` heading that precedes the workflow steps. The
specific heading varies by file:

| File | Heading | Line |
|------|---------|------|
| `speckit.specify.md` | `## Outline` | 22 |
| `speckit.clarify.md` | `## Outline` | 18 |
| `speckit.analyze.md` | `## Goal` | 14 |
| `speckit.checklist.md` | `## Execution Steps` | 35 |
| `speckit.testreview.md` | `## Goal` | 14 |

For files with `## Outline`, the STOP block goes on the line
after the heading (matching the `tasks.md` / `plan.md` pattern
exactly).

For files without `## Outline` (analyze, checklist, testreview),
the STOP block goes after the first `## ` heading that begins
the substantive content section. This is the earliest position
the agent will read before encountering workflow steps.

### D2: Block content is identical across all files

The STOP HERE block uses the same wording established in #363:

```
**STOP HERE. Do NOT proceed to implementation.**

Your job is done. Report the results and prompt the
user. The user will invoke a separate command
(/uf.unleash, /uf.cobalt-crush, or /opsx-apply) when they
are ready to implement.
```

### D3: Remove the original STOP block at the end of each file

After inserting the preamble STOP block, the original STOP
block at the end of the file MUST be removed to avoid
duplication and confusion.

## Risks / Trade-offs

- **Risk**: The heading name varies across files (`## Outline`
  vs `## Goal` vs `## Checklist Purpose`). The agent
  implementing this must identify the correct insertion point
  per file rather than applying a uniform search-and-replace.
  Mitigated by explicit line numbers in the task list.
- **Trade-off**: We are not standardizing all files to use
  `## Outline` as the heading name. This avoids scope creep
  and keeps the change minimal.
