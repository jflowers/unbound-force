## ADDED Requirements

### Requirement: Checklist gate AskUserQuestion enforcement

When any checklist in `FEATURE_DIR/checklists/` has incomplete
items, the agent MUST use the **AskUserQuestion tool** with
options `["Proceed anyway", "Stop -- fix checklists first"]`
to obtain explicit user confirmation before proceeding to
implementation.

The agent MUST NOT proceed to step 3 without receiving a
user response to the AskUserQuestion tool call.

#### Scenario: Incomplete checklists detected

- **GIVEN** the speckit.implement command is executing step 2
- **WHEN** one or more checklists have incomplete items
  (lines matching `- [ ]`)
- **THEN** the agent MUST display the checklist status table
  AND use the AskUserQuestion tool with options
  `["Proceed anyway", "Stop -- fix checklists first"]`
  AND wait for the user's selection before continuing

#### Scenario: User selects "Stop"

- **GIVEN** the AskUserQuestion tool has been presented with
  checklist gate options
- **WHEN** the user selects "Stop -- fix checklists first"
- **THEN** the agent MUST halt execution immediately and
  report which checklists need attention

#### Scenario: User selects "Proceed"

- **GIVEN** the AskUserQuestion tool has been presented with
  checklist gate options
- **WHEN** the user selects "Proceed anyway"
- **THEN** the agent MUST proceed to step 3

#### Scenario: All checklists complete

- **GIVEN** the speckit.implement command is executing step 2
- **WHEN** all checklists have zero incomplete items
- **THEN** the agent MUST display the status table and
  proceed to step 3 without prompting

### Requirement: Commit/push gate AskUserQuestion enforcement

When all implementation tasks are complete and uncommitted
changes exist in the working tree, the agent MUST use the
**AskUserQuestion tool** with options
`["Yes -- all committed and pushed", "Not yet -- let me commit first"]`
before suggesting any next steps (PR creation, merging,
branch switching, or archiving).

The agent MUST NOT suggest next steps without receiving a
user response to the AskUserQuestion tool call.

#### Scenario: Uncommitted changes after task completion

- **GIVEN** the speckit.implement command has completed all
  tasks in step 9
- **WHEN** `git status --short` reports uncommitted changes
- **THEN** the agent MUST use the AskUserQuestion tool with
  options `["Yes -- all committed and pushed",
  "Not yet -- let me commit first"]`
  AND wait for the user's selection before suggesting any
  next steps

#### Scenario: User selects "Not yet"

- **GIVEN** the AskUserQuestion tool has been presented with
  commit/push gate options
- **WHEN** the user selects "Not yet -- let me commit first"
- **THEN** the agent MUST halt and remind the user to commit
  and push changes, and MUST NOT suggest branch switching,
  PR creation, or merge steps

#### Scenario: User selects "Yes"

- **GIVEN** the AskUserQuestion tool has been presented with
  commit/push gate options
- **WHEN** the user selects "Yes -- all committed and pushed"
- **THEN** the agent MUST proceed to suggest next steps
  (PR creation, merging, archiving)

#### Scenario: Clean working tree after task completion

- **GIVEN** the speckit.implement command has completed all
  tasks in step 9
- **WHEN** `git status --short` reports no uncommitted changes
- **THEN** the agent MUST proceed to suggest next steps
  without prompting

### Requirement: AskUserQuestion tool failure handling

If the AskUserQuestion tool call fails, times out, or returns
a response not matching one of the defined options, the agent
MUST treat the gate as not passed and MUST NOT proceed.

#### Scenario: AskUserQuestion tool unavailable or fails

- **GIVEN** the agent reaches the checklist gate or
  commit/push gate
- **WHEN** the AskUserQuestion tool call fails, is
  unavailable, or returns an unrecognized response
- **THEN** the agent MUST halt execution and report that
  the gate cannot be enforced, and MUST NOT proceed past
  the gate

### Requirement: Session-resume guard for both gates

Both the checklist gate and the commit/push gate MUST include
explicit language that the gate cannot be inherited from
compressed or resumed session context. The gate MUST be
executed fresh in every session regardless of prior context.

The AskUserQuestion tool call is the primary enforcement
mechanism — it mechanically forces the agent to stop. The
session-resume language is a secondary defense against
context compression artifacts. Verification of this
requirement is by structural presence: each gate section
MUST contain a CRITICAL RULE block within 5 lines of the
AskUserQuestion tool call instruction.

#### Scenario: Session resumed with compressed context

- **GIVEN** an agent session has been resumed from compressed
  context that includes prior execution of speckit.implement
- **WHEN** the agent reaches the checklist gate or
  commit/push gate
- **THEN** the agent MUST execute the AskUserQuestion tool
  call regardless of any indication in the compressed context
  that the gate was previously passed

#### Scenario: Structural verification of session-resume guard

- **GIVEN** the modified speckit.implement.md file
- **WHEN** the file is inspected for CRITICAL RULE blocks
- **THEN** each AskUserQuestion tool call instruction MUST
  have a CRITICAL RULE block within 5 lines that includes
  session-resume guard language

## MODIFIED Requirements

### Requirement: Checklist gate enforcement mechanism

The checklist gate (step 2, lines 38-47) MUST use the
AskUserQuestion tool instead of inline question text.

Previously: "STOP and ask: 'Some checklists are incomplete.
Do you want to proceed with implementation anyway? (yes/no)'"

Now: "Use the **AskUserQuestion tool** with options
`['Proceed anyway', 'Stop -- fix checklists first']`"

### Requirement: Commit/push gate enforcement mechanism

The commit/push gate (step 10, lines 136-151) MUST use the
AskUserQuestion tool to block next-step suggestions until
the user confirms changes are committed and pushed.

Previously: "prompt the user to commit and push before
proceeding" (prose only, no tool call)

Now: "Use the **AskUserQuestion tool** with options
`['Yes -- all committed and pushed',
'Not yet -- let me commit first']`"

## REMOVED Requirements

None.
