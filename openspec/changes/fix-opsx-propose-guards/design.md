## Context

The `opsx-propose` command (`.opencode/commands/opsx-propose.md`) and
the `openspec-propose` skill (`.opencode/skills/openspec-propose/SKILL.md`)
share nearly identical content. Both contain a dirty-tree guard at
Step 3 that is described in prose but lacks explicit tool enforcement,
and a STOP HERE gate that appears after the workflow it should
constrain.

These gaps were identified through root cause analysis of issue #346,
where a review-pr command skipped a confirmation gate under context
compression. The same vulnerability pattern applies here.

The proposal (aligned with Constitution Principles IV and V) calls for
two targeted fixes applied identically to both files.

## Goals / Non-Goals

### Goals

- Harden the dirty-tree guard with an explicit AskUserQuestion tool
  call and concrete options, so the guard survives context compression
- Relocate the STOP HERE constraint to a preamble position before
  the workflow steps, ensuring it is loaded into context before the
  actions it gates
- Apply identical fixes to both the command file and the skill file
- Maintain backward compatibility -- agents that already follow the
  prose instructions see no behavioral change

### Non-Goals

- Refactoring the command/skill to eliminate duplication between the
  two files (that is a separate concern)
- Adding new workflow steps or changing the artifact creation flow
- Modifying any other commands or skills beyond the two files
- Addressing the branch check guard (part b) -- it already has
  explicit STOP behavior with an error message

## Decisions

### D1: AskUserQuestion with two concrete options

The dirty-tree guard will use `AskUserQuestion` with two options:
- "Stash changes and continue"
- "Abort -- keep changes as-is"

**Rationale**: Two options cover the primary user intents without
overcomplicating the interaction. "Stash" allows the workflow to
proceed safely by preserving uncommitted work. "Abort" respects
the user's decision to stop. A third option like "Continue without
stashing" was considered but rejected -- it would undermine the
guard's purpose by allowing dirty-tree branch switching, which is
the exact scenario the guard prevents.

### D2: Preamble placement for STOP HERE rule

A bolded preamble block will be inserted immediately after the
`---` separator and before `**Steps**`, containing the STOP HERE
constraint. The existing STOP HERE block after Step 6 will be
retained as reinforcement.

**Rationale**: Under context compression, later content may be
truncated or summarized. Placing the rule before the workflow
ensures the constraint is always loaded. Keeping the post-workflow
copy provides defense-in-depth -- agents processing the full
document see the constraint twice.

### D3: Identical changes to both files

The command file and skill file will receive identical textual
changes. No attempt to DRY them up via shared includes or
templating.

**Rationale**: OpenCode commands and skills are independent
artifacts with different loading mechanisms. Introducing a shared
dependency would violate Composability First and add complexity
for a two-file fix.

## Risks / Trade-offs

### Risk: Preamble may be ignored by some model architectures

Some models weight system-level instructions differently from
inline workflow steps. The preamble format (bolded text before
steps) may not carry the same weight as a numbered step.

**Mitigation**: The preamble uses bold formatting and explicit
"NEVER" language. The post-workflow STOP HERE block is retained
as a second enforcement point.

### Trade-off: Duplication between command and skill files

Applying identical changes to two files means future edits must
be applied twice. This is an accepted trade-off -- the files
serve different purposes (command vs. skill) and deduplication
would require infrastructure changes out of scope for this fix.
