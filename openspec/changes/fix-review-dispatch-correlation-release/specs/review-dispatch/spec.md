<!-- capability: review-dispatch
     change: fix-review-dispatch-correlation-release
     originating_issue: 794 -->

## ADDED Requirements

### Requirement: Dispatch Session Correlation Lifecycle

**ID: RD-CR-001** This requirement MUST be satisfied.

Each invocation of the aggregate dispatch tool MUST create its own
dispatch session identified by a freshly minted correlation ID,
persisting the invocation's prompts, run files, and session
metadata under that correlation. A later aggregate dispatch
invocation MUST NOT mutate the persisted state of an earlier
dispatch session. The in-process session map MUST resolve a parent
session to its latest dispatch session, re-pointing the entry on
every aggregate dispatch invocation.

#### Scenario: Second workflow in one conversation gets a fresh
session

- **GIVEN** a parent session whose first aggregate dispatch
  (workflow A) completed and was finalized under correlation C1
- **WHEN** a second, different review workflow's aggregate dispatch
  is invoked from the same parent session
- **THEN** the second invocation mints a fresh correlation C2
  distinct from C1 and persists its prompts, run files, and session
  metadata under C2
- **AND** workflow A's dispatch session state under C1 is unchanged
- **AND** finalizing the second workflow publishes an artifact
  whose correlation ID equals C2 without engaging the artifact
  collision retry
- **AND** consolidating with the explicit correlation ID C1 still
  resolves workflow A's dispatch session

#### Scenario: Fix-loop iteration is a self-contained dispatch

- **GIVEN** a review whose first aggregate dispatch was finalized
  with a REQUEST CHANGES verdict and whose findings have since been
  fixed, producing a new head commit and a recomputed plan
- **WHEN** the command re-dispatches all included plan runs from
  the same parent session as the next fix-loop iteration
- **THEN** the re-dispatch mints a fresh correlation and creates a
  new dispatch session carrying the refreshed plan and session
  metadata
- **AND** consolidation without an explicit correlation ID
  validates the new iteration's runs against the new iteration's
  plan and finalizes it under its own artifact
- **AND** the prior iteration's dispatch session and finalization
  artifact survive unchanged as audit trail

#### Scenario: Latest-dispatch resolution after re-pointing

- **GIVEN** a parent session with two completed aggregate
  dispatches, C1 followed by C2
- **WHEN** the consolidation or dispatch status tool is invoked
  without an explicit correlation ID
- **THEN** the tool resolves C2
- **AND** WHEN the same tool is invoked with the explicit
  correlation ID C1, it resolves C1

#### Scenario: Session-less invocation re-points resolution

- **GIVEN** a parent session whose latest completed aggregate
  dispatch ran under correlation C1
- **WHEN** a subsequent aggregate dispatch invocation produces no
  dispatch session directory (every plan entry skipped, or prompt
  building failed before any run was dispatched)
- **THEN** the session map is re-pointed to that invocation's fresh
  correlation, under which no dispatch session directory exists
- **AND** a subsequent consolidation without an explicit
  correlation ID fails closed as not_found rather than returning
  the earlier dispatch's payload

### Requirement: Aggregate Dispatch Correlation Observability

**ID: RD-CR-002** This requirement MUST be satisfied.

The aggregate dispatch tool's result MUST report the invocation's
correlation ID in machine-readable form on every outcome returned
after input validation, so every dispatch session in the
conversation remains addressable by the explicit correlation ID
resolution of RD-FR-027.

#### Scenario: Aggregate dispatch output reports its correlation ID

- **GIVEN** a completed aggregate dispatch invocation
- **WHEN** the caller inspects the invocation's result
- **THEN** the result carries the invocation's correlation ID in
  machine-readable form alongside the run counts

#### Scenario: Session-less outcome still reports its correlation ID

- **GIVEN** an aggregate dispatch invocation in which every plan
  entry was skipped or prompt building failed before any run was
  dispatched
- **WHEN** the caller inspects the invocation's result
- **THEN** the result still carries the invocation's correlation ID

### Requirement: Single-Run Dispatch Session Binding

**ID: RD-CR-003** This requirement MUST be satisfied.

Direct single-run dispatch calls that supply no correlation control
MUST continue to share the parent session's current dispatch
session: the first such call mints the correlation when the session
map has no entry, subsequent calls reuse it, and calls following an
aggregate dispatch invocation join that invocation's session.

#### Scenario: Direct single-run fan-out keeps one session

- **GIVEN** a parent session with no prior aggregate dispatch
- **WHEN** multiple single-run dispatch calls dispatch different
  reviewers from that parent session
- **THEN** all calls share one dispatch session under the first
  call's correlation
- **AND** consolidation without an explicit correlation ID resolves
  that session

#### Scenario: Direct run joins the latest aggregate session

- **GIVEN** a parent session whose latest aggregate dispatch
  invocation ran under correlation C2
- **WHEN** a direct single-run dispatch call is made from that
  parent session
- **THEN** the run is persisted under C2's dispatch session

<!-- scaffolded by uf vdev -->
