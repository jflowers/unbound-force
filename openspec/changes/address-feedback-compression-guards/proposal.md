## Why

When OpenCode's context compression fires during an `/uf.address-feedback`
session, the four-phase sequential workflow (Ingest, Assess, Triage,
Execute) spans enough tool calls that the compression system can activate
between phases. The summary preserves fetched data (PR metadata, comment
list) but discards:

1. **Phase 3 triage decisions** -- interactive Accept/Modify/Reject/Ask
   decisions accumulated in-context are lost before Phase 4 can execute
   them, causing the agent to re-triage or apply wrong/missing changes.
2. **Phase 4.5 posting gate** -- the mandatory AskUserQuestion
   confirmation before posting reply comments may be bypassed if
   compressed context is treated as prior authorization.
3. **Phase 4.3 review-council iteration state** -- the fix loop count
   and "do not push until council passes" constraint are lost, risking
   pushes of unreviewed code.

The root cause is the same as #373 (`/uf.review-pr`): the command
template is injected as conversation content, making it subject to
compression heuristics. The cache (`state.json`) persists assessment
results (Phase 2) but not Phase 3 triage decisions, leaving them
fully vulnerable to mid-session compression.

Fixes: #381
Related: #373 (same root cause for `/uf.review-pr`), #346 (APPROVE
gate bypass pattern)

## What Changes

Add three compression-resilience mechanisms to
`.opencode/commands/uf.address-feedback.md` (and its scaffold copy),
following the same pattern established for `/uf.review-pr`:

1. **Session-resume guard** at the top of the file instructing the
   agent to re-read the template on resume and treat only the cache
   (`state.json`) as authoritative for item state.
2. **Execution checklist** that the agent updates in-place using the
   Edit tool as each phase and sub-step completes, including running
   triage decision counts.
3. **Step-level checkpoint reminders** at the end of each phase and
   major sub-step, reminding the agent to mark the checklist before
   proceeding.
4. **Phase 4.5 posting gate hardening** referencing the checklist to
   prevent bypassed confirmation.

## Capabilities

### New Capabilities
- `compression-resilient-triage`: Triage decisions survive context
  compression through checklist persistence and session-resume guards
- `checkpoint-reminders`: Per-phase checkpoint reminders ensure the
  agent tracks progress through the execution checklist

### Modified Capabilities
- `phase-4.5-posting-gate`: Hardened to reference the execution
  checklist, preventing bypass via compressed context
- `phase-4.3-council-gate`: Checklist tracks iteration count to
  prevent premature push after compression

### Removed Capabilities
- (none)

## Impact

- **Files modified**: `.opencode/commands/uf.address-feedback.md`,
  `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
- **Behavioral change**: The command template grows by ~30-40 lines
  to accommodate guards, checklist, and checkpoint reminders. No
  functional change to the four-phase workflow itself.
- **Drift detection**: Existing scaffold drift tests will verify
  both copies stay in sync.
- **Backward compatibility**: Fully backward compatible. The guards
  are advisory instructions to the agent -- they add resilience
  without changing the happy-path workflow.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies a slash command template (agent instructions),
not inter-hero artifact formats or communication patterns. The
feedback-triage artifact schema and cache format are unchanged.

### II. Composability First

**Assessment**: N/A

The change is internal to the address-feedback command. No new
dependencies are introduced. The command remains independently
usable without other heroes.

### III. Observable Quality

**Assessment**: PASS

The execution checklist makes the agent's progress through the
workflow observable. Triage decision counts in the checklist
(e.g., "Phase 3: 4/6 items decided: 2 ACCEPT, 1 MODIFY, 1 REJECT")
provide machine-inspectable state that survives compression.

### IV. Testability

**Assessment**: PASS

The changes are to a markdown command template. Testability is
maintained through scaffold drift detection tests that verify
the command file and its scaffold copy stay in sync. The guards
themselves are agent behavioral instructions that are validated
through manual invocation.

### V. Security by Default

**Assessment**: N/A

This change does not introduce new inputs, external dependencies,
privilege decisions, or security-sensitive operations. The
modifications are to agent behavioral instructions within a
markdown command template. No supply chain, input validation,
or least privilege concerns apply.
