## Context

The STOP HERE phase-boundary gates in `speckit.tasks.md` and
`speckit.plan.md` currently appear AFTER the workflow steps
they govern. This is a T2 structural weakness: a CRITICAL rule
placed where an LLM with compressed context may never process
it before executing the workflow.

The proposal (proposal.md) identifies three files requiring
changes and confirms constitution alignment (all principles
N/A except Testability: PASS).

## Goals / Non-Goals

### Goals

- Move STOP HERE blocks to preamble position (before Step 1)
  in `speckit.tasks.md` and `speckit.plan.md`
- Update `uf-init.md` Step 10 placement instruction to direct
  future scaffolding to the correct position
- Preserve the exact STOP HERE block content (wording unchanged)
- Ensure no duplicate STOP HERE blocks remain after the move

### Non-Goals

- Fixing the same T2 pattern in other files (`opsx-propose.md`,
  `cobalt-crush.md`) -- those are tracked by separate issues
  (#353, #355)
- Changing the STOP HERE block wording or format
- Adding new phase-boundary gates to files that lack them
- Modifying the Guardrails sections in any affected file

## Decisions

### D1: Preamble position for STOP HERE blocks

The STOP HERE block MUST be placed immediately after the
`## Outline` heading (or equivalent section heading) and
before the first numbered workflow step. This ensures the
LLM processes the stop instruction before beginning any
workflow execution.

**Rationale**: The `## Outline` heading provides structural
context for what follows. Placing the STOP HERE block between
the heading and the first step ensures it is read as a
pre-condition, not a post-condition. This mirrors how a
"pre-flight check" works -- constraints are loaded before
execution begins.

### D2: Remove-then-insert approach

Each file will have its existing STOP HERE block (and
accompanying explanation lines) removed from its current
position, then inserted at the preamble position. This
avoids duplication.

**Rationale**: A move operation (delete old + insert new)
is clearer than trying to reorder blocks in place. It also
makes the diff readable: one deletion hunk and one insertion
hunk per file.

### D3: uf-init.md placement instruction update

The Step 10 "Where" instruction in `uf-init.md` currently
reads:

> After the main workflow instructions, before the
> `## Guardrails` section.

This will be changed to:

> Immediately after the `## Outline` heading (or equivalent
> section heading), before the first numbered workflow step.
> If no `## Outline` heading exists, insert before the first
> numbered step in the file.

**Rationale**: The uf-init scaffold command creates STOP HERE
blocks in new files. If the placement instruction remains
incorrect, every future `uf init` run will perpetuate the
T2 weakness.

## Risks / Trade-offs

### Risk: Existing files scaffolded by uf-init

Files that were scaffolded before this fix will retain the
old placement until either manually fixed or re-scaffolded.
The `uf-init` deduplication logic (Step 11) will not move
an existing STOP HERE block -- it only checks for presence.

**Mitigation**: The two files being fixed in this change
(`speckit.tasks.md`, `speckit.plan.md`) are the only files
identified by issue #363. Other files with the same pattern
are tracked by separate issues.

### Trade-off: Preamble placement vs. bold banner

An alternative approach would be to add a bold banner at the
very top of each file (before any frontmatter). This was
rejected because frontmatter YAML must come first in the
file, and a banner above the outline heading would be
visually intrusive.
