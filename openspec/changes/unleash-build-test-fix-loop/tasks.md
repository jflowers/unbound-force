<!--
  [P] marks tasks eligible for parallel execution.
  Retroactive record: implementation landed on PR #815;
  tasks are checked off to match the implemented state,
  including the PR review-feedback fixes (round 2).
-->

## 1. Command Template

- [x] 1.1 Wire causality classification into the quick-tier
  pre-flight gate entry: classify every failure before
  acting; only change-caused or unknown-origin failures
  enter the fix loop; pre-existing and environmental
  failures are recorded in the checkpoint inventory and
  treated as green. File:
  `.opencode/commands/uf.unleash.md`
- [x] 1.2 Add the build/test fix loop block below the
  classification contract: prompt-only uf_delegate_command
  delegation template (task_classification declared per
  call), exact pre-flight re-run in the calling gate's
  mode, green supersession with inventory carrying forward,
  and the 3-iteration cap. Files:
  `.opencode/commands/uf.unleash.md`
- [x] 1.3 Make the iteration budget durable: record the
  count in the calling gate's checkpoint data as
  gate-distinct free-form `data` keys (phase checkpoint
  `data.fixLoopPhase[N]`; quick gate budget-only
  `quick-fix-budget` step `data.fixLoopQuick`; Step 6
  `data.fixLoopPreflight`), increment after each
  delegated attempt, read back on resume; budget is 3
  total across sessions; the quick gate's success-only
  `quick-pre-flight` step remains its only completion
  claim. Files:
  `.opencode/commands/uf.unleash.md`
- [x] 1.4 Mirror the command byte-identical to the scaffold
  asset (TC-007). File:
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`

## 2. Scaffold Pins

- [x] 2.1 Pin per-gate wiring with one distinct phrase per
  wiring site: quick gate "build/test fix loop (defined
  below the", phase checkpoint "build/test fix loop
  (above)", Step 6 "build/test fix loop (defined in Step
  5)". File: `internal/scaffold/scaffold_test.go`
- [x] 2.2 Pin the durable iteration budget wiring with
  per-site phrases ("iterations used, 0 if the",
  "iterations used so far", "never 3 more per resume",
  "read it back on resume", "3-attempt budget spans
  sessions") and the gate-distinct data keys and step
  ("quick-fix-budget", "ONLY completion",
  "fixLoopQuick", "fixLoopPhase[N]", "fixLoopPreflight");
  assert no "iteration:" field rides the structured
  phase object. File: `internal/scaffold/scaffold_test.go`
- [x] 2.3 Pin the fix-loop delegation shape in a dedicated
  span (uf_delegate_command present, "prompt:" present,
  "task_classification:" present, "command_path:" absent,
  "checkpoint_step:" absent, "via the Task tool" absent).
  File: `internal/scaffold/scaffold_test.go`
- [x] 2.4 Scope the per-task delegation `command_path:`
  negative to its own subsection span so prose token
  mentions cannot trip it. File:
  `internal/scaffold/scaffold_test.go`
- [x] 2.5 Pin the quick-tier whole-change delegation as
  prompt-only in its own span (uf_delegate_command and
  "prompt:" present, `checkpoint_step: "implement"`
  present, "command_path:" and "via the Task tool"
  absent). File: `internal/scaffold/scaffold_test.go`
- [x] 2.6 Pin the loop's exit half with site-unique
  phrases ("fail closed into the loop", "the phase
  checkpoint with verdict", "When the loop exhausts its
  3 iterations", "persist after 3 iterations" in the
  Step 6 span, "after the fix loop's" in a
  Guardrails-scoped span). File:
  `internal/scaffold/scaffold_test.go`

## 3. Docs

- [x] 3.1 CHANGELOG entry under Changed describing the
  loop, causality filter, and durable budget, referencing
  the docs issues. File: `CHANGELOG.md`
- [x] 3.2 File the cross-repo documentation tracking issue
  in unbound-force/website (unbound-force/website#322) and
  the repo companion docs issue
  (unbound-force/unbound-force#819) per the constitution
  Cross-Repo Documentation rule and the AGENTS.md
  documentation gate.

## 4. Verification

- [x] 4.1 `go test -race -count=1 ./internal/scaffold/` green
  (mirror drift + new pins).
