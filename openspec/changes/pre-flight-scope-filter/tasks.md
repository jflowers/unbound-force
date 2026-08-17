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

  spec-review: passed
  reviewers: 9/9 APPROVE
  auto-fixes: applied (5 MEDIUM, 6 LOW consolidated)
-->

## 1. Add Scope Filter to Pre-flight Skill

- [ ] 1.1 Add Phase 2b (Scope Filter) to
  `.opencode/skills/pre-flight/SKILL.md` between Phase 2
  (Local Tool Detection) and Phase 3 (CI Coverage Matrix).
  Phase 2b MUST:
  - Compute branch diff via `git diff --name-only main...HEAD`
  - Include the tool-to-extension mapping table (D2)
  - Mark always-run tools (`make check`, `pre-commit`)
  - Intersect diff file extensions with each tool's scope
  - Mark tools with zero matches as "Skipped (no in-scope
    files)"
  - Log the diff file list and per-tool scope decision
  - Fail open (all tools in-scope) if `git diff` fails
  Implements: FR-001, FR-002, FR-003, FR-004

- [ ] 1.2 Update Phase 3 (CI Coverage Matrix) hard-gate
  decision rules to reflect scope-filtered tools. Change
  "ALL detected and available tools are marked 'Run locally
  = Yes'" to "ALL detected, available, and in-scope tools
  are marked 'Run locally = Yes'". Add "No (no in-scope
  files)" as a possible value in the "Run locally?" column.
  Implements: FR-006, FR-007

- [ ] 1.3 Update Phase 4 (Execution) and Phase 5 (Result Format)
  for scope-filtered tools. Scope-skipped tools count as PASS
  for verdict computation. In the execution results table,
  they appear with exit code "-" and status "SKIP (scope)".
  Phase 4 skips the tool; Phase 5 includes it in the table
  with the display status.
  Implements: FR-005

## 2. Scaffold Sync

- [ ] 2.1 Sync `.opencode/skills/pre-flight/SKILL.md` to
  `internal/scaffold/assets/opencode/skills/pre-flight/SKILL.md`
  Implements: FR-008

## 3. Verification

- [ ] 3.1 Run `make check` to verify build, lint, and tests
  pass (CI parity gate)

- [ ] 3.2 Run drift detection tests to confirm scaffold copy
  matches skill source

- [ ] 3.3 Behavioral verification: confirm the updated skill
  instructions include: (1) Phase 2b section between Phase 2
  and Phase 3, (2) tool-to-extension mapping table matching
  FR-002, (3) always-run tool list per FR-003, (4) fail-open
  behavior per FR-001 scenario 3, (5) both hard-gate and
  ci-aware decision rules reference scope-filtered tools
  per FR-007

- [ ] 3.4 Documentation assessment: check whether AGENTS.md
  skill description needs updating for the new scope filter
  capability; assess CHANGELOG.md for a change entry
