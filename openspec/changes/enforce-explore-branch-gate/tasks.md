<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Replace advisory guardrail with enforced gate

- [x] 1.1 In `.opencode/skills/openspec-explore/SKILL.md`, replace the
  advisory bullet at line 330 ("Don't switch branches without
  confirmation...") with a structured confirmation gate subsection.
  The replacement MUST include:
  - A "Branch Creation Gate" heading or equivalent within Guardrails
  - Branch state check (already on target branch: skip; on different
    `opsx/*` branch: stop with error; on `main`/non-opsx: proceed)
  - Explicit instruction to include the proposed branch name in the
    **AskUserQuestion** prompt text
  - Instruction to run `git status --short` and warn about uncommitted
    changes if any exist, showing what changes exist
  - An **AskUserQuestion** call with options "Create branch and proceed"
    and "Stay in explore mode"
  - Explicit statement that branch creation MUST NOT proceed without
    user confirmation
  - Clear statement that this applies to both direct `git checkout -b`
    and transitions via `/opsx-propose`
  - Note that the `/opsx-propose` skill's own branch guard applies
    independently after the transition

  **Checkpoint**: Read the modified SKILL.md Guardrails section
  end-to-end. Verify the advisory bullet has been replaced with a
  structured gate subsection containing numbered steps.

## 2. Verification

- [x] 2.1 Verify the updated SKILL.md contains the literal string
  `AskUserQuestion` within a numbered step in the Guardrails section
  (not a dash-prefixed advisory bullet). PASS if `AskUserQuestion`
  appears in a numbered step; FAIL if it only appears in advisory prose.
- [x] 2.2 Verify the gate covers both code paths: the text MUST
  mention both `git checkout -b` and `/opsx-propose` (or equivalent
  references). PASS if both strings appear in the gate section.
- [x] 2.3 Verify dirty working tree check is included: the text MUST
  include `git status --short` or equivalent dirty-tree check
  instruction. PASS if the command reference is present.
- [x] 2.4 Verify branch state checks are included: the text MUST handle
  three branch states (already on target branch, on different `opsx/*`
  branch, on `main`/non-opsx). PASS if all three cases are addressed.
- [x] 2.5 Verify the gate structure mirrors `openspec-propose/SKILL.md`
  Step 3 pattern (dirty tree check, branch state check, confirmation).
  PASS if the structural elements align.
- [x] 2.6 Verify constitution alignment: confirm the implemented gate
  text aligns with the constitution assessments in proposal.md
  (Principle IV: structurally verifiable; Principle V: explicit
  authorization before irreversible action).
<!-- spec-review: passed -->
<!-- code-review: passed -->
