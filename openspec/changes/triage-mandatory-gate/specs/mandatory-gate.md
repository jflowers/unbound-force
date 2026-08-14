## ADDED Requirements

### Requirement: Phase 4 Mandatory Gate

The `uf.triage-issue` command MUST include a
`>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
marker block at the entry to Phase 4, immediately after the
Phase 4 heading and before any sub-step instructions.

#### Scenario: Agent reaches Phase 4 boundary
- **GIVEN** the agent has completed Phase 3 (Classify) and
  is about to begin Phase 4 (Act)
- **WHEN** the agent reads the Phase 4 instructions
- **THEN** the agent MUST encounter the mandatory gate
  marker before any mutation instructions

#### Scenario: Agent displays triage summary before gate
- **GIVEN** the agent has reached the mandatory gate in
  Phase 4
- **WHEN** the agent processes the gate instructions
- **THEN** the agent MUST display the Phase 4.1 triage
  summary to the user before presenting the confirmation
  question

#### Scenario: User approves mutations
- **GIVEN** the agent has displayed the triage summary and
  presented the confirmation question via the question tool
- **WHEN** the user selects the approval option
- **THEN** the agent MAY proceed to execute Phase 4
  sub-steps (4.2, 4.3, 4.4) with their individual
  per-action confirmations

#### Scenario: User declines mutations
- **GIVEN** the agent has displayed the triage summary and
  presented the confirmation question via the question tool
- **WHEN** the user selects the decline option
- **THEN** the agent MUST skip all mutation sub-steps
  (4.2, 4.3, 4.4) and proceed directly to Phase 4.5
  (artifact writing)

### Requirement: Compressed-Context Resume Guard

The mandatory gate block MUST include a session-resume guard
that requires re-confirmation when the session has been
resumed from compressed context.

#### Scenario: Session resumed from compressed context
- **GIVEN** the agent session was resumed from compressed
  context and the agent cannot verify that the user
  explicitly confirmed mutations in the current
  uncompressed conversation history
- **WHEN** the agent reaches the Phase 4 mandatory gate
- **THEN** the agent MUST re-display the triage summary
  and obtain fresh confirmation via the question tool
  before proceeding to any mutation

### Requirement: Mutation Safety Reiteration

The mandatory gate block MUST reiterate the `gh api --input
<tmpfile>` requirement for all GitHub mutations (comments,
child issue creation).

#### Scenario: Agent prepares to post comment
- **GIVEN** the user has confirmed mutations through the
  mandatory gate
- **WHEN** the agent reaches a step that involves posting
  a GitHub comment or creating a child issue
- **THEN** the agent MUST use the `gh api --input <tmpfile>`
  pattern (write payload to a temporary file, pass via
  `--input`) and MUST NOT use `gh issue comment` or
  `gh issue create` with inline content

### Requirement: File Sync

Both copies of `uf.triage-issue.md` MUST contain identical
content after the change is applied.

#### Scenario: Scaffold asset matches deployed command
- **GIVEN** the change has been applied to both
  `.opencode/commands/uf.triage-issue.md` and
  `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
- **WHEN** the drift-detection test compares the two files
- **THEN** the files MUST have identical content

## MODIFIED Requirements

### Requirement: Phase 4 heading

The Phase 4 heading retains its "(Interactive)" label.
Previously: the heading was the sole indicator of
interactivity. Now: the heading is supplemented by a
mandatory gate block that enforces the interactive contract.

## REMOVED Requirements

None.
