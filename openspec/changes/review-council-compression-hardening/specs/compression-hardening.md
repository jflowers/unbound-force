## ADDED Requirements

### FR-001: Session-resume guard

The `/uf.review-council` command template MUST include a
session-resume guard blockquote immediately after the
`# Command: /uf.review-council` heading that instructs the
agent to re-read the template on session resume and check
the execution checklist for actual completion state.

#### Scenario: Agent resumes from compressed context

- **GIVEN** an agent executing `/uf.review-council` whose
  session context has been compressed
- **WHEN** the agent resumes execution after compression
- **THEN** the session-resume guard MUST direct the agent
  to re-read the full template and consult the execution
  checklist for completion state, rather than inferring
  step completion from compressed summaries

### FR-002: Execution checklist

The `/uf.review-council` command template MUST include an
execution checklist as a blockquote section listing all
phases and steps with checkbox markers (`[ ]` / `[x]`).
The agent MUST update each checkbox using the Edit tool
as it completes the corresponding phase or step.

#### Scenario: Agent completes Phase 1a

- **GIVEN** an agent executing `/uf.review-council` that
  has completed Phase 1a pre-flight checks
- **WHEN** Phase 1a finishes (pass or fail)
- **THEN** the agent MUST mark the `Phase 1a` checkbox
  as `[x]` in the execution checklist using the Edit
  tool before proceeding to Phase 1b

#### Scenario: Fix loop iteration tracking

- **GIVEN** an agent executing the fix loop (Step 4) on
  iteration 2 of 3
- **WHEN** the agent completes iteration 2
- **THEN** the agent MUST update the fix loop entry in
  the execution checklist to reflect `iteration: 2/3`
  using the Edit tool

#### Scenario: Context compression during fix loop

- **GIVEN** an agent on iteration 2 of the fix loop whose
  context is compressed between iterations
- **WHEN** the agent resumes execution
- **THEN** the agent MUST read the execution checklist to
  determine the current iteration count and resume from
  iteration 3, not restart from iteration 1

### FR-003: Step-level checkpoint reminders

Each phase and step in the `/uf.review-council` command
template MUST end with a one-line checkpoint reminder
instructing the agent to mark that item complete in the
execution checklist using the Edit tool before proceeding.

#### Scenario: Checkpoint at end of Phase 1b

- **GIVEN** an agent that has completed Phase 1b (Gaze
  quality analysis)
- **WHEN** the agent reads the checkpoint reminder at the
  end of Phase 1b
- **THEN** the agent MUST update the execution checklist
  to mark Phase 1b as `[x]` before proceeding to
  Phase 1c

### FR-004: MANDATORY GATE markers on Step 7f

The Step 7f confirmation gate in the `/uf.review-council`
command template MUST be wrapped with high-salience ASCII
delimiters:

- Opening: `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
- Closing: `>>> END MANDATORY GATE <<<`

#### Scenario: Compression of Step 7 instructions

- **GIVEN** an agent executing `/uf.review-council` whose
  Steps 1-6 have been compressed
- **WHEN** the agent reaches Step 7f
- **THEN** the MANDATORY GATE markers MUST be present in
  the uncompressed content, signaling that human
  confirmation via AskUserQuestion is required before
  posting any GitHub review

#### Scenario: Session-resume guard reinforces gate

- **GIVEN** an agent that resumed from compressed context
  and cannot verify prior confirmation
- **WHEN** the agent reaches the MANDATORY GATE section
- **THEN** the agent MUST re-present the review content
  and obtain fresh confirmation via AskUserQuestion,
  consistent with the session-resume guard instruction

### FR-005: Scaffold copy synchronization

The scaffold copy at
`internal/scaffold/assets/opencode/commands/uf.review-council.md`
MUST be updated with identical changes as
`.opencode/commands/uf.review-council.md`.

#### Scenario: Drift detection

- **GIVEN** both copies of `uf.review-council.md` after
  this change is applied
- **WHEN** a drift detection test compares the two files
- **THEN** the files MUST be byte-identical

## MODIFIED Requirements

### FR-006: Step 7f confirmation gate hardening

The existing Step 7f CRITICAL RULE requiring explicit human
confirmation via AskUserQuestion MUST additionally reference
the execution checklist. The agent MUST verify that the
checklist shows Step 7f as unchecked before proceeding with
confirmation, and MUST mark it `[x]` only after the human
confirms.

Previously: Step 7f contained only the CRITICAL RULE text
and session-resume guard (added by PR #371 for review-pr,
but not yet present in review-council).

## REMOVED Requirements

None.
