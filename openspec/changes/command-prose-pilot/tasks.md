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

## 1. Baseline Metrics

- [x] 1.1 Capture baseline static metrics for
  `.opencode/commands/uf.run-pipeline-plan.md` and record
  them in
  `openspec/changes/command-prose-pilot/metrics.md`:
  line count, word count, procedural sentences over 20
  words, ban-list tokens (`abort`, `halt`, `terminate`,
  `terminalize`, `bail`), bare-number references, and
  maximum nesting depth. Metrics MUST be captured before
  any rewrite (DE-004 requires before/after deltas).

## 2. Command Rewrite

- [x] 2.1 Rewrite `.opencode/commands/uf.run-pipeline-plan.md`
  to conform to the house standard in `design.md`
  (decisions D2-D12): canonical control verbs only,
  reference by name, single numbering axis, sentences at
  most 20 words in Instructions sections, one action per
  numbered step, decision tables for three-or-more-outcome
  branches, the Action/On failure/Next step template, and
  the three documented corrections (cross-command step
  reference, Gate Relay RELAY verb, session-resume guard
  precondition). The behavioral contract MUST be
  preserved per the `run-pipeline-plan` spec: frontmatter
  description, scaffold marker comment, `<protect>`
  boundaries, three-subagent pipeline, gate relay
  semantics, guardrails, tracking rules.
- [x] 2.2 Sync the rewrite byte-identically to
  `internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
  and VERIFY with
  `cmp .opencode/commands/uf.run-pipeline-plan.md internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`.

## 3. Conformance Validation

- [x] 3.1 [P] Run the rg conformance checks and record
  results in `metrics.md`: ban-list scan
  `rg -in '\b(abort|halt|terminate|terminalize|bail)\b' .opencode/commands/uf.run-pipeline-plan.md`
  (MUST return no matches), stale reference scan
  `rg -n 'Step 8' .opencode/commands/uf.run-pipeline-plan.md`
  (MUST return no matches), and Gate Relay verb scan
  (STOP MUST NOT appear in the Gate Relay Protocol).
- [x] 3.2 Run `make check` (lint, tests including
  `TestEmbeddedAssets_MatchSource`, build, coverage
  gates, plugin tests) and record the outcome in
  `metrics.md`.
- [x] 3.3 Capture after metrics for the rewritten file,
  append the before/after table to `metrics.md`, and
  confirm every metric moved in the intended direction
  or state why it did not.

## 4. Comprehension A/B

- [x] 4.1 Build the gold answer key from the behavioral
  contract scenarios in the `run-pipeline-plan` spec:
  the two fixed test scenarios are (a) a plan file
  containing an `[INVESTIGATION]` item and (b) a
  mid-gate interruption during work-item execution.
  Record the key in `metrics.md`.
- [x] 4.2 Run the A/B comparison: three to five fresh
  sessions per version (pre-rewrite and post-rewrite
  command text), same fixed scenarios, scored against
  the gold key. Record per-session scores and the
  aggregate in `metrics.md`. Directional evidence is
  sufficient at this sample size.

## 5. Documentation and Closure

- [x] 5.1 [P] Add the `CHANGELOG.md` entry for the
  pilot rewrite under the repo's existing format.
- [x] 5.2 [P] File the documentation issue required by
  the AGENTS.md documentation gate (command instruction
  text changed; behavioral contract preserved). Record
  the issue number in `metrics.md`.
- [x] 5.3 VERIFY constitution alignment: re-assess the
  completed change against the six constitution
  principles and the claims made in `proposal.md`;
  record the assessment in `metrics.md`. Confirm no
  gate, threshold, CI flag, or pinned dependency was
  touched (gatekeeping rule).
