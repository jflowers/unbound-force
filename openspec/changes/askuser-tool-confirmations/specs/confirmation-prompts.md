## ADDED Requirements

(None -- no new interaction points are introduced.)

## MODIFIED Requirements

### Requirement: FR-001 Structured confirmation tool

All human confirmation gates in `/review-pr`,
`/address-feedback`, and `/triage-issue` MUST use the
**AskUserQuestion tool** with predefined option lists
instead of free-text typed responses.

Previously: Commands used free-text prompts with
`(yes/no)`, `(approve/no/edit/change-verdict)`, or
conversational asks requiring the user to type specific
keywords.

#### Scenario: User confirms posting a GitHub review
- **GIVEN** `/review-pr` has completed analysis and
  prepared review comments
- **WHEN** the command presents the posting
  confirmation prompt
- **THEN** the command MUST use the AskUserQuestion
  tool with structured options instead of asking the
  user to type a keyword

#### Scenario: User triages a feedback item
- **GIVEN** `/address-feedback` presents a feedback
  item for triage in Phase 3.2
- **WHEN** the author needs to choose a disposition
- **THEN** the command MUST use the AskUserQuestion
  tool with options `["Accept", "Modify", "Reject",
  "Ask"]` instead of expecting typed keywords

#### Scenario: User confirms duplicate label
- **GIVEN** `/triage-issue` has classified an issue as
  a duplicate
- **WHEN** the command asks whether to apply the
  `duplicate` label
- **THEN** the command MUST use the AskUserQuestion
  tool with options instead of `(yes/no)` text

### Requirement: FR-002 Action-descriptive option labels

All AskUserQuestion option labels MUST describe the
action consequence, not bare keywords.

Previously: Options were presented as `(yes/no)` or
`(approve/no/edit/change-verdict)`.

#### Scenario: Option labels include context
- **GIVEN** any interaction point uses the
  AskUserQuestion tool
- **WHEN** the options are presented to the user
- **THEN** each option label MUST describe what will
  happen (e.g., "Yes -- post as GitHub review" instead
  of "Yes")

### Requirement: FR-003 APPROVE verdict deliberate
  selection

The `/review-pr` APPROVE confirmation MUST use a
clearly-labeled structured option that conveys the
merge-unblocking consequence.

Previously: Required the user to type `"approve"`
explicitly (not `"yes"`) to prevent reflexive
confirmation.

#### Scenario: APPROVE verdict confirmation
- **GIVEN** `/review-pr` verdict is APPROVE
- **WHEN** the posting confirmation is presented
- **THEN** the command MUST use the AskUserQuestion
  tool with an option labeled to convey the
  merge-unblocking consequence (e.g.,
  "Approve -- post review")
- **AND** the option list MUST include escape hatches
  for editing and changing the verdict

### Requirement: FR-004 Multi-step interaction pattern

When a structured option choice requires follow-up
free-form input, the follow-up MUST use the
AskUserQuestion tool in open-ended mode.

Previously: Not specified; follow-up input was
implicit.

#### Scenario: MODIFY decision requires alternative
  approach
- **GIVEN** the author selects "Modify" for a feedback
  item in `/address-feedback`
- **WHEN** the command needs the alternative approach
- **THEN** the command MUST use the AskUserQuestion
  tool (open-ended, no preset options) to collect the
  alternative approach text

#### Scenario: REJECT decision requires reasoning
- **GIVEN** the author selects "Reject" for a feedback
  item in `/address-feedback`
- **WHEN** the command needs the rejection reasoning
- **THEN** the command MUST use the AskUserQuestion
  tool (open-ended, no preset options) to collect the
  evidence-based reasoning

### Requirement: FR-005 Bold formatting convention

All references to the AskUserQuestion tool in command
files MUST use bold PascalCase: `**AskUserQuestion
tool**`.

Previously: Not specified for these three commands.

#### Scenario: Consistent tool naming
- **GIVEN** a command file references the
  AskUserQuestion tool
- **WHEN** the reference appears in instruction text
- **THEN** it MUST be formatted as
  `**AskUserQuestion tool**`

### Requirement: FR-006 Scaffold asset synchronization

After modifying any command file under
`.opencode/commands/`, the corresponding scaffold asset
under `internal/scaffold/assets/opencode/commands/`
MUST be updated to remain byte-identical.

Previously: Already required by scaffold pattern; made
explicit here for this change.

#### Scenario: Scaffold drift detection
- **GIVEN** a command file has been modified
- **WHEN** `go test ./internal/scaffold/...` runs
- **THEN** `TestEmbeddedAssets_MatchSource` MUST pass,
  confirming the scaffold asset matches the source

### Requirement: FR-007 Safety semantics preserved

The conversion to AskUserQuestion MUST NOT weaken any
existing safety gate. Every interaction point that
required confirmation before MUST still require
confirmation after.

Previously: Implicit in the original command designs.

#### Scenario: No review posted without confirmation
- **GIVEN** `/review-pr` has prepared a review
- **WHEN** the AskUserQuestion prompt is presented
- **THEN** the review MUST NOT be posted until the user
  selects a confirming option
- **AND** the critical rule about never posting without
  explicit human confirmation MUST be updated to
  reference the AskUserQuestion tool

#### Scenario: No comments posted without confirmation
- **GIVEN** `/address-feedback` or `/triage-issue` has
  composed a comment
- **WHEN** the posting confirmation is presented
- **THEN** the comment MUST NOT be posted until the
  user selects a confirming option

## REMOVED Requirements

### Requirement: Typed keyword confirmations

Free-text typed keywords (`yes`, `no`, `approve`,
`ACCEPT`, `MODIFY`, `REJECT`, `ASK`) are removed as
the input mechanism for all 15 interaction points.
The AskUserQuestion tool with structured options
replaces them.

**Reason**: Superseded by FR-001 (structured
AskUserQuestion prompts). The safety intent is
preserved through FR-003 and FR-007.
<!-- scaffolded by uf vdev -->
