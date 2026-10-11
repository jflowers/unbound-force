## ADDED Requirements

### Requirement: issue_content field

FR-100: `BuildReviewPromptsInputSchema` and
`DispatchReviewRunsInputSchema` MUST accept an optional
`issue_content` field of type `z.string()`.

FR-101: When `mode === "triage"`, `issue_content` MUST be
required. The superRefine block MUST emit a validation error
if `issue_content` is absent.

FR-102: When `mode !== "triage"`, `issue_content` MUST be
rejected. The superRefine block MUST emit a validation error
if `issue_content` is present.

FR-103: `issue_content` MUST be listed in
`UNTRUSTED_SECTION_NAMES` so its value receives
untrusted-evidence delimiters in the assembled prompt.

#### Scenario: Triage call with issue_content succeeds

- **GIVEN** `mode` is `"triage"` and `issue_content` is a
  non-empty JSON string
- **WHEN** `build_review_prompts` is called without
  `diff_path` or `changed_files`
- **THEN** validation passes and a prompt file is assembled
  for each agent

#### Scenario: Triage call without issue_content rejected

- **GIVEN** `mode` is `"triage"` and `issue_content` is
  absent
- **WHEN** `build_review_prompts` is called
- **THEN** a Zod validation error is returned citing
  `issue_content` as required for triage mode

#### Scenario: Code review call with issue_content rejected

- **GIVEN** `mode` is `"code"` and `issue_content` is
  provided
- **WHEN** `build_review_prompts` is called
- **THEN** a Zod validation error is returned citing
  `issue_content` as not applicable for code review mode

---

### Requirement: Triage confinement rule

FR-110: `buildReviewPrompts` MUST emit
`TRIAGE_CONFINEMENT_RULE` in Section 9 when `mode === "triage"`.

FR-111: `TRIAGE_CONFINEMENT_RULE` MUST NOT reference diffs,
changed lines, or file modifications.

FR-112: `TRIAGE_CONFINEMENT_RULE` MUST confine the agent to
the issue content and repository context provided in the
prompt.

#### Scenario: Triage prompt uses triage confinement

- **GIVEN** `mode` is `"triage"`
- **WHEN** `buildReviewPrompts` assembles a prompt
- **THEN** Section 9 contains `TRIAGE_CONFINEMENT_RULE` and
  does NOT contain the word "diff"

---

### Requirement: Triage response contract

FR-120: `buildReviewPrompts` MUST emit
`TRIAGE_RESPONSE_CONTRACT` in Section 11 when
`mode === "triage"`.

FR-121: `TRIAGE_RESPONSE_CONTRACT` MUST require one of
three verdicts: `VALID`, `INVALID`, or
`NEEDS-CLARIFICATION`.

FR-122: `TRIAGE_RESPONSE_CONTRACT` MUST require the
following structured fields: `verdict`, `category`,
`objectivity`, `reasoning`, and `split_recommendation`.

FR-123: `TRIAGE_RESPONSE_CONTRACT` MUST NOT reference
APPROVE, APPROVE WITH ADVISORIES, or REQUEST CHANGES
verdicts.

#### Scenario: Triage prompt uses triage response contract

- **GIVEN** `mode` is `"triage"`
- **WHEN** `buildReviewPrompts` assembles a prompt
- **THEN** Section 11 contains "VALID", "INVALID", and
  "NEEDS-CLARIFICATION" and does NOT contain "APPROVE"

---

### Requirement: Triage prohibitions

FR-130: `buildReviewPrompts` MUST emit
`TRIAGE_PROHIBITIONS` in Section 10 when
`mode === "triage"`.

FR-131: `TRIAGE_PROHIBITIONS` MUST NOT reference diffs or
changed files.

FR-132: `TRIAGE_PROHIBITIONS` MUST prohibit creating child
issues or pull requests.

#### Scenario: Triage prompt uses triage prohibitions

- **GIVEN** `mode` is `"triage"`
- **WHEN** `buildReviewPrompts` assembles a prompt
- **THEN** Section 10 contains `TRIAGE_PROHIBITIONS`

---

### Requirement: Issue content prompt section

FR-140: When `mode === "triage"`, Section 3 of the assembled
prompt MUST be titled `## Issue Content` and MUST contain the
value of `issue_content`.

FR-141: When `mode === "triage"`, Section 3 MUST NOT be
titled `## Diff` and MUST NOT contain diff content.

FR-142: When `mode === "triage"`, Section 4 MUST be titled
`## Input Context` (without "Changed Files").

#### Scenario: Triage prompt has Issue Content section

- **GIVEN** `mode` is `"triage"` and `issue_content`
  contains `{"title":"Bug report","body":"Steps to
  reproduce..."}`
- **WHEN** `buildReviewPrompts` assembles a prompt
- **THEN** Section 3 heading is `## Issue Content` and the
  section body contains the issue content JSON

---

## MODIFIED Requirements

### Requirement: diff_path and changed_files optionality

Previously: `diff_path` and `changed_files` were required
(`z.string().min(1)`) in both `BuildReviewPromptsInputSchema`
and `DispatchReviewRunsInputSchema`.

FR-150: `diff_path` and `changed_files` MUST be optional
(`z.string().min(1).optional()`) at the Zod schema level.

FR-151: A superRefine block MUST enforce that `diff_path` is
required when `mode !== "triage"`.

FR-152: A superRefine block MUST enforce that `diff_path` is
rejected when `mode === "triage"`.

FR-153: A superRefine block MUST enforce that `changed_files`
is required when `mode !== "triage"`.

FR-154: A superRefine block MUST enforce that `changed_files`
is rejected when `mode === "triage"`.

#### Scenario: Code review without diff_path is rejected

- **GIVEN** `mode` is `"code"` and `diff_path` is absent
- **WHEN** `build_review_prompts` is called
- **THEN** a Zod validation error is returned citing
  `diff_path` as required for code review mode

#### Scenario: Triage with diff_path is rejected

- **GIVEN** `mode` is `"triage"` and `diff_path` is provided
- **WHEN** `build_review_prompts` is called
- **THEN** a Zod validation error is returned citing
  `diff_path` as not applicable for triage mode

#### Scenario: Code review with all required fields succeeds

- **GIVEN** `mode` is `"code"`, `diff_path` and
  `changed_files` are provided
- **WHEN** `build_review_prompts` is called
- **THEN** validation passes and prompt files are assembled
  (backward compatibility)

---

### Requirement: dispatch_review_runs forwards issue_content

FR-160: `dispatch_review_runs` MUST forward
`input.issue_content` to `buildReviewPrompts` when present.

#### Scenario: Triage dispatch forwards issue_content

- **GIVEN** `dispatch_review_runs` is called with
  `mode === "triage"` and `issue_content` provided
- **WHEN** the tool invokes `buildReviewPrompts` internally
- **THEN** `issue_content` is included in the forwarded
  arguments

---

### Requirement: Command file alignment

FR-170: `uf.triage-issue.md` Phase 2.3 MUST instruct the
agent to omit `diff_path` and `changed_files` when calling
`dispatch_review_runs`.

FR-171: `uf.triage-issue.md` Phase 2.3 MUST instruct the
agent to pass `issue_content` as a JSON string containing
the issue title, body, comments, labels, state, and author
association from Phase 1.

#### Scenario: Command file omits diff fields

- **GIVEN** an agent reads `uf.triage-issue.md` Phase 2.3
- **WHEN** it constructs a `dispatch_review_runs` call
- **THEN** the call omits `diff_path` and `changed_files`
  and includes `issue_content`

---

## REMOVED Requirements

None.
