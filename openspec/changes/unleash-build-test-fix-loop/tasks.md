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
  count in the calling gate's checkpoint data (phase
  checkpoint `iteration` field; quick gate
  `data.iteration`), increment after each delegated
  attempt, read back on resume; budget is 3 total across
  sessions. Files: `.opencode/commands/uf.unleash.md`
- [x] 1.4 Mirror the command byte-identical to the scaffold
  asset (TC-007). File:
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`

## 2. Scaffold Pins

- [x] 2.1 Pin per-gate wiring with one distinct phrase per
  wiring site: quick gate "build/test fix loop (defined
  below the", phase checkpoint "build/test fix loop
  (above)", Step 6 "build/test fix loop (defined in Step
  5)". File: `internal/scaffold/scaffold_test.go`
- [x] 2.2 Pin the durable iteration budget wiring
  ("iteration: [fix-loop iterations", "total across
  sessions"). File: `internal/scaffold/scaffold_test.go`
- [x] 2.3 Pin the fix-loop delegation shape in a dedicated
  span (uf_delegate_command present, "prompt:" present,
  "task_classification:" present, "command_path:" absent,
  "via the Task tool" absent). File:
  `internal/scaffold/scaffold_test.go`
- [x] 2.4 Scope the per-task delegation `command_path:`
  negative to its own subsection span so prose token
  mentions cannot trip it. File:
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
