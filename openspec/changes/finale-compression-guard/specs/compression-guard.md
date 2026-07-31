## ADDED Requirements

### Requirement: Session-Resume Guard

The `/uf.finale` command template MUST include a
session-resume guard between the `## Instructions`
heading and Step 1. The guard MUST instruct the agent
to re-read the full template on session resume and
MUST NOT infer step completion from compressed context
summaries. The guard MUST require re-confirmation via
the AskUserQuestion tool for any gate that was
previously confirmed in compressed context.

#### Scenario: Compression fires after push, before PR creation

- **GIVEN** the agent has completed Steps 1-4 (branch
  gate, staging, commit, push) and context compression
  fires
- **WHEN** the agent resumes execution
- **THEN** the agent MUST re-read the template, recover
  state from the execution checklist, and re-present the
  PR body for approval via AskUserQuestion before calling
  `gh pr create`

#### Scenario: Compression fires during conflict recovery

- **GIVEN** the agent has presented the conflict recovery
  menu (Step 6b) and the user selected option 2 (rebase),
  and context compression fires during the rebase
- **WHEN** the agent resumes execution
- **THEN** the agent MUST read `CONFLICT_OPTION` from the
  checklist and continue with the selected option without
  re-presenting the menu

### Requirement: Execution Checklist

The `/uf.finale` command template MUST include an
execution checklist immediately after the session-resume
guard. The checklist MUST contain:

1. A checkbox `[ ]` for each workflow step (Steps 1-8)
2. State variables for: `BRANCH`, `COMMIT`, `PR_NUMBER`,
   `PR_URL`, `CONFLICT_OPTION`
3. An instruction that the agent MUST update the checklist
   using the Edit tool after completing each step

The agent MUST populate state variables as they become
known and MUST mark checkboxes `[x]` on step completion.

#### Scenario: Agent recovers PR number after compression

- **GIVEN** the agent completed Step 5 (PR creation) and
  set `PR_NUMBER=42` in the checklist, then compression
  fires during Step 6
- **WHEN** the agent resumes and re-reads the checklist
- **THEN** the agent MUST use `PR_NUMBER=42` for the
  `gh pr checks 42 --watch` command without re-querying

#### Scenario: Agent recovers branch name after compression

- **GIVEN** the agent completed Step 1 and set
  `BRANCH=opsx/my-feature` in the checklist, then
  compression fires
- **WHEN** the agent resumes and re-reads the checklist
- **THEN** the agent MUST use `BRANCH=opsx/my-feature`
  for push commands without re-querying

### Requirement: Mandatory Gate Markers

All user-facing confirmation gates in `/uf.finale` MUST
be wrapped with visual markers:

```
>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<
```

and

```
>>> END MANDATORY GATE <<<
```

The following gates MUST be wrapped:
- Step 2: Secrets check confirmation
- Step 5f: PR body approval
- Step 6b: Conflict recovery option selection
- Step 6 (CI failure): CI failure recovery options

#### Scenario: Secrets check gate wrapped

- **GIVEN** the agent encounters potential secret files
  in Step 2
- **WHEN** the agent reaches the secrets check
- **THEN** the confirmation request MUST appear between
  `>>> MANDATORY GATE <<<` and `>>> END MANDATORY GATE
  <<<` markers

#### Scenario: PR body approval gate wrapped

- **GIVEN** the agent has generated a PR title and body
  in Step 5f
- **WHEN** the agent presents the PR content for approval
- **THEN** the approval request MUST appear between
  mandatory gate markers and MUST use the AskUserQuestion
  tool

### Requirement: Step-Level Checkpoint Reminders

Each critical step in `/uf.finale` MUST end with a
one-line checkpoint reminder instructing the agent to
update the execution checklist before proceeding to the
next step. Critical steps are: 2, 3, 4, 5f, 5g, 6, 6b,
7, and 8.

#### Scenario: Agent marks checklist after commit

- **GIVEN** the agent completes Step 3 (commit)
- **WHEN** the agent reads the checkpoint reminder
- **THEN** the agent MUST update the checklist with
  `COMMIT=<hash>` and mark Step 3 as `[x]` before
  proceeding to Step 4

### Requirement: Scaffold Copy Sync

The scaffold copy at
`internal/scaffold/assets/opencode/commands/uf.finale.md`
MUST be identical to `.opencode/commands/uf.finale.md`.
Existing drift detection tests MUST continue to pass.

#### Scenario: Drift detection catches mismatch

- **GIVEN** the command file has been updated with
  compression guards
- **WHEN** the scaffold copy has not been updated
- **THEN** the drift detection test MUST fail

## MODIFIED Requirements

### Requirement: Secrets Check Gate (Step 2)

The secrets check confirmation in Step 2 MUST be wrapped
with mandatory gate markers. Previously, it was prose-only
without visual markers.

(Note: Replacing the prose gate with AskUserQuestion is
tracked separately in #347.)

### Requirement: PR Body Approval (Step 5f)

The PR body approval in Step 5f MUST be wrapped with
mandatory gate markers. The agent MUST use the
AskUserQuestion tool for this confirmation. Previously,
it used a prose-based "Approve, edit, or provide your own?"
pattern without visual markers.

### Requirement: Conflict Recovery (Step 6b)

The conflict recovery option selection in Step 6b MUST be
wrapped with mandatory gate markers. The selected option
MUST be recorded in the execution checklist as
`CONFLICT_OPTION=<N>` so it survives compression.

## REMOVED Requirements

None.
