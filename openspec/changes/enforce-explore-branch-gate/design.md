## Context

The `openspec-explore/SKILL.md` Guardrails section (line 330) contains an
advisory statement: "Don't switch branches without confirmation." This is
prose-only guidance that agents can and do skip, especially when session
context is compressed or resumed. Issue #346 established that advisory
prose is insufficient for confirmation gates -- agents need explicit tool
call instructions to enforce them.

The `openspec-propose/SKILL.md` already contains a robust branch guard
pattern (Step 3) with dirty working tree checks, branch state checks,
and explicit user confirmation. This is the reference implementation for
how branch guards should work in OpenSpec skills.

## Goals / Non-Goals

### Goals
- Replace the advisory guardrail in `openspec-explore/SKILL.md` with an
  explicit, enforceable confirmation gate
- Require `AskUserQuestion` tool call before any branch creation or
  transition to `/opsx-propose` from explore mode
- Present the proposed branch name and options to the user before acting
- Align the pattern with the existing branch guard in `openspec-propose`

### Non-Goals
- Modifying the `openspec-propose` skill (it already has proper guards)
- Adding runtime enforcement (this is skill instruction enforcement, not
  Go code enforcement)
- Changing explore mode's core behavior or stance

## Decisions

### D1: Replace advisory bullet with structured gate section

The single advisory bullet at line 330 will be replaced with a dedicated
subsection under Guardrails that provides explicit, step-by-step
instructions for the confirmation gate. This mirrors how `openspec-propose`
structures its branch guard (Step 3).

**Rationale**: A structured section with numbered steps and explicit tool
call references is harder for agents to skip than a single dash-prefixed
advisory sentence. The parent audit (issue #346) established this pattern.

### D2: Use AskUserQuestion with binary options

The gate will require an `AskUserQuestion` call with two options:
1. "Create branch and proceed"
2. "Stay in explore mode"

**Rationale**: Binary options are clear and unambiguous. The user either
consents to branch creation or stays in explore mode. This matches the
issue #362 specification exactly.

### D3: Include dirty working tree check

The gate will include a dirty working tree check (via `git status --short`)
before presenting the confirmation prompt. If uncommitted changes exist,
the confirmation must warn about them.

**Rationale**: This aligns with the existing pattern in `openspec-propose`
and prevents the secondary risk of silently leaving uncommitted work behind
when switching branches.

### D4: Keep the gate within Guardrails section

The confirmation gate stays in the Guardrails section rather than being
moved to a separate "Branch Guard" section. The Guardrails section is where
agents look for behavioral constraints.

**Rationale**: Moving it elsewhere risks it being overlooked. Guardrails is
the natural home for "you MUST do this before X" instructions.

## Risks / Trade-offs

### Risk: Gate adds friction to natural explore-to-propose flow
When exploration naturally crystallizes into a proposal, the confirmation
gate adds a mandatory pause. This is intentional -- the gate exists
precisely to prevent silent transitions. The user can confirm immediately
if they agree.

### Risk: Agents may still skip the gate under context compression
This is a known limitation of all instruction-based enforcement. The
structured format with explicit tool call references and numbered steps
is the strongest mitigation available at the skill instruction level.
Further hardening would require runtime enforcement (out of scope).

### Trade-off: Verbose guardrail vs. concise list
The replacement text is significantly longer than the single advisory
bullet it replaces. This is acceptable because the expanded text provides
the specificity agents need to consistently execute the gate.
