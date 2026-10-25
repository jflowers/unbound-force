## Context

`/uf.unleash` has three blocking build/test gates: the
quick tier's pre-flight hard gate, the per-phase
checkpoint (implement-phase-[N]), and Step 6's pre-flight
soft gate. Before this change, each halted the pipeline on
the first failing check and exited through its
`format_unleash_exit` variant. The phase checkpoint already
carried a causality classification contract (verdict green
over pre-existing/environmental failures, inventory of
classified failures); the quick gate had no classification
step; no gate attempted repair.

## Goals / Non-Goals

Goals:

- Deterministic build/test failures self-repair through the
  existing delegation contract instead of halting for a
  human.
- Causality filtering: only failures plausibly caused by
  the change enter the loop.
- The 3-iteration budget survives session resumes
  (durable, not conversation-scoped).
- Existing exit paths and their semantics remain unchanged
  once the budget is exhausted.

Non-Goals:

- Human-consent gates for delegated repair (the delegation
  contract's own guardrails govern).
- Repairing pre-existing or environmental failures (they
  never enter the loop).
- New exit variants or changes to Step 6's soft-gate
  semantics beyond loop entry.

## Decisions

### D1: Loop entry filters by causality, not raw failure

Every failing check is classified before action. Only
`change-caused` or unknown-origin failures enter the loop.
Pre-existing and environmental failures are recorded in the
checkpoint inventory and treated as green. Rationale: a
resume that re-enters a loop to "fix" a pre-existing
failure would burn the delegated budget on work the change
did not cause — and would launder unrelated edits as gate
repairs.

### D2: The quick gate carries its own classification wiring

The quick-tier pre-flight hard gate runs before any phase
checkpoint exists, so it cannot inherit the phase
checkpoint's classification rule by reference. The gate
entry text wires the classification contract directly and
its `quick-pre-flight` checkpoint record gains
`data.fixLoopQuick` and `data.inventory` fields mirroring the
phase checkpoint's.

### D3: The iteration budget is durable checkpoint state

The count lives in the calling gate's checkpoint data as a
gate-distinct free-form `data` key — the phase checkpoint's
`data.fixLoopPhase[N]` key, the quick gate's
`data.fixLoopQuick`, or Step 6's `data.fixLoopPreflight` —
following the precedent of the two
pre-existing bounded loops (Step 4 spec-review decision
gate and Step 6 code-review fix loop both checkpoint
their counters). The keys ride the free-form `data`
parameter because the checkpoint tool persists only
`number`, `verdict`, and `inventory` from the structured
`phase` object; top-level distinct keys avoid the
state-global `data` merge colliding across gates. A
resumed session reads the spent budget and
continues toward the same 3-total cap rather than
resetting. Conversation-scoped counters were rejected: the
resume guard re-enters the loop on a recorded `"failed"`
verdict, which would grant 3 more attempts per resume.

### D4: Delegation is prompt-only with per-call classification

The fix delegation goes through `uf_delegate_command`
prompt-only (no `command_path`, no `checkpoint_step` — the
calling gate's checkpoint remains the durable record) with
`task_classification` declared per call, per determinism
pack DE-008. The re-run executes the exact detected
pre-flight commands in the calling gate's mode.

### D5: Green supersession, unchanged exits

A phase checkpoint whose loop succeeds re-records verdict
`"green"`, superseding the `"failed"` record with the
inventory and the gate's data key carrying forward. Exhaustion
takes the gate's existing exit path unchanged. Rationale:
the exit variants, guardrails list, and downstream
consumers (resume detection, finale) keep their contracts.

### D6: Per-site pin phrases in the scaffold test

The command text carries distinct wiring phrases per call
site — "build/test fix loop (defined below the" (quick
gate), "build/test fix loop (above)" (phase checkpoint),
"build/test fix loop (defined in Step 5)" (Step 6) — and
the scaffold pins assert each phrase within its consuming
span, so deleting any one wiring site fails the suite. The
fix-loop delegation shape gets a dedicated span pin
(between "**Build/test fix loop**" and "**For each phase in
tasks.md**"), and the per-task delegation's
`command_path:` negative is scoped to its own subsection
span so prose mentions of the token elsewhere cannot trip
it.

## Risks / Trade-offs

- **Delegated repair quality**: the loop trusts
  cobalt-crush-dev to repair deterministic failures. The
  budget (3 total) and causality filter bound the blast
  radius; exhaustion exits as before.
- **Classification accuracy at the quick gate**: the gate
  classifies before any phase inventory exists;
  misclassification routes an environmental failure into
  the loop, which burns budget but cannot weaken any gate —
  exhaustion still exits.
- **Retroactive artifacts**: the implementation landed on
  PR #815 before this change record existed (review
  feedback, guard item 2). The artifacts document the
  design as implemented; divergence between the two is
  reviewed in the PR.
- **Ratchet**: the plugin-suite coverage floor is
  governance-controlled and untouched by this change; the
  new pins live in the Go scaffold test suite.

## Migration Plan

None — pure command-template and scaffold-test change; the
scaffold mirror ships byte-identical (TC-007), and sibling
repos pick it up on their next release re-scaffold.

## Open Questions

(none)
