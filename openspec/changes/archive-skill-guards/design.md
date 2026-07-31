## Context

The `openspec-archive-change` skill has two safety gaps
where irreversible actions (archiving with uncommitted
changes, switching branches) are protected by prose
warnings instead of interactive confirmation gates. The
proposal (issue #360) calls for adding `AskUserQuestion`
gates at two points in the skill workflow.

The existing skill file is 156 lines of Markdown
instruction. The changes are localized insertions — no
structural reorganization is needed.

## Goals / Non-Goals

### Goals
- Add an `AskUserQuestion` gate before step 6 (archive)
  that blocks progression when uncommitted changes exist
- Add an `AskUserQuestion` gate before `git checkout main`
  in step 7 to require explicit user confirmation
- Follow the established gate pattern used in other skills
  (e.g., `opsx-propose` dirty-tree guard, `review-pr`
  confirmation gate)

### Non-Goals
- Restructuring the archive skill workflow beyond adding
  gates
- Modifying the `opsx-archive.md` slash command (covered
  by issue #356)
- Adding automated tests for skill files (skills are
  declarative agent instructions)
- Adding session-resume guards beyond the commit-state
  verification (the AskUserQuestion gate itself serves as
  a fresh-context checkpoint)

## Decisions

**D1: Gate placement — between step 5 and step 6**

The commit guard gate belongs after step 5 (commit and
push) completes, before step 6 (archive) begins. This
is the natural checkpoint: the agent has just attempted
to ensure clean state, and the gate verifies the user
confirms that state before the irreversible archive
operation.

Options with abort semantics:
- "Changes committed and pushed — proceed to archive"
- "Abort — need to commit first"

This converts the existing prose warning (lines 85-89)
into an enforcing gate without removing the prose. The
prose remains as context for why the gate exists.

**D2: Gate placement — before `git checkout main`**

The branch-switch gate belongs immediately before the
`git checkout main` command in step 7. Options:
- "Return to main"
- "Stay on branch"

This matches the pattern established in issue #356 for
the `opsx-archive.md` counterpart.

**D3: Prose preservation**

The existing CRITICAL warning text (lines 85-89) is
retained. The `AskUserQuestion` gate is added after the
warning, not as a replacement. This preserves the
explanatory context for agents while adding the
enforcement mechanism.

## Risks / Trade-offs

**Risk: Additional user friction**
Adding two confirmation prompts increases the number of
interactions during archive. This is the intended
trade-off — the parent audit (issue #346) established
that irreversible actions without gates are a higher
risk than minor UX friction.

**Risk: Gate fatigue**
If users routinely confirm without reading, the gates
lose their protective value. Mitigation: the options are
designed to be meaningful choices ("proceed" vs "abort",
"return to main" vs "stay on branch") rather than
simple "continue" confirmations.

**Trade-off: No automated enforcement**
Skill files are Markdown instructions interpreted by AI
agents. There is no runtime mechanism to guarantee an
agent follows the gate instructions. This is inherent
to the skill architecture and accepted as a known
limitation. The gate instructions are the strongest
enforcement available within this architecture.
