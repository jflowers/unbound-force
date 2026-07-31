## Context

The `openspec-propose` skill and its companion `opsx-propose` command
both include a dirty-tree guard before `git checkout -b`. The guard
describes checking `git status --short` and asking the user before
switching branches with uncommitted changes. However, the enforcement
is prose-only — no AskUserQuestion tool call is specified.

This is a T1 (prose-only gate) + T3 (no session-resume guard) weakness.
Under context compression, the prose reasoning can be dropped,
causing silent branch switches with uncommitted work.

## Goals / Non-Goals

### Goals
- Replace prose-only dirty-tree guard with explicit AskUserQuestion
  tool-call enforcement in both files
- Provide concrete options ("Stash changes and continue" /
  "Abort — keep changes as-is") so the guard is unambiguous
- Ensure the guard survives context compression by being expressed
  as a tool-call instruction, not reasoning prose

### Non-Goals
- Adding automated stashing logic (the agent already knows how to
  `git stash`; the guard's job is to get confirmation, not automate
  the recovery)
- Fixing the same prose-only guard in other files (see Known
  Remaining Instances below) — those are tracked separately
- Changing the branch-check logic (part b of the guard)
- Adding session-resume guards (T3 weakness is lower priority and
  would require a broader pattern across all skills; tracked in
  parent audit issue #346)

## Decisions

### D1: AskUserQuestion with two fixed options

The guard will use AskUserQuestion with exactly two options:
1. "Stash changes and continue"
2. "Abort — keep changes as-is"

**Rationale**: These match the issue's specification (#350). A third
option like "Continue without stashing" would risk data loss and is
intentionally excluded. The tool-call format ensures the guard cannot
be optimized away during compression.

### D2: Identical fix in both files

Both `.opencode/skills/openspec-propose/SKILL.md` and
`.opencode/commands/opsx-propose.md` receive the same fix. The
dirty-tree guard sections are nearly identical across the two files.

**Rationale**: The skill and command files are independent entry points
to the same workflow. Both must be hardened.

### D3: Preserve existing prose, augment with tool call

The existing prose describing the dirty-tree check is retained. The
AskUserQuestion call is added immediately after the detection step,
before any `git checkout -b`. This avoids rewriting the entire section.

**Rationale**: The prose provides useful context for the agent (what
to check, why it matters). The tool call provides enforcement. Both
are needed.

### D4: Guard placement — after detection, before checkout

The AskUserQuestion call is placed between the "detect dirty tree"
step and the "execute git checkout -b" step. The agent MUST NOT
proceed to checkout until the user responds.

**Rationale**: This mirrors the issue's recommended fix location
("around line 54" in the skill file).

## Risks / Trade-offs

### Risk: Dual-file maintenance burden
Both files must stay in sync. If one is updated without the other,
the guard diverges.

**Mitigation**: The proposal notes this explicitly. The two files are
rarely edited independently, and the change is small enough that
divergence risk is low.

### Risk: AskUserQuestion not available in all runtimes
Some agent runtimes may not support AskUserQuestion.

**Mitigation**: The instructions already assume AskUserQuestion
availability (it's used in step 1 of the same skill for "what do you
want to build?"). This is not a new dependency.

### Trade-off: No automated stash
The user must manually decide. This adds friction on the happy path
when users intentionally have dirty trees.

**Accepted**: The friction is intentional. Silent branch switches are
more dangerous than a confirmation prompt.

## Known Remaining Instances

The same T1 (prose-only dirty-tree guard) vulnerability exists in at
least five additional files. These are intentionally out of scope for
this change (scoped to the two files from issues #350 and #353) but
are documented here to prevent a false sense of complete closure:

| File | Guard Location |
|------|---------------|
| `.opencode/skills/openspec-archive-change/SKILL.md` | ~line 73 |
| `.opencode/skills/speckit-workflow/SKILL.md` | ~line 123 |
| `.opencode/commands/speckit.specify.md` | ~line 42 |
| `.opencode/commands/cobalt-crush.md` | ~line 102 |
| `.opencode/commands/speckit.implement.md` | ~line 141 |

A follow-up issue should be filed to harden all remaining instances
with the same AskUserQuestion pattern established by this change.

## Coverage Strategy

This change modifies Markdown instruction files (agent skill and
command files), not Go source code. Automated unit/integration/e2e
tests are not applicable. Verification is through structural
inspection of the modified files (tasks 2.1 and 2.2), confirming
that the AskUserQuestion tool-call instruction is present and
correctly placed. This satisfies Constitution Principle IV's intent
for content-only changes.
