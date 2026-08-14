## ADDED Requirements

### FR-001: Phase 4 Entry Gate in uf.address-feedback

Before executing any Phase 4 sub-steps (4.1 code changes,
4.2 commits, 4.4 push, 4.5 reply comments, 4.6 thread
resolution), the command MUST present a mandatory gate that
summarizes the queued execution plan and obtains human
confirmation.

The gate MUST include:
- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard
- A summary of queued actions (count of code changes,
  commits, reply comments, thread resolutions)
- Question tool invocation with explicit proceed/skip options
- `>>> END MANDATORY GATE <<<` closing marker

The Phase 4 entry gate supplements, but does NOT replace,
existing question-tool invocations at individual sub-steps
(4.4 push, 4.5 reply comments). Existing sub-step
confirmations MUST be preserved per FR-006.

#### Scenario: Normal Phase 4 Entry

- **GIVEN** the agent has completed Phase 3 (triage) with
  3 ACCEPT items and 1 MODIFY item
- **WHEN** the agent reaches Phase 4 entry
- **THEN** the agent MUST present the mandatory gate showing
  "4 code changes queued, 4 reply comments planned" and wait
  for human confirmation via the question tool before
  executing any Phase 4 sub-step

#### Scenario: Compressed Context Resume at Phase 4

- **GIVEN** the session was resumed from compressed context
  with Phase 3 completed
- **WHEN** the agent reaches Phase 4 entry
- **THEN** the agent MUST re-present the full execution plan
  and obtain fresh confirmation; it MUST NOT rely on
  confirmation recorded in compressed context

### FR-002: Fix-Branch Commit Gate in uf.review-pr

Before committing AI-generated code on the fix branch
(Step 6, sub-step 6 — `git commit`), the command MUST
present a mandatory gate that shows the staged diff and
proposed commit message.

The gate MUST include:
- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard
- Display of `git diff --cached --stat` output
- Display of the proposed commit message
- Question tool invocation with explicit proceed/skip options
- `>>> END MANDATORY GATE <<<` closing marker

#### Scenario: Fix Branch Commit Preview

- **GIVEN** the agent has created a fix branch and staged
  changes for a pre-existing CI failure
- **WHEN** the agent is about to commit on the fix branch
- **THEN** the agent MUST present the mandatory gate showing
  the staged diff summary and commit message, and wait for
  human confirmation before executing `git commit`

#### Scenario: Fix Branch Compressed Context Resume

- **GIVEN** the session was resumed from compressed context
  with fix branch changes staged
- **WHEN** the agent reaches the commit step
- **THEN** the agent MUST re-present the staged diff and
  commit message and obtain fresh confirmation

### FR-003: Spec File Edit Gate in uf.review-council

Before applying auto-fixes to spec files (Spec Review Mode,
Step 8 item 3 — LOW/MEDIUM severity findings), the command
MUST present a mandatory gate that lists the planned spec
file edits and obtains human confirmation.

The gate MUST include:
- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard
- A summary of LOW/MEDIUM findings to be auto-fixed
  (count and categories)
- Question tool invocation with explicit proceed/skip options
- `>>> END MANDATORY GATE <<<` closing marker

#### Scenario: Spec Auto-Fix Entry

- **GIVEN** the council has identified 3 LOW findings and
  2 MEDIUM findings in spec review mode
- **WHEN** the agent is about to apply auto-fixes
- **THEN** the agent MUST present the mandatory gate listing
  "5 spec fixes planned (3 LOW, 2 MEDIUM)" with categories,
  and wait for human confirmation before editing any spec file

#### Scenario: No Auto-Fixable Findings

- **GIVEN** the council has identified only HIGH/CRITICAL
  findings
- **WHEN** the agent reaches the auto-fix step
- **THEN** the agent MUST skip the gate (no auto-fixes to
  apply) and proceed to reporting

### FR-004: Commit Message Gate in uf.finale Step 3

The existing commit message confirmation in Step 3 MUST be
wrapped in the formal mandatory gate pattern with a
session-resume guard.

The gate MUST include:
- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard referencing the proposed commit
  message
- The existing question tool invocation (approve/edit/
  provide own)
- `>>> END MANDATORY GATE <<<` closing marker

#### Scenario: Commit Message Confirmation

- **GIVEN** the agent has generated a commit message for
  staged changes
- **WHEN** the agent presents the commit message to the user
- **THEN** the presentation MUST be wrapped in
  `>>> MANDATORY GATE <<<` markers with a session-resume
  guard

#### Scenario: Step 3 Compressed Context Resume

- **GIVEN** the session was resumed from compressed context
  with changes staged
- **WHEN** the agent reaches Step 3
- **THEN** the agent MUST re-generate or re-present the
  commit message and obtain fresh confirmation

### FR-005: Push Gate in uf.finale Step 4

The existing push confirmation in Step 4 MUST be wrapped in
the formal mandatory gate pattern with a session-resume guard.

The gate MUST include:
- `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
  opening marker
- A session-resume guard referencing the push target
- The existing question tool invocation (push/abort)
- `>>> END MANDATORY GATE <<<` closing marker

#### Scenario: Push Confirmation

- **GIVEN** the agent has committed changes locally
- **WHEN** the agent reaches Step 4 (push)
- **THEN** the push confirmation MUST be wrapped in
  `>>> MANDATORY GATE <<<` markers with a session-resume
  guard

#### Scenario: Diverged Branch Push

- **GIVEN** the branch has diverged from the remote
- **WHEN** the agent presents the push confirmation
- **THEN** the divergence warning MUST appear within the
  mandatory gate, before the question tool options

## MODIFIED Requirements

### FR-006: Existing Gates MUST Remain Unchanged

Previously: Existing gates in uf.review-council.md (Step 7f),
uf.review-pr.md (review posting), uf.finale.md (Steps 2, 5,
6, 6b) are correctly structured.

Modified: These gates MUST NOT be altered. New gates MUST be
structurally consistent with existing gates but MUST NOT
modify existing gate content or placement.

## REMOVED Requirements

None.
