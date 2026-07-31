## ADDED Requirements

### Requirement: AskUserQuestion gate for clarification questions

FR-001: Each clarification question in the sequential questioning
loop (step 4) MUST be delivered as a single **AskUserQuestion tool
call**. The agent MUST NOT present the next question until the
previous AskUserQuestion response has been received. The agent
MUST NOT batch multiple questions into a single tool call or
message.

#### Scenario: Multiple-choice question delivery

- **GIVEN** the agent has a multiple-choice clarification question
  with 2-5 options
- **WHEN** the agent presents the question to the user
- **THEN** the agent MUST use the **AskUserQuestion tool** with
  the options rendered as choices, the recommended option listed
  first with "(Recommended)" appended to its label, and a custom
  text option enabled for short free-form answers

#### Scenario: Short-answer question delivery

- **GIVEN** the agent has a short-answer clarification question
  with no meaningful discrete options
- **WHEN** the agent presents the question to the user
- **THEN** the agent MUST use the **AskUserQuestion tool** in
  open-ended mode (no preset options), with the suggested answer
  included in the question text

#### Scenario: Context compression resilience

- **GIVEN** the agent is operating under context compression
  (resumed session, truncated history)
- **WHEN** the agent reaches the sequential questioning loop
- **THEN** the AskUserQuestion tool call requirement MUST still
  be enforced — the tool call is a structural gate, not a
  prose suggestion that can be optimized away

### Requirement: No advancement without tool response

FR-002: The agent MUST NOT advance to the next queued question,
record an answer in working memory, or proceed to spec
integration (step 5) until the AskUserQuestion tool has returned
a response for the current question.

#### Scenario: Premature advancement prevention

- **GIVEN** the agent has presented a question via AskUserQuestion
- **WHEN** the AskUserQuestion tool has not yet returned a
  response
- **THEN** the agent MUST NOT present the next question, record
  an assumed answer, or begin spec integration for the current
  question

### Requirement: Gate marker visibility

FR-003: The AskUserQuestion requirement SHOULD be presented as a
visually prominent gate marker (bold text, horizontal rule, or
similar structural separator) to resist fast-path reasoning
that skips inline constraints.

#### Scenario: Gate marker presence

- **GIVEN** an agent reads the speckit.clarify command file
- **WHEN** the agent reaches step 4 (sequential questioning loop)
- **THEN** the AskUserQuestion gate requirement SHOULD be the
  first instruction encountered, before any formatting details

## MODIFIED Requirements

### Requirement: Sequential questioning loop (step 4)

The existing prose instruction "Present EXACTLY ONE question at a
time" is replaced with explicit AskUserQuestion tool call
language. The content and format of questions (multiple-choice
tables, recommendation presentation, short-answer format) remain
unchanged.

Previously: "Present EXACTLY ONE question at a time." (prose
only, no tool specified)

Now: "Each question MUST be delivered as a single AskUserQuestion
tool call. Do NOT present the next question until the previous
AskUserQuestion response has been received. Do NOT batch
questions together."

## REMOVED Requirements

(None -- no existing requirements are removed by this change.)
