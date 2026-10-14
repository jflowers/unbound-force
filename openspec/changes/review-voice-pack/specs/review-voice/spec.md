## ADDED Requirements

### Requirement: Review Voice Pack Deployment

FR-001: The scaffold engine MUST deploy `review-voice.md` and
`review-voice-custom.md` to `.opencode/uf/packs/` for all
projects, regardless of detected language.

FR-002: `review-voice.md` MUST be tool-owned (auto-updated on
`uf init` re-runs). `review-voice-custom.md` MUST be user-owned
(never overwritten unless `--force` is used).

FR-003: `review-voice.md` and `review-voice-custom.md` MUST be
included in the `collectDeployedPacks()` candidates list,
growing the always-deployed candidates from 7 entries (default,
default-custom, severity, content, content-custom, ci,
ci-custom) to 9 (adding review-voice and review-voice-custom).

FR-004: `shouldDeployPack()` MUST return true for
`review-voice` and `review-voice-custom` pack names regardless
of the resolved language, growing the always-deploy set from 7
to 9 names.

#### Scenario: Pack deployed for Go project

- **GIVEN** a project with `go.mod` present
- **WHEN** `uf init` is run
- **THEN** `.opencode/uf/packs/review-voice.md` and
  `.opencode/uf/packs/review-voice-custom.md` are created
  alongside `default.md`, `severity.md`, `content.md`,
  `ci.md`, and `go.md`

#### Scenario: Pack deployed for project with no detected language

- **GIVEN** a project with no language marker files
- **WHEN** `uf init` is run
- **THEN** `.opencode/uf/packs/review-voice.md` and
  `.opencode/uf/packs/review-voice-custom.md` are created
  alongside default, severity, content, and ci packs

#### Scenario: Custom pack preserved on re-run

- **GIVEN** a project where `review-voice-custom.md` has been
  populated with project-specific rules
- **WHEN** `uf init` is run again
- **THEN** `review-voice-custom.md` is NOT overwritten
- **AND** `review-voice.md` IS updated to the latest canonical
  version

### Requirement: Review Voice Pack Structure

FR-010: The `review-voice.md` pack MUST have YAML frontmatter
with `pack_id: review-voice`, `language: Any`, and
`version: 1.0.0`.

FR-011: The `review-voice.md` pack MUST contain rule sections
covering Applicability, Style-Only Precedence, and Neutral
Voice Defaults, with rules numbered using the `RV-NNN` prefix
and RFC 2119 keywords.

FR-012: The `review-voice.md` pack MUST be exempt from the pack
validator's standard 6-section coding-pack requirement,
following the established exemption pattern for `severity.md`,
`content.md`, and `ci.md` — the skip list grows from three to
four entries.

#### Scenario: Pack validator skips review-voice.md

- **GIVEN** the `review-voice.md` pack exists in
  `.opencode/uf/packs/`
- **WHEN** `TestValidateConventionPack_AllPacksValid` runs
- **THEN** `review-voice.md` is skipped (not validated against
  the 6-section coding pack requirement)
- **AND** no validation error is reported

### Requirement: Drift Detection

FR-020: The embedded pack copy MUST be byte-identical to
`.opencode/uf/packs/review-voice.md`: the file at
`internal/scaffold/assets/opencode/uf/packs/review-voice.md`
MUST match it exactly.

FR-021: The embedded copy at
`internal/scaffold/assets/opencode/uf/packs/review-voice-custom.md`
MUST serve as the initial deployment template only: `uf init`
deploys it on first run and never overwrites the canonical
copy thereafter. The canonical
`.opencode/uf/packs/review-voice-custom.md` MAY diverge from
the embedded template — it is this repository's own
customization surface, exactly as a user's copy is on their
machine.

FR-022: Both files MUST be listed in the `expectedAssetPaths`
manifest in `scaffold_test.go`, growing the convention-pack
entries from 13 to 15.

FR-023: `TestEmbeddedAssets_MatchSource` MUST skip
`opencode/uf/packs/*-custom.md` assets in the byte comparison,
following the established skip pattern (`devcontainer/`,
`specify/`, `uf/sibling-repos.yaml`), with a justification
comment stating that custom packs are user-owned and embedded
copies are initial deployment templates.

#### Scenario: Drift detected when embedded diverges

- **GIVEN** `review-voice.md` is modified in
  `.opencode/uf/packs/` but not in
  `internal/scaffold/assets/opencode/uf/packs/`
- **WHEN** the embedded-asset drift tests run
- **THEN** the test fails with a drift error

#### Scenario: Custom pack divergence is not drift

- **GIVEN** `review-voice-custom.md` is customized with
  repo-specific rules and diverges from its embedded template
- **WHEN** the embedded-asset drift tests run
- **THEN** no drift error is reported for any `*-custom.md`
  pack
- **AND** tool-owned packs such as `review-voice.md` are still
  byte-compared

### Requirement: Voice Rule Content and Precedence

FR-030: The `review-voice.md` pack MUST define neutral-default
rules for sentence style (problem-first, present tense, active
voice), framing (describe the code and impact, not the
author), and tone (direct, respectful, non-sarcastic, no
hedging boilerplate).

