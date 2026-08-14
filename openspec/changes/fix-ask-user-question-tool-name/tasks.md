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

## 1. Commands — source files (.opencode/commands/)

Replace all `AskUserQuestion` references with `question`
in each command file. Preserve surrounding formatting and
gate logic.

- [x] 1.1 [P] `.opencode/commands/uf.review-pr.md` (13 occurrences)
- [x] 1.2 [P] `.opencode/commands/uf.triage-issue.md` (9 occurrences)
- [x] 1.3 [P] `.opencode/commands/uf.address-feedback.md` (8 occurrences)
- [x] 1.4 [P] `.opencode/commands/speckit.clarify.md` (8 occurrences)
- [x] 1.5 [P] `.opencode/commands/uf.finale.md` (6 occurrences)
- [x] 1.6 [P] `.opencode/commands/uf.review-council.md` (5 occurrences)
- [x] 1.7 [P] `.opencode/commands/speckit.implement.md` (4 occurrences)
- [x] 1.8 [P] `.opencode/commands/opsx-propose.md` (3 occurrences)
- [x] 1.9 [P] `.opencode/commands/opsx-archive.md` (2 occurrences)
- [x] 1.10 [P] `.opencode/commands/opsx-apply.md` (1 occurrence)
- [x] 1.11 [P] `.opencode/commands/speckit.specify.md` (1 occurrence)
- [x] 1.12 [P] `.opencode/commands/muti-mind.sync-push.md` (1 occurrence)

**Checkpoint**: `rg -c "AskUserQuestion" .opencode/commands/`
returns no results.

## 2. Agent files (.opencode/agents/)

- [x] 2.1 [P] `.opencode/agents/muti-mind-po.md` (1 occurrence)

**Checkpoint**: `rg -c "AskUserQuestion" .opencode/agents/`
returns no results.

## 3. Skill files (.opencode/skills/)

- [x] 3.1 [P] `.opencode/skills/openspec-archive-change/SKILL.md` (5 occurrences)
- [x] 3.2 [P] `.opencode/skills/openspec-propose/SKILL.md` (3 occurrences)
- [x] 3.3 [P] `.opencode/skills/openspec-apply-change/SKILL.md` (1 occurrence)
- [x] 3.4 [P] `.opencode/skills/openspec-explore/SKILL.md` (1 occurrence)
- [x] 3.5 [P] `.opencode/skills/speckit-workflow/SKILL.md` (1 occurrence)

**Checkpoint**: `rg -c "AskUserQuestion" .opencode/skills/`
returns no results.

## 4. Scaffold assets (internal/scaffold/assets/opencode/)

Update the embedded scaffold copies in lockstep with their
`.opencode/` source counterparts. These files MUST match
their source exactly to pass drift detection tests.

- [x] 4.1 [P] `internal/scaffold/assets/opencode/commands/uf.review-pr.md` (13 occurrences)
- [x] 4.2 [P] `internal/scaffold/assets/opencode/commands/uf.triage-issue.md` (9 occurrences)
- [x] 4.3 [P] `internal/scaffold/assets/opencode/commands/uf.address-feedback.md` (8 occurrences)
- [x] 4.4 [P] `internal/scaffold/assets/opencode/commands/uf.finale.md` (6 occurrences)
- [x] 4.5 [P] `internal/scaffold/assets/opencode/commands/uf.review-council.md` (5 occurrences)
- [x] 4.6 [P] `internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md` (1 occurrence)

**Checkpoint**: `rg -c "AskUserQuestion" internal/scaffold/assets/opencode/`
returns no results.

## 5. Verification

- [x] 5.1 Run `rg -c "AskUserQuestion" .opencode/ internal/scaffold/assets/opencode/` — MUST return no results
- [x] 5.2 Run drift detection tests: `go test ./internal/scaffold/... -run TestEmbeddedAssets_MatchSource -race -count=1`
- [x] 5.3 Run full test suite: `make test`
- [x] 5.4 Verify constitution alignment: Testability principle PASS confirmed — drift detection parity maintained
<!-- spec-review: passed -->
<!-- implement: done -->
<!-- code-review: passed -->
