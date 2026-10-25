## Why

`/uf.unleash` positions itself as one command from intent to
demo, but every blocking build/test gate — the quick tier's
pre-flight hard gate, each per-phase checkpoint, and Step 6's
pre-flight soft gate — halted for a human on the first failing
check. Deterministic failures (a flaky import, a missed
gofmt, a broken build after a mechanical edit) stopped the
pipeline even though the fix was exactly the kind of
deterministic work the delegation contract exists for. The
pipeline's autonomy promise ended at the first red check.

## What Changes

Blocking build/test gates in `/uf.unleash` now classify
failures by causality and run a build/test fix loop before
exiting:

- **Causality classification at gate entry** — every failing
  check is classified (`change-caused`, `pre-existing`, or
  `environmental`) before any action. Only `change-caused`
  or unknown-origin failures enter the loop; `pre-existing`
  and `environmental` failures never do — the gate treats
  them as green and records them in the checkpoint
  inventory, mirroring the phase checkpoint's inventory
  rule.
- **Delegated fix loop** — up to 3 iterations of delegating
  diagnosis and repair to cobalt-crush-dev via prompt-only
  `uf_delegate_command` (task_classification declared per
  call), then deterministically re-running the exact
  pre-flight commands in the calling gate's mode.
- **Durable iteration budget** — the 3-iteration count is
  recorded in the calling gate's checkpoint data as
  gate-distinct free-form `data` keys (the phase
  checkpoint's `data.fixLoopPhase[N]` key, the quick
  gate's `data.fixLoopQuick`, or Step 6's
  `data.fixLoopPreflight`), incremented after every
  delegated attempt, and read back on resume. The budget
  is 3 total across sessions, never 3 more per resume.
- **Green supersession** — a phase checkpoint whose loop
  succeeds re-records its verdict as `"green"` (superseding
  the `"failed"` record; inventory and the gate's data key
  carry forward); the quick gate records `quick-pre-flight`;
  Step 6 proceeds to its dispatch.
- **Unchanged exits** — each gate still exits through its
  unchanged `format_unleash_exit` variant once change-caused
  checks persist past the budget's 3 total iterations.

The loop applies at three call sites: the quick-tier
pre-flight hard gate (with its own classification wiring —
the gate runs before any phase checkpoint exists), each
per-phase checkpoint, and Step 6's pre-flight soft gate
(branch-caused or unknown failures).

## Capabilities

### New Capabilities

(none — all requirements land in the existing `unleash`
capability)

### Modified Capabilities
- `unleash`: Adds the build/test fix loop requirements
  (causality-filtered entry, delegated repair, durable
  cross-session budget, green supersession) to the
  pipeline capability.

### Removed Capabilities
(none)

## Impact

- `.opencode/commands/uf.unleash.md`: quick-gate entry
  classification wiring, the fix-loop block (delegation
  template, re-run, supersession, durable budget, resume
  semantics), and the phase-checkpoint `data.fixLoopPhase[N]`
  budget key.
- `internal/scaffold/assets/opencode/commands/uf.unleash.md`:
  byte-identical scaffold mirror (TC-007).
- `internal/scaffold/scaffold_test.go`: scaffold pins —
  per-gate wiring phrases (one distinct phrase per wiring
  site), durable-budget wiring, and the fix-loop
  delegation-shape pin (uf_delegate_command present,
  prompt-only, task_classification declared).
- `CHANGELOG.md`: `unleash-build-test-fix-loop` entry under
  Changed.
- Documentation: unbound-force/unbound-force#819 (repo
  companion) and unbound-force/website#322 (cross-repo
  tracking) per the AGENTS.md documentation gate and the
  constitution Cross-Repo Documentation rule.
- Content coverage: blog assessed — no (a behavior
  enhancement below the content-pipeline thresholds); tutorial
  assessed — no (no new manual workflow; the vocabulary is
  tracked by website#322).
- Retroactive note: implementation landed on PR #815 ahead
  of these artifacts; this change records the planning
  decision retroactively before merge, per review feedback
  (guard, item 2).

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The loop removes a synchronous human halt at deterministic
failure points. Every decision (classification, iteration
count, supersession) is recorded in durable checkpoint
state.

### II. Composability First

**Assessment**: PASS

Repair reuses the existing delegation contract
(`uf_delegate_command` prompt-only with
`task_classification`) rather than a new tool; gate exits
reuse the existing `format_unleash_exit` variants.

### III. Observable Quality

**Assessment**: PASS

Classification, iteration count, and verdict are recorded
in checkpoint state; the CHANGELOG entry describes the
behavior; scaffold pins pin the wiring in both the command
and its mirror.

### IV. Testability

**Assessment**: PASS

Scaffold pin tests cover each gate's wiring phrase
distinctly, the durable-budget wiring, and the delegation
call shape, in both canonical and mirrored assets.

### V. Security by Default

**Assessment**: PASS

The loop only runs classified deterministic commands
(exact pre-flight re-runs); delegated repair runs through
the existing uf_delegate_command contract with the
deterministic/judgment classification recorded per call.

### VI. Deterministic Execution

**Assessment**: PASS

The fix work is classified deterministic and bound through
uf_delegate_command's task_classification contract
(DE-008); the re-run is the exact detected pre-flight
command set in the calling gate's mode.