FR-031: The pack MUST contain a style-only precedence clause:
voice rules MUST NOT alter severities, verdicts, finding
counts, required footers, tone-tier content requirements,
reply-template required elements, top-15 inline comment
selection, suggestion-block format, or body size limits. Where
a voice rule conflicts with a structural or content
requirement, the structural or content requirement prevails.

FR-032: The pack's applicability MUST cover finding
descriptions, root causes, summaries, verdict justifications,
and GitHub comment and reply bodies. The pack MUST NOT govern
CI tables, walkthrough tables, tool output, severity labels,
verdict values, or structural headers.

FR-033: The `review-voice-custom.md` stub MUST follow the
standard custom pack pattern: CR-NNN rule prefix, sentinel
comment, and `# Custom Rules: Review Voice` heading, and MUST
be skipped by `filterEmptyCustomPacks()` while empty.

#### Scenario: Voice styles finding prose without altering structure

- **GIVEN** a child reviewer produces a finding with severity
  HIGH
- **WHEN** review-voice rules are in effect
- **THEN** the finding description and root cause prose follow
  the configured voice
- **AND** the severity remains HIGH and the finding count is
  unchanged

#### Scenario: Voice rule conflicts with a required footer

- **GIVEN** a custom voice rule that would remove the
  AI-assisted review footer
- **WHEN** the command composes the review body
- **THEN** the footer is included as required
- **AND** the voice rule is ignored for that element

### Requirement: Command Application — uf.review-pr

FR-040: `uf.review-pr.md` Step 8b MUST read `review-voice.md`
and `review-voice-custom.md` before composing inline comments,
and the voice rules MUST apply to the Step 8b inline comment
text and the Step 8d review body prose.

FR-041: Step 6 (terminal output) MUST NOT be altered by
review-voice rules; terminal reports keep their fixed format.

#### Scenario: Inline comments respect voice

- **GIVEN** a PR review with file findings at Step 8b
- **WHEN** the command composes inline comments and the review
  body
- **THEN** the prose follows review-voice rules (default or
  custom)
- **AND** top-15 selection, round-robin ordering, and
  suggestion-block format are unchanged

### Requirement: Command Application — uf.review-council

FR-050: `uf.review-council.md` Step 7d MUST read the
review-voice packs before composing the review body, and the
voice rules MUST apply to the 7d review body, 7e inline
comments, and 7g posted review prose.

FR-051: Step 6 (terminal final report) and Spec Review Mode
output MUST NOT be altered by review-voice rules.

#### Scenario: Council review body respects voice

- **GIVEN** a council review reaching Step 7d with MEDIUM+
  findings
- **WHEN** the review body and inline comments are composed
- **THEN** the finding prose follows review-voice rules
- **AND** the `[SEVERITY]` labels, per-persona sections,
  LOW-as-count summarization, and 60,000-character limit
  behavior are unchanged

### Requirement: Command Application — uf.triage-issue

FR-060: `uf.triage-issue.md` Phase 4.3 MUST read the
review-voice packs before composing the triage comment, and
voice rules MUST apply as a style layer on the comment body.

FR-061: The Phase 4.3 tone-tier content requirements
(VALID=factual analysis; INVALID/OPINION=warm non-dismissive;
NEEDS-CLARIFICATION=specific questions) MUST remain binding;
voice rules MUST NOT replace or weaken them. Phase 4.1
terminal presentation MUST NOT be altered by voice rules.

#### Scenario: Warm tone preserved with voice styling

- **GIVEN** an INVALID triage verdict requiring warm
  non-dismissive tone
- **WHEN** Phase 4.3 composes the comment with review-voice
  rules active
- **THEN** the comment retains effort acknowledgment,
  specific references, alternatives, and engagement invitation
- **AND** sentence style and framing follow the voice
  configuration

### Requirement: Command Application — uf.address-feedback

FR-070: `uf.address-feedback.md` Phase 4.5 MUST apply
review-voice rules to reply comment prose. The Phase 2.1 pack
glob already loads the packs; no additional load step is
required.

FR-071: Required reply elements MUST remain binding:
ACCEPT/MODIFY replies MUST reference the addressing commit
SHA; REJECT replies MUST provide evidence-based reasoning
referencing convention pack rules or the constitution.

#### Scenario: REJECT reply styled with voice, evidence intact

- **GIVEN** a reviewer comment rejected with evidence from a
  convention pack rule
- **WHEN** Phase 4.5 composes the reply with review-voice
  rules active
- **THEN** the reply prose follows the voice configuration
- **AND** the evidence-based reasoning and rule references are
  retained

### Requirement: Child Prompt Inclusion

FR-080: `buildReviewPrompts()` MUST include the review-voice
pack content in dispatched child prompts through the existing
convention-pack glob behavior, with no plugin code changes.

#### Scenario: Child prompt embeds voice pack

- **GIVEN** `.opencode/uf/packs/review-voice.md` exists in a
  project
- **WHEN** any of the four review commands dispatch child
  agents
- **THEN** the child prompt's Convention Packs section
  includes the review-voice pack content

## REMOVED Requirements

None.
