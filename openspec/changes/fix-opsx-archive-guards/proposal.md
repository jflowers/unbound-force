## Why

The `/opsx-archive` command (`.opencode/commands/opsx-archive.md`)
and its corresponding skill file
(`.opencode/skills/openspec-archive-change/SKILL.md`) have two
structural safety gaps identified in issue #356, traced from the
parent audit in issue #346:

1. **Unguarded branch switch**: The "Return to main branch" step
   executes `git checkout main` without an `AskUserQuestion` gate.
   Branch switches change working directory state and should
   require explicit user confirmation — consistent with the
   pattern established in `/opsx-propose` and the fix applied to
   `/review-pr` after issue #346. This gap exists in both the
   command file (Step 6) and the skill file (Step 7).

2. **Ambiguous target-exists guard**: In the "Perform the archive"
   step, the target-exists check text and the `mv` command block
   are in the correct order (check first, then command), but the
   `mv` code fence appears as a visually separate, unconditional
   instruction. An agent could interpret the code fence as
   "always execute" rather than as the "If no" branch of the
   preceding check. The conditional relationship between the
   guard and the command needs to be made explicit. This
   structural ambiguity exists in both files.

These gaps were discovered during the root cause analysis of
issue #346 (review-pr confirmation gate bypass). Applying the
same hardening patterns across all commands prevents recurrence.

## What Changes

Targeted edits to two files:
- `.opencode/commands/opsx-archive.md` (command file)
- `.opencode/skills/openspec-archive-change/SKILL.md` (skill file)

In both files:

- **Gap A**: Add an `AskUserQuestion` confirmation gate before
  `git checkout main`, with options to return to main or stay
  on the current branch.
- **Gap B**: Make the conditional relationship between the
  target-exists check and the `mv` command explicit, so agents
  treat the `mv` as guarded by the check rather than as an
  unconditional instruction.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `opsx-archive`: Adds user confirmation before branch switch;
  clarifies conditional relationship in target-exists guard

### Removed Capabilities
- None

## Impact

- **Files**:
  - `.opencode/commands/opsx-archive.md` (command file)
  - `.opencode/skills/openspec-archive-change/SKILL.md` (skill file)
- **Scaffold**: No scaffold asset exists for either file under
  `internal/scaffold/assets/`, so no scaffold sync is required
- **Behavioral**: Agents running `/opsx-archive` (via either
  entry point) will now pause for user confirmation before
  switching to main, and will see the `mv` command explicitly
  guarded by the target-exists check
- **Risk**: Low — the changes add a confirmation gate and clarify
  existing logic; no new functionality introduced
- **Upstream**: Consistent with the hardening pattern from
  issue #346 applied to `/review-pr`

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command instructions, not inter-hero
artifact communication. No artifact formats or exchange protocols
are affected.

### II. Composability First

**Assessment**: N/A

This change is internal to the meta repository's command
definitions. No hero dependencies or standalone functionality
are affected.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable outputs or provenance metadata are
affected. The change modifies agent behavioral instructions
only.

### IV. Testability

**Assessment**: PASS

The change targets Markdown instruction files, not executable
code. Testability is achieved through manual verification of
procedural correctness (task 4.1), which is the appropriate
verification mechanism for agent instruction files.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by adding
a mandatory confirmation gate before a state-changing
operation (branch switch) and clarifying guard structure
to prevent ambiguous interpretation of file-moving
operations. Both gaps represent input-validation-adjacent
concerns where agent instructions should enforce explicit
user consent before irreversible actions.
