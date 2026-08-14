## Why

`/uf.unleash` is designed as a fully autonomous pipeline
(Steps 0-10) that takes a spec from draft to demo-ready
code in a single command. However, agents consistently
halt between Step 7 (Implement) and Step 8 (Code Review)
to ask the human for permission to proceed. This has been
observed in at least two independent sessions on the same
day (issue #457).

The root cause is twofold:

1. The Guardrails section (8 rules) does not include an
   explicit autonomy rule prohibiting confirmation-seeking
   between steps.
2. All 11 checkpoint instructions use ambiguous "before
   proceeding" language without explicitly stating "proceed
   immediately to the next step without asking."

This violates Spec 018's acceptance criteria: "The
developer never has to intervene." The prior learning
`inline-stop-instructions-1` documents the same class of
problem in reverse -- behavioral instructions must be
positioned at the decision point, not in a separate
section.

## What Changes

Add explicit autonomy instructions to the `/uf.unleash`
command template to prevent agents from inserting spurious
confirmation checks at step boundaries.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `uf.unleash autonomy`: Add a 9th guardrail prohibiting
  inter-step confirmation-seeking, and add explicit
  "proceed immediately" transition instructions at each
  step checkpoint that precedes another step

### Removed Capabilities
- None

## Impact

- **File**: `internal/scaffold/assets/opencode/commands/uf.unleash.md`
  (canonical source; `.opencode/commands/uf.unleash.md` is
  the deployed copy)
- **Behavior**: Agents will receive explicit instructions to
  proceed autonomously between steps, reducing spurious
  halts at step boundaries
- **Safety**: All existing STOP/EXIT conditions remain
  unchanged (HIGH/CRITICAL spec findings, build failures,
  merge conflicts, 3 review iterations exhausted)
- **Scope**: Prompt engineering change only -- no Go source
  code, CI workflows, or test files are modified

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

This change strengthens autonomous collaboration. The
`/uf.unleash` pipeline's entire purpose is autonomous
execution through well-defined steps with artifact-based
handoffs between phases. Agents halting for unnecessary
human confirmation breaks this autonomy. The fix ensures
the pipeline operates as designed -- fully autonomous with
exits only at documented safety gates.

### II. Composability First

**Assessment**: N/A

This change modifies a single command template's internal
instructions. It does not affect hero composability,
standalone functionality, or introduce dependencies.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output or
provenance metadata. The `/uf.unleash` pipeline's output
structure and execution checklist remain unchanged.

### IV. Testability

**Assessment**: N/A

The behavioral outcome (agent does not halt for
confirmation) is a prompt engineering change that cannot
be verified through automated testing. However, the
structural fix (guardrail text and transition instructions
exist in the file) is verifiable by content inspection.
The existing scaffold drift detection tests continue to
verify file existence and ownership.

### V. Security by Default

**Assessment**: N/A

This change modifies prompt text only. No external inputs,
dependencies, or privilege boundaries are affected.
