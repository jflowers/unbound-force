## ADDED Requirements

### Requirement: FR-001 Label creation confirmation gate

Before executing `gh label create`, the agent MUST use the
AskUserQuestion tool to obtain explicit user confirmation.

The prompt MUST present the label name and include options:
`["Yes -- create and apply label '<label>'", "No -- skip"]`.

If the user selects "No -- skip", the agent MUST skip both
label creation and label application, record the skip in
`actions_taken`, and continue to the next triage action.

#### Scenario: Label does not exist and user confirms

- **GIVEN** the triage classification maps to label `question`
- **AND** the label `question` does not exist in the repository
- **WHEN** the agent presents AskUserQuestion with
  `["Yes -- create and apply label 'question'", "No -- skip"]`
- **AND** the user selects "Yes -- create and apply label
  'question'"
- **THEN** the agent SHALL execute `gh label create "question"`
- **AND** the agent SHALL execute
  `gh issue edit <N> --add-label "question"`

#### Scenario: Label does not exist and user declines

- **GIVEN** the triage classification maps to label `question`
- **AND** the label `question` does not exist in the repository
- **WHEN** the agent presents AskUserQuestion with
  `["Yes -- create and apply label 'question'", "No -- skip"]`
- **AND** the user selects "No -- skip"
- **THEN** the agent SHALL NOT execute `gh label create`
- **AND** the agent SHALL NOT execute `gh issue edit --add-label`
- **AND** the agent SHALL record `labels_applied: []` in
  `actions_taken`
- **AND** the agent SHALL proceed to Section 4.3

#### Scenario: Label does not exist, user confirms, but creation fails

- **GIVEN** the triage classification maps to label `question`
- **AND** the label `question` does not exist in the repository
- **WHEN** the agent presents AskUserQuestion with
  `["Yes -- create and apply label 'question'", "No -- skip"]`
- **AND** the user selects "Yes -- create and apply label
  'question'"
- **AND** `gh label create "question"` fails due to
  insufficient permissions
- **THEN** the agent SHALL report the specific label that
  could not be created
- **AND** the agent SHALL NOT execute
  `gh issue edit --add-label`
- **AND** the agent SHALL record `label_creation_failed: true`
  in `actions_taken`
- **AND** the agent SHALL proceed to Section 4.3

The confirmation gate applies uniformly to all label
categories in the mapping table (bug, feature, enhancement,
question, opinion, duplicate, needs-clarification). Scenarios
use representative labels; the behavior is identical for all
categories.

### Requirement: FR-002 Label application confirmation gate

Before executing `gh issue edit --add-label`, when the label
already exists in the repository, the agent MUST use the
AskUserQuestion tool to obtain explicit user confirmation.

The prompt MUST present the label name and include options:
`["Yes -- apply label '<label>'", "No -- skip"]`.

#### Scenario: Label exists and user confirms

- **GIVEN** the triage classification maps to label `bug`
- **AND** the label `bug` exists in the repository
- **WHEN** the agent presents AskUserQuestion with
  `["Yes -- apply label 'bug'", "No -- skip"]`
- **AND** the user selects "Yes -- apply label 'bug'"
- **THEN** the agent SHALL execute
  `gh issue edit <N> --add-label "bug"`

#### Scenario: Label exists and user declines

- **GIVEN** the triage classification maps to label `bug`
- **AND** the label `bug` exists in the repository
- **WHEN** the agent presents AskUserQuestion with
  `["Yes -- apply label 'bug'", "No -- skip"]`
- **AND** the user selects "No -- skip"
- **THEN** the agent SHALL NOT execute `gh issue edit --add-label`
- **AND** the agent SHALL record `labels_applied: []` in
  `actions_taken`
- **AND** the agent SHALL proceed to Section 4.3

Note: FR-001 and FR-002 are alternative flows (not
sequential). FR-001 applies when the label does not exist
in the repository (combined create-and-apply gate). FR-002
applies when the label already exists (apply-only gate).

## MODIFIED Requirements

### Requirement: FR-003 Section 4.2 auto-apply policy

Previously: "Labels are applied automatically without user
confirmation, with one exception: the `duplicate` label requires
user confirmation because it carries implicit 'close' semantics."

New text: ALL label mutations (create and apply) MUST require
explicit user confirmation via AskUserQuestion before execution.
The `duplicate` label retains its supplementary confirmation
gate about close semantics in addition to the general
confirmation gate.

#### Scenario: Duplicate label gets two confirmations

- **GIVEN** the triage classification maps to label `duplicate`
- **AND** the label `duplicate` exists in the repository
- **WHEN** the agent presents the general AskUserQuestion with
  `["Yes -- apply label 'duplicate'", "No -- skip"]`
- **AND** the user selects "Yes -- apply label 'duplicate'"
- **THEN** the agent SHALL present the supplementary
  AskUserQuestion informing that the `duplicate` label signals
  the issue should be closed, with options
  `["Yes -- apply duplicate label", "No -- skip"]`
- **AND** only if the user confirms the supplementary gate
  SHALL the agent execute
  `gh issue edit <N> --add-label "duplicate"`

#### Scenario: Duplicate label -- user confirms general gate but declines supplementary gate

- **GIVEN** the triage classification maps to label `duplicate`
- **AND** the label `duplicate` exists in the repository
- **WHEN** the agent presents the general AskUserQuestion with
  `["Yes -- apply label 'duplicate'", "No -- skip"]`
- **AND** the user selects "Yes -- apply label 'duplicate'"
- **AND** the agent presents the supplementary AskUserQuestion
  with options
  `["Yes -- apply duplicate label", "No -- skip"]`
- **AND** the user selects "No -- skip"
- **THEN** the agent SHALL NOT execute
  `gh issue edit <N> --add-label "duplicate"`
- **AND** the agent SHALL record `labels_applied: []` in
  `actions_taken`
- **AND** the agent SHALL proceed to Section 4.3

#### Scenario: Re-run with label already applied

- **GIVEN** the label `bug` is already applied to the issue
  (detected in Phase 1.2)
- **WHEN** the triage classification maps to label `bug`
- **THEN** the agent SHALL skip label application
- **AND** the agent SHALL note "label already present"
- **AND** the agent SHALL NOT present AskUserQuestion

## REMOVED Requirements

None.
