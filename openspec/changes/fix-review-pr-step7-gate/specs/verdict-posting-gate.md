## MODIFIED Requirements

### Requirement: MR-001 Step 7 AskUserQuestion always executes

The Step 7 `AskUserQuestion` offering to post the review as a
GitHub review MUST execute on every `/uf.review-pr` invocation
that reaches Step 7, regardless of finding severity
distribution. The HIGH+ severity condition MUST only gate the
introductory framing text, not the `AskUserQuestion`.

Previously: The condition "if there are findings with severity
HIGH or above" gated the entire Step 7 block, including the
`AskUserQuestion`. When no HIGH+ findings existed, the user
was never offered to post.

Now: The HIGH+ condition gates only the framing text paragraph.
The `AskUserQuestion` executes unconditionally within Step 7.

The framing text is the paragraph that lists finding counts by
severity (e.g., "I found N findings (X CRITICAL, Y HIGH)").

#### Scenario: Review with only MEDIUM/LOW findings

- **GIVEN** a PR review that completes Steps 1-6
- **AND** the review produces only MEDIUM and LOW findings
- **WHEN** Step 7 executes
- **THEN** the `AskUserQuestion` offering "Post as GitHub
  review" or "Skip posting" MUST be presented to the user
- **AND** the HIGH+ framing text MUST NOT appear.

#### Scenario: Review with zero findings and APPROVE verdict

- **GIVEN** a PR review that completes Steps 1-6
- **AND** the review produces zero findings
- **AND** the verdict is APPROVE
- **WHEN** Step 7 executes
- **THEN** the `AskUserQuestion` offering "Post as GitHub
  review" or "Skip posting" MUST be presented to the user
- **AND** the HIGH+ framing text MUST NOT appear.

#### Scenario: Review with HIGH+ findings

- **GIVEN** a PR review that completes Steps 1-6
- **AND** the review contains at least one HIGH or CRITICAL
  finding
- **WHEN** Step 7 executes
- **THEN** the framing text listing CRITICAL/HIGH counts
  MUST appear before the `AskUserQuestion`
- **AND** the `AskUserQuestion` MUST be presented.

## UNCHANGED Requirements

None.

## REMOVED Requirements

None.
