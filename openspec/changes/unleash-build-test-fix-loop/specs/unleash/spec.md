## ADDED Requirements

### Requirement: Build/test fix loop at blocking gates

When a blocking build/test gate in `/uf.unleash` (the quick
tier's pre-flight hard gate, a per-phase checkpoint, or
Step 6's pre-flight soft gate) reports a failing check, the
gate MUST classify every failure by causality before
acting. Only `change-caused` or unknown-origin failures
MUST enter the build/test fix loop; `pre-existing` and
`environmental` failures MUST NOT enter the loop — the gate
MUST record them in its checkpoint inventory and treat them
as green, mirroring the phase checkpoint's inventory rule.
Each blocking gate MUST carry its own classification wiring
at entry (the quick gate runs before any phase checkpoint
exists).

#### Scenario: Change-caused failure enters the loop

- **GIVEN** the quick tier's pre-flight hard gate reports a
  failing `go build` check introduced by the current change
- **WHEN** the gate classifies the failure
- **THEN** the failure is classified `change-caused` and
  enters the build/test fix loop before any exit fires

#### Scenario: Environmental failure never enters the loop

- **GIVEN** a per-phase checkpoint whose pre-flight reports
  a failing check classified `environmental`
- **WHEN** the gate acts on the classification
- **THEN** the failure is recorded in the checkpoint
  inventory and the gate proceeds as green over it
- **AND** the fix loop is not entered for it

### Requirement: Delegated repair through the delegation contract

Each fix-loop iteration MUST delegate the diagnosis and
repair to cobalt-crush-dev through `uf_delegate_command`
prompt-only (no `command_path`, no `checkpoint_step` — the
calling gate's checkpoint remains the durable record) with
`task_classification` declared per call, then
deterministically re-run the exact detected pre-flight
commands in the calling gate's mode and re-classify any
remaining failures.

#### Scenario: One delegated attempt then re-run

- **GIVEN** a change-caused failing check at a blocking gate
- **WHEN** the fix loop runs an iteration
- **THEN** the repair is delegated via prompt-only
  `uf_delegate_command` with `task_classification` declared
- **AND** the exact pre-flight commands re-run in the
  calling gate's mode
- **AND** remaining failures are re-classified before the
  next action

### Requirement: Durable cross-session iteration budget

The fix-loop iteration count MUST be recorded in the
calling gate's durable checkpoint data as a gate-distinct
free-form `data` key — the phase checkpoint's
`data.fixLoopPhase[N]` key, the quick gate's budget-only
`quick-fix-budget` step (`data.fixLoopQuick`), or Step
6's `data.fixLoopPreflight` — incremented after every
delegated attempt, and read back on resume. The quick
gate's completion claim MUST stay separate: only its
success-only `quick-pre-flight` step signals gate
completion to resume detection, and the budget-only
`quick-fix-budget` step MUST NOT signal completion. The
budget MUST be 3
delegated attempts total across sessions; a resumed session
MUST continue from the recorded count and MUST NOT receive
a fresh budget. A phase checkpoint whose loop succeeds MUST
re-record its verdict as `"green"`, superseding the
`"failed"` record, with the inventory and the gate's data
key carrying forward. Once the budget is exhausted, the gate
MUST take its existing exit path unchanged.

#### Scenario: Budget writes do not complete the quick gate

- **GIVEN** a mid-loop `quick-fix-budget` record with
  `fixLoopQuick` = 2 and no `quick-pre-flight` claim
- **WHEN** a resumed session runs resume detection
- **THEN** implement-done is not derived for the quick
  gate (the gate re-runs)
- **AND** the loop continues from the recorded count of 2

#### Scenario: Loop success supersedes the failed record

- **GIVEN** a phase checkpoint recorded with verdict
  `"failed"` and `data.fixLoopPhase2` = 2
- **WHEN** the third delegated attempt repairs the failure
  and the pre-flight re-run passes
- **THEN** the phase checkpoint re-records verdict `"green"`
- **AND** the inventory and the gate's data key carry
  forward into the superseding record

#### Scenario: Resume continues the spent budget

- **GIVEN** a recorded `phases["2"]` verdict of `"failed"`
  with `data.fixLoopPhase2` = 3
- **WHEN** a resumed session re-enters the loop
- **THEN** the budget is exhausted and the gate takes its
  exit path
- **AND** the resume does not grant 3 additional attempts

#### Scenario: Exhaustion exits unchanged

- **GIVEN** change-caused checks persisting past the
  budget's 3 total iterations at the quick gate
- **WHEN** the gate acts
- **THEN** it exits through its existing
  `implement-phase-checkpoint` exit variant with the failed
  command and its output
