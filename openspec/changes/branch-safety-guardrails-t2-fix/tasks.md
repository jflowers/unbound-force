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

## 1. Add branch safety pre-conditions to agent/skill files

Each task modifies a different file and has no ordering
dependency on the others.

- [x] 1.1 [P] Add Pre-conditions section to `.opencode/agents/cobalt-crush-dev.md` — insert a "### Pre-conditions" subsection immediately before the "## Code Implementation Checklist" heading (line 50). Content MUST instruct the agent to: (a) run `git status --short` before any branch switch, (b) STOP and ask for confirmation if uncommitted changes exist, (c) never silently switch branches with a dirty working tree. Reference the same guardrail language used in the other two files for consistency.

- [x] 1.2 [P] Move branch safety rule in `.opencode/skills/openspec-apply-change/SKILL.md` — add a "**Pre-condition**" block after the "**Steps**" heading (line 16) and before Step 1 (line 18). Content: "Before any step, verify: NEVER switch branches or suggest archiving with uncommitted changes. Run `git status --short` if branch state is uncertain." Then remove the duplicate rule from the Guardrails bullet at line 212 ("NEVER switch branches or suggest archiving with uncommitted changes...").

- [x] 1.3 [P] Move Branch Safety section in `.opencode/skills/speckit-workflow/SKILL.md` — add a "## Pre-conditions" section before "## Reading tasks.md" (line 30). Move the content from the current "## Branch Safety" section (lines 114-128) into this new section. Then remove the original "## Branch Safety" section (lines 114-128) entirely.

## 2. Verification

- [x] 2.1 Verify each modified file reads coherently — review the three files to ensure heading hierarchy is correct, no duplicate constraints exist, and pre-conditions appear before all workflow instructions. Concrete checks: `grep -c "NEVER switch branches" .opencode/skills/openspec-apply-change/SKILL.md` returns `1` (not `2`); `grep -c "## Branch Safety" .opencode/skills/speckit-workflow/SKILL.md` returns `0` (section removed); `grep -n "### Pre-conditions" .opencode/agents/cobalt-crush-dev.md` returns a line number before the "## Code Implementation Checklist" heading.

- [x] 2.2 Verify constitution alignment — confirm changes are text-only (no Go source, CI, or schema modifications) and align with Security by Default (PASS) as documented in the proposal.

<!-- spec-review: passed -->
<!-- code-review: passed -->
