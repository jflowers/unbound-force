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

## 1. Add Mandatory Gates to Command Files

Each task adds `>>> MANDATORY GATE <<<` markers with
session-resume guard to one command file. Tasks are
parallel-eligible because each modifies a different file.

- [x] 1.1 [P] Add Phase 4 entry gate to
  `.opencode/commands/uf.address-feedback.md` (FR-001)

  Insert gate block between the Phase 4 heading and
  sub-step 4.1. Gate summarizes queued actions (code
  changes, commits, push, reply comments, thread
  resolutions) and uses question tool with
  `["Proceed with Phase 4 execution",
  "Review plan again", "Abort -- stop here"]`.
  Include session-resume guard.

- [x] 1.2 [P] Add fix-branch commit gate to
  `.opencode/commands/uf.review-pr.md` (FR-002)

  Insert gate block before `git commit` in Step 6,
  sub-step 6. Gate shows `git diff --cached --stat`
  output and proposed commit message. Uses question
  tool with `["Commit -- apply fix",
  "Edit commit message", "Abort -- discard changes"]`.
  Include session-resume guard.

- [x] 1.3 [P] Add spec file edit gate to
  `.opencode/commands/uf.review-council.md` (FR-003)

  Insert gate block before the auto-fix loop (item 3
  in the Spec Review Mode section). Gate lists
  LOW/MEDIUM findings to be auto-fixed with counts
  and categories. Uses question tool with
  `["Apply auto-fixes", "Review findings first",
  "Skip auto-fixes -- report only"]`.
  Include session-resume guard.

- [x] 1.4 [P] Add commit and push gates to
  `.opencode/commands/uf.finale.md` (FR-004, FR-005)

  Step 3: Wrap existing commit message confirmation
  (lines ~194-212) in `>>> MANDATORY GATE <<<` markers.
  Add session-resume guard before the proposed commit
  message display.

  Step 4: Wrap existing push confirmation (lines ~237-247)
  in `>>> MANDATORY GATE <<<` markers. Add session-resume
  guard referencing the push target branch.

  Note: Steps 2, 5, 6, and 6b already have correct gates
  — do NOT modify them (FR-006).

## 2. Sync Scaffolded Copies

Each task copies the updated command file to its
canonical location in the scaffold assets. Tasks are
parallel-eligible because each modifies a different file.

- [x] 2.1 [P] Sync `uf.address-feedback.md` to
  `internal/scaffold/assets/opencode/commands/`

- [x] 2.2 [P] Sync `uf.review-pr.md` to
  `internal/scaffold/assets/opencode/commands/`

- [x] 2.3 [P] Sync `uf.review-council.md` to
  `internal/scaffold/assets/opencode/commands/`

- [x] 2.4 [P] Sync `uf.finale.md` to
  `internal/scaffold/assets/opencode/commands/`

## 3. Verification

- [x] 3.1 Run drift detection tests to verify scaffolded
  copies match command files:
  `go test -race -count=1 ./internal/scaffold/...`

- [x] 3.2 Run full test suite: `make test`

- [x] 3.3 Verify constitution alignment: confirm that
  each new gate specifies a question tool invocation
  (Principle III: observable confirmation events) and
  that no mutation entry point identified in issue #474
  remains unguarded (Principle V: least-privilege).
  No impact on Principles I, II, or IV.

- [x] 3.4 Verify existing gates remain unchanged:
  confirm that gates in uf.review-council.md Step 7f,
  uf.review-pr.md review posting, and uf.finale.md
  Steps 2, 5, 6, 6b are byte-identical to their
  pre-change state (FR-006).

- [x] 3.5 Verify gate structure: for each of the 4 command
  files, confirm every new gate contains all 4 required
  elements: (1) `>>> MANDATORY GATE: HUMAN CONFIRMATION
  REQUIRED <<<` opening marker, (2) session-resume guard
  text, (3) question tool invocation with explicit options,
  (4) `>>> END MANDATORY GATE <<<` closing marker. Compare
  against the gold standard in uf.review-council.md Step 7f.

- [x] 3.6 Verify expected gate counts per file:
  `grep -c ">>> MANDATORY GATE" <file>` and confirm:
  - `uf.address-feedback.md`: 1 gate (was 0, now 1)
  - `uf.review-pr.md`: 2 gates (was 1, now 2)
  - `uf.review-council.md`: 2 gates (was 1, now 2)
  - `uf.finale.md`: 6 gates (was 4, now 6)

<!-- spec-review: passed -->
<!-- code-review: passed -->
