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

## 1. Migrate uf.address-feedback.md Phase 4.2

- [x] 1.1 In `.opencode/commands/uf.address-feedback.md`,
  replace the Phase 4.2 inline 6-step model normalization
  prose (the block starting "Where `<model>` is the model
  family name you are currently running as. To resolve the
  model name:" and ending "attribution").") with the
  `normalize_model_name` tool call instruction from design
  D2: call the tool with the raw model identifier from the
  system prompt, use the returned `normalized` value for the
  `Assisted-by: <model>` trailer, and warn the user on
  error or `unknown-model` (preserve the existing warning
  example text verbatim). Do not modify the commit message
  template above the block.
- [x] 1.2 Copy the live command over the scaffold asset:
  `cp .opencode/commands/uf.address-feedback.md
  internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
  (design D3 — byte-identical parity).

## 2. Documentation

- [x] 2.1 [P] Add a `CHANGELOG.md` entry for this change
  under the next unreleased version, referencing #709.

## 3. Verification

- [x] 3.1 Verify scaffold/live parity: `diff` the two
  command copies — output MUST be empty.
- [x] 3.2 Verify no inline algorithm remains: search both
  command copies for the normalization prose markers
  (`YYYYMMDD`, "remove everything before") — no matches
  outside the delta spec/design artifacts.
- [x] 3.3 Run `make check` — lint, Go tests, build,
  coverage gate, and TypeScript plugin tests must pass.
- [x] 3.4 Verify constitution alignment (proposal
  §Constitution Alignment): Principle VI — the mechanical
  6-step procedure now executes in the tested
  `normalize_model_name` tool, and the warn-the-user
  decision point remains in instruction prose. Confirm no
  quality/governance gate values were touched.
