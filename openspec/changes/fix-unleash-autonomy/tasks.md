<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Add autonomy guardrail and checkpoint transitions

All tasks in this group modify the same file
(`uf.unleash.md`), so no tasks are parallel-eligible.

- [x] 1.1 Add the inter-step autonomy guardrail as the
  first rule in the Guardrails section of
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`.
  Use the established `**NEVER verb**` format:
  `**NEVER pause between steps for human confirmation**`
  followed by the enumerated valid exit points.

- [x] 1.2 Add explicit transition instructions after each
  checkpoint block for Steps 0-9 in
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`.
  Each transition instruction MUST follow the checkpoint's
  existing blockquote and state: "Proceed immediately to
  Step N+1. Do NOT ask for confirmation." Step 10's
  checkpoint already says "Pipeline complete" and does
  not need a transition instruction.
  Affected checkpoints (line numbers from current file):
  - Step 0 checkpoint (line 77)
  - Step 1 checkpoint (line 131)
  - Step 2 checkpoint (line 194)
  - Step 3 checkpoint (line 272)
  - Step 4 checkpoint (line 296)
  - Step 5 checkpoint (line 319)
  - Step 6 checkpoint (line 379)
  - Step 7 checkpoint (line 536)
  - Step 8 checkpoint (line 607)
  - Step 9 checkpoint (line 646)

## 2. Sync deployed copy

- [x] 2.1 Copy the updated scaffold asset to the deployed
  location: `.opencode/commands/uf.unleash.md`. Both files
  MUST be identical. Verify with `diff` after copying.

## 3. Verification

- [x] 3.1 Run `make check` to verify no build, test, or
  lint regressions.

- [x] 3.2 Verify content correctness: confirm the new
  guardrail exists in the Guardrails section, all 10
  checkpoint transitions (Steps 0-9) include explicit
  "proceed immediately" instructions, and Step 10's
  checkpoint does NOT include a transition instruction.

- [x] 3.3 Verify constitution alignment: confirm the
  change strengthens Principle I (Autonomous
  Collaboration) and does not introduce violations of
  Principles II-V (per proposal assessment).

<!-- spec-review: passed -->
<!-- code-review: passed -->
