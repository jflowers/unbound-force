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

## 1. Critical Priority Commands

- [x] 1.1 [P] Add `<protect>` tags to `uf.unleash.md`
  - Wrap: SESSION-RESUME GUARD, EXECUTION CHECKLIST,
    Step 2 Resumability Detection, Step 10 Demo output
    fidelity guard, Guardrails section.
  - File: `internal/scaffold/assets/opencode/commands/uf.unleash.md`

- [x] 1.2 [P] Add `<protect>` tags to `uf.review-pr.md`
  - Wrap: Execution Mode Check, session-resume guard
    (before posting), Step E.4 Token Budget, Step F
    deduplication logic, all MANDATORY GATE sections,
    Step 7a-7g GitHub Review Posting gates.
  - File: `internal/scaffold/assets/opencode/commands/uf.review-pr.md`

- [x] 1.3 [P] Add `<protect>` tags to `uf.review-council.md`
  - Wrap: SESSION-RESUME GUARD, EXECUTION CHECKLIST,
    Phase 1a-1c pre-flight checks, CRITICAL branch diff
    rule (Step 2), Step 7f Verdict Mapping with
    MANDATORY GATE and session-resume guard.
  - File: `internal/scaffold/assets/opencode/commands/uf.review-council.md`

- [x] 1.4 [P] Add `<protect>` tags to `uf.finale.md`
  - Wrap: SESSION-RESUME GUARD, EXECUTION CHECKLIST,
    Step 2 secret file MANDATORY GATE, Step 3 commit
    attribution model extraction, Step 5 PR creation
    MANDATORY GATEs, Guardrails section, Branch Safety.
  - File: `internal/scaffold/assets/opencode/commands/uf.finale.md`

## 2. High Priority Commands

- [x] 2.1 [P] Add `<protect>` tags to `uf.address-feedback.md`
  - Wrap: SESSION-RESUME GUARD, EXECUTION CHECKLIST,
    Phase 1.6 cache authority check, Phase 3 triage
    decision enforcement, Phase 4.3 review-council gate,
    Phase 4.5 checklist gate, Guardrails section.
  - File: `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`

- [x] 2.2 [P] Add `<protect>` tags to `uf.triage-issue.md`
  - Wrap: argument validation, Phase 1.2 re-run
    detection, Phase 3.1 verdict resolution rules,
    Phase 4.2 label application dual-path logic,
    Phase 4.3 comment confirmation gate, Phase 4.4
    child issue creation gate, Guardrails section.
  - File: `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`

## 3. Design Correction — Single-Wrap

The original design (3-8 selective sections per file) was
incorrect. Command files are orchestration pipelines where
every section is execution-critical. Partial protection
leaves pipeline steps, branching logic, and checkpoint
markers vulnerable to DCP compression.

Corrected approach: one `<protect>` tag per file wrapping
the entire instruction body. Only the informational header
(description, usage) is left outside.

- [x] 3.1 Remove all inner `<protect>` tags from all 6 files
- [x] 3.2 [P] Add single outer `<protect>` wrap to `uf.unleash.md`
- [x] 3.3 [P] Add single outer `<protect>` wrap to `uf.review-pr.md`
- [x] 3.4 [P] Add single outer `<protect>` wrap to `uf.review-council.md`
- [x] 3.5 [P] Add single outer `<protect>` wrap to `uf.finale.md`
- [x] 3.6 [P] Add single outer `<protect>` wrap to `uf.address-feedback.md`
- [x] 3.7 [P] Add single outer `<protect>` wrap to `uf.triage-issue.md`
- [x] 3.8 Sync `.opencode/commands/` copies

## 4. Verification

- [x] 4.1 Run `make build` to verify Go embed compiles.
- [x] 4.2 Run `make test` to verify scaffold drift tests
  pass with the modified templates.
- [x] 4.3 Verify exactly 1 `<protect>` open/close pair
  per file (single-wrap).
