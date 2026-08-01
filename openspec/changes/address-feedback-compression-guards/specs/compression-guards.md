## ADDED Requirements

### Requirement: Session-resume guard (FR-001)

The `/uf.address-feedback` command template MUST include a
session-resume guard at the top of the file (after frontmatter,
before Phase 1). The guard MUST instruct the agent to:

1. Re-read the full command template on session resume
2. NOT infer phase completion or triage decisions from
   compressed context summaries
3. Treat only `state.json` as authoritative for item state

#### Scenario: Agent resumes after compression fires

- **GIVEN** the agent is executing `/uf.address-feedback` and
  context compression has fired, producing a summary of
  prior phases
- **WHEN** the agent reads the compressed summary and
  continues execution
- **THEN** the agent MUST re-read the command template,
  reconstruct state from `state.json` and the execution
  checklist, and NOT rely on the compressed summary for
  phase completion status or triage decisions

### Requirement: Execution checklist (FR-002)

The command template MUST define an execution checklist
that the agent renders at the start of execution and
updates in-place using the Edit tool as phases complete.

The checklist MUST include:

- `[ ] Phase 1: Ingest -- N items fetched`
- `[ ] Phase 2: Assess -- N items classified`
- `[ ] Phase 3: Triage -- N/M items decided: nA nM nR nK`
- `[ ] Phase 4.1: Code changes -- N files modified`
- `[ ] Phase 4.2: Commits -- N commits created`
- `[ ] Phase 4.3: Review-council -- iteration N, PASS/FAIL`
- `[ ] Phase 4.4: Push -- committed`
- `[ ] Phase 4.5: Reply comments -- N/M posted`

Where `nA`=Accept, `nM`=Modify, `nR`=Reject, `nK`=Ask counts.

#### Scenario: Agent tracks triage progress

- **GIVEN** the agent is in Phase 3 and has triaged 3 of 6
  items (2 Accept, 1 Reject)
- **WHEN** the agent completes the triage of item 3
- **THEN** the agent MUST update the checklist to read
  `[ ] Phase 3: Triage -- 3/6 items decided: 2A 0M 1R 0K`
  using the Edit tool

#### Scenario: Agent completes Phase 3

- **GIVEN** the agent has triaged all 6 items
  (3 Accept, 1 Modify, 1 Reject, 1 Ask)
- **WHEN** the user confirms the triage summary
- **THEN** the agent MUST update the checklist to read
  `[x] Phase 3: Triage -- 6/6 items decided: 3A 1M 1R 1K`

### Requirement: Step-level checkpoint reminders (FR-003)

Each phase section in the command template MUST end with a
checkpoint reminder instructing the agent to update the
execution checklist before proceeding to the next phase.

The reminder MUST use the format:
```
> CHECKPOINT: Update the execution checklist above
> before proceeding to Phase N+1.
```

#### Scenario: Phase 1 completion

- **GIVEN** the agent has completed Phase 1 (Ingest) and
  identified 6 feedback items
- **WHEN** the agent reaches the Phase 1 checkpoint
- **THEN** the agent MUST update the checklist to read
  `[x] Phase 1: Ingest -- 6 items fetched` before
  proceeding to Phase 2

#### Scenario: Phase 2 completion

- **GIVEN** the agent has completed Phase 2 (Assess) and
  classified all 6 items
- **WHEN** the agent reaches the Phase 2 checkpoint
- **THEN** the agent MUST update the checklist to read
  `[x] Phase 2: Assess -- 6 items classified` before
  proceeding to Phase 3

## MODIFIED Requirements

### Requirement: Phase 4.5 posting gate hardening (FR-004)

Previously: Phase 4.5 required AskUserQuestion confirmation
before posting reply comments.

The posting gate MUST additionally require verification that
the execution checklist shows:
1. Phase 3 is marked `[x]` with all items decided
2. Phase 4.1 through 4.4 are marked `[x]`

If the checklist is missing, incomplete, or shows Phase 3 as
not complete, the agent MUST NOT present comments for posting.
Instead, the agent MUST re-read the template and rebuild state
from `state.json` and the git log.

#### Scenario: Posting gate with complete checklist

- **GIVEN** the execution checklist shows all phases through
  4.4 as complete
- **WHEN** the agent reaches Phase 4.5
- **THEN** the agent MUST present prepared reply comments to
  the user via AskUserQuestion for confirmation before posting

#### Scenario: Posting gate with incomplete checklist

- **GIVEN** the execution checklist shows Phase 3 as
  incomplete or the checklist is missing
- **WHEN** the agent reaches Phase 4.5
- **THEN** the agent MUST NOT present comments for posting
  and MUST re-read the command template and rebuild state

### Requirement: Phase 4.3 council gate state tracking (FR-005)

Previously: Phase 4.3 tracked review-council pass/fail and
iteration count in-context only.

The execution checklist MUST track the review-council
iteration count and pass/fail status. The "do not push until
council passes" constraint MUST be verifiable from the
checklist, not just from in-context memory.

#### Scenario: Council gate after compression

- **GIVEN** the agent has run `/uf.review-council` twice
  (iteration 1 failed, iteration 2 passed) and compression
  fires
- **WHEN** the agent resumes and checks the checklist
- **THEN** the checklist MUST show
  `[x] Phase 4.3: Review-council -- iteration 2, PASS`
  confirming that the agent may proceed to push

### Requirement: Scaffold copy sync (FR-006)

The scaffold copy at
`internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
MUST be updated to match the command file at
`.opencode/commands/uf.address-feedback.md` exactly.

#### Scenario: Drift detection passes

- **GIVEN** both copies of the command file exist
- **WHEN** the drift detection test runs
- **THEN** both files MUST be byte-identical

## REMOVED Requirements

(none)
