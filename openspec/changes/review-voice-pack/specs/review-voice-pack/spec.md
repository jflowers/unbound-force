## ADDED Requirements

### Requirement: Review-Voice Convention Pack Deployment

The scaffold system MUST deploy `review-voice.md` and `review-voice-custom.md`
convention packs to `.opencode/uf/packs/` in every generated repository,
regardless of the detected project language.

`review-voice.md` MUST contain canonical Socratic review voice rules covering
sentence style, diagnostic-question framing, severity signaling through
specificity, and summary/verdict text patterns.

`review-voice-custom.md` MUST be a user-owned, empty extension file that
survives `uf init`. It MUST contain a `pack_id: review-voice-custom` frontmatter
field and a sentinel comment placeholder (`<!-- Add project-specific rules below this line -->`).

The packs MUST appear in the AGENTS.md Convention Packs section when
`ensureAGENTSmdPackSection` runs. `review-voice-custom.md` MUST be omitted
from AGENTS.md when it contains no user-added rules after the sentinel.

#### Scenario: Full scaffold deploys voice packs
- **GIVEN** a clean repository with `go.mod`
- **WHEN** `uf init` is run
- **THEN** `.opencode/uf/packs/review-voice.md` is created with canonical rules
- **AND** `.opencode/uf/packs/review-voice-custom.md` is created as an empty extension file
- **AND** both are listed in AGENTS.md under the Convention Packs section

#### Scenario: Divisor-only scaffold deploys voice packs
- **GIVEN** a repository needing only review assets
- **WHEN** `uf init --divisor-only` is run
- **THEN** both `review-voice.md` and `review-voice-custom.md` are deployed
- **AND** all packs, including voice packs, are listed in AGENTS.md

#### Scenario: Custom pack survives ordinary uf init
- **GIVEN** `review-voice-custom.md` exists with user-added rules
- **WHEN** `uf init` is run without `--force`
- **THEN** `review-voice-custom.md` is NOT overwritten (skipped)
- **AND** `review-voice.md` (canonical) is updated if content differs

#### Scenario: Canonical pack is tool-owned
- **GIVEN** `review-voice.md` is deployed
- **WHEN** the embedded canonical content is updated upstream and `uf init` is run
- **THEN** `review-voice.md` is overwritten with the new canonical content

### Requirement: Review-PR Voice Pack Loading

The `/uf.review-pr` command MUST load `review-voice.md` and
`review-voice-custom.md` when convention packs are available (Step 3.9).
Voice packs MUST NOT be passed to child agent prompts (Step 5). Voice packs
SHOULD be loaded alongside existing packs (`default.md`, language pack,
`-custom.md` overrides, `severity.md`).

#### Scenario: Voice packs loaded alongside code packs
- **GIVEN** convention packs are available at `.opencode/uf/packs/`
- **WHEN** `/uf.review-pr` reaches Step 3.9
- **THEN** `review-voice.md` is read
- **AND** `review-voice-custom.md` is read if it exists
- **AND** pack content is retained for Steps 7 and 9 output formatting

#### Scenario: Voice packs excluded from child prompts
- **GIVEN** voice packs are loaded in Step 3.9
- **WHEN** child agent prompts are composed in Step 5
- **THEN** `review-voice.md` content is NOT included in any child prompt
- **AND** child prompts contain only code-quality packs and severity

#### Scenario: Packs unavailable — no error
- **GIVEN** `.opencode/uf/packs/` does not exist
- **WHEN** `/uf.review-pr` reaches Step 3.9
- **THEN** no error or warning is produced
- **AND** the review proceeds with default prose formatting

### Requirement: Review-PR Voice Rules Applied to Prose Output

The `/uf.review-pr` command MUST apply `review-voice.md` rules to all prose
output: findings, summary text, verdict justification, and GitHub comment
bodies. Voice rules MUST NOT apply to structured tables (CI status, walkthrough,
dispatch provenance), coverage matrices, or raw tool output.

#### Scenario: Finding prose uses Socratic framing
- **GIVEN** `review-voice.md` is loaded
- **WHEN** a finding about a potential issue is formatted in Step 7
- **THEN** the finding uses diagnostic-question framing (e.g., "could this...", "wondering if...")
- **AND** does NOT use imperative demands ("must be fixed", "this is a bug")

#### Scenario: Summary is a brief assessment
- **GIVEN** `review-voice.md` is loaded
- **WHEN** the summary is composed in Step 7
- **THEN** it reads as a brief assessment, not a laundry list of issues

#### Scenario: Verdict is framed as current assessment
- **GIVEN** `review-voice.md` is loaded
- **WHEN** the verdict justification is composed in Step 7
- **THEN** it is framed as the reviewer's current read of the situation
- **AND** not as an authoritative ruling

#### Scenario: Structured tables are NOT modified
- **GIVEN** `review-voice.md` is loaded
- **WHEN** the dispatch provenance table is rendered in Step 7
- **THEN** the table uses the exact structured format defined in the template
- **AND** no Socratic framing or style rules are applied

#### Scenario: GitHub comment body uses voice rules
- **GIVEN** `review-voice.md` is loaded
- **WHEN** the review body is composed for GitHub posting in Step 9
- **THEN** prose sections of the body follow voice rules
- **AND** the `_This review was generated by..._` footer is unchanged

### Requirement: Address-Feedback Voice Rules Applied to Reply Comments

The `/uf.address-feedback` command MUST apply `review-voice.md` rules to
reply comment prose when composing accept, modify, reject, and ask replies
(Phase 4.5). Voice rules MUST NOT apply to structured artifact output
(feedback-triage JSON).

#### Scenario: Reject reply uses Socratic reasoning
- **GIVEN** `review-voice.md` is available and a feedback item is rejected
- **WHEN** the reject reply comment is composed in Phase 4.5
- **THEN** the reasoning uses evidence-based language without imperative demands
- **AND** the reply avoids phrases like "must be fixed" or "this is wrong"

#### Scenario: Ask reply uses conversational framing
- **GIVEN** `review-voice.md` is available and the author has a clarification question
- **WHEN** the ask reply comment is composed in Phase 4.5
- **THEN** the question uses diagnostic, open-ended phrasing

#### Scenario: Accept reply is factual and concise
- **GIVEN** `review-voice.md` is available and a feedback item is accepted
- **WHEN** the accept reply comment is composed in Phase 4.5
- **THEN** it is factual and concise: "Addressed in `<commit_sha>`"
- **AND** no excessive framing or softening is applied

#### Scenario: Feedback-triage artifact is NOT modified
- **GIVEN** `review-voice.md` is available
- **WHEN** the feedback-triage JSON artifact is written in Phase 4.5
- **THEN** the artifact uses the exact structured format
- **AND** no voice rules are applied to JSON content