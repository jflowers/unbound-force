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

## 1. Schema and constant changes in review-dispatch plugin

All tasks in this group modify
`.opencode/plugins/review-dispatch/index.ts`.
No parallel execution — single file.

- [ ] 1.1 Add `TRIAGE_CONFINEMENT_RULE` static constant
  (FR-110, FR-111, FR-112). Place after existing
  `CONFINEMENT_RULE`. Confine agent to issue content and
  repo context. No diff references.

- [ ] 1.2 Add `TRIAGE_PROHIBITIONS` static constant
  (FR-130, FR-131, FR-132). Place after existing
  `PROHIBITIONS`. Remove diff-specific language. Add
  prohibition on creating child issues or PRs.

- [ ] 1.3 Add `TRIAGE_RESPONSE_CONTRACT` static constant
  (FR-120, FR-121, FR-122, FR-123). Place after existing
  `RESPONSE_CONTRACT`. Require VALID / INVALID /
  NEEDS-CLARIFICATION verdicts with category, objectivity,
  reasoning, split_recommendation fields. Include
  `submit_lesson_proposal` call and `**Model**` self-report.

- [ ] 1.4 Add `"issue_content"` to `UNTRUSTED_SECTION_NAMES`
  array (FR-103).

- [ ] 1.5 Update `BuildReviewPromptsInputSchema`: make
  `diff_path` and `changed_files` optional
  (`z.string().min(1).optional()`); add
  `issue_content: z.string().optional()` (FR-100, FR-150).

- [ ] 1.6 Add superRefine to `BuildReviewPromptsInputSchema`
  enforcing mode-dependent field requirements (FR-101,
  FR-102, FR-151, FR-152, FR-153, FR-154):
  - `mode !== "triage"`: require `diff_path` and
    `changed_files`; reject `issue_content`
  - `mode === "triage"`: require `issue_content`; reject
    `diff_path` and `changed_files`

- [ ] 1.7 Update `DispatchReviewRunsInputSchema`: same field
  changes as 1.5 — make `diff_path` and `changed_files`
  optional; add `issue_content: z.string().optional()`.

- [ ] 1.8 Add superRefine to `DispatchReviewRunsInputSchema`
  with same mode-dependent logic as 1.6.

- [ ] 1.9 Update `buildReviewPrompts` function: add
  `isTriageMode` branch (FR-140, FR-141, FR-142):
  - Skip `validateDiffPath()` and `readFile(diff_path)` when
    triage
  - Section 3: triage → `## Issue Content` from
    `args.issue_content`; else → `## Diff`
  - Section 4: triage → `## Input Context`; else →
    `## Changed Files and Input Context`
  - Section 9: triage → `TRIAGE_CONFINEMENT_RULE`; else →
    `CONFINEMENT_RULE`
  - Section 10: triage → `TRIAGE_PROHIBITIONS`; else →
    `PROHIBITIONS`
  - Section 11: triage → `TRIAGE_RESPONSE_CONTRACT`; else →
    `RESPONSE_CONTRACT`

- [ ] 1.10 Update `dispatch_review_runs` execute function:
  forward `issue_content: input.issue_content` to
  `buildReviewPrompts` call (FR-160).

## 2. Command file update

- [ ] 2.1 [P] Update `.opencode/commands/uf.triage-issue.md`
  Phase 2.3 (FR-170, FR-171): rewrite the
  `dispatch_review_runs` call block to:
  - Explicitly state `diff_path` and `changed_files` MUST
    be omitted
  - Add `issue_content` parameter: instruct agent to
    serialize the Phase 1 planner object (title, body,
    comments, labels, state, author_association) as a JSON
    string
  - Keep `review_context` for repo context and duplicate
    candidates only

## 3. Tests

- [ ] 3.1 [P] Add triage-mode tests to
  `.opencode/test/build-review-prompts.test.ts`:
  - Triage produces `## Issue Content` section (not
    `## Diff`) — FR-140, FR-141
  - Triage uses TRIAGE_RESPONSE_CONTRACT keywords
    (VALID/INVALID/NEEDS-CLARIFICATION) — FR-120, FR-121
  - Triage uses TRIAGE_CONFINEMENT_RULE (no "diff"
    references) — FR-110, FR-111
  - Triage rejects absent `issue_content` — FR-101
  - Triage rejects present `diff_path` — FR-152
  - Code review rejects absent `diff_path` — FR-151
  - Code review rejects present `issue_content` — FR-102
  - Code review backward compatibility (existing tests
    still pass)

- [ ] 3.2 [P] Add triage-mode tests to
  `.opencode/test/dispatch-review-runs.test.ts`:
  - Triage dispatch succeeds with `issue_content`, no
    `diff_path`/`changed_files`
  - Triage dispatch rejects when `diff_path` provided

## 4. Scaffold sync and verification

- [ ] 4.1 Sync canonical
  `.opencode/plugins/review-dispatch/index.ts` to
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`

- [ ] 4.2 Sync canonical
  `.opencode/commands/uf.triage-issue.md` to
  `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`

- [ ] 4.3 Run `make plugin-test` — all tests pass

- [ ] 4.4 Run `make check` — full CI parity

- [ ] 4.5 Verify constitution alignment: Autonomous
  Collaboration (prompts self-contained), Composability
  (single tool serves both modes), Observable Quality
  (triage verdicts machine-parseable), Testability (all
  paths unit-tested)
