<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, and (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Shared Libs

- [ ] 1.1 [P] Extend `classifyBranch` with a `quick` branch
  type: `quick/<name>` → `branchType: "quick"`, `changeName:
  "<name>"`, `isMain: false`. Keep `main`/`master` behavior
  unchanged. File:
  `internal/scaffold/assets/opencode/lib/branch-classification.ts`
- [ ] 1.2 [P] Extend `WORKFLOW_TIERS` to
  `["speckit", "openspec", "quick"]`. Add quick branches to
  `specReviewRecoveryGuidance` and `demoRefinementOption` (quick
  skips spec refinement; offer a follow-up change). File:
  `internal/scaffold/assets/opencode/lib/unleash-templates.ts`

## 2. Route Decision Tool

- [ ] 2.1 Implement `uf_unleash_route_decision` in the
  uf-workflow plugin: params `{tier, change_name, rationale,
  description, issue_number?}`; tier MUST be in WORKFLOW_TIERS;
  records the decision via the checkpoint system; when tier is
  quick, creates and checks out `quick/<change_name>` via the
  injected git exec; returns JSON with tier, change_name,
  branch, rationale, issue_number. File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [ ] 2.2 [P] Tests: route decision recording, quick branch
  creation (injected GitExec assertions), rejection of invalid
  tiers, speckit/openspec do not create branches. File:
  `.opencode/test/unleash-route-decision.test.ts`

## 3. Gate and Resume Support

- [ ] 3.1 Extend `uf_unleash_branch_gate`: accept `quick/*` as
  tier `quick` with no artifact prerequisites. ON_MAIN,
  NO_TASKS, NO_SPEC, and UNRECOGNIZED_BRANCH envelopes and STOP
  messages remain unchanged. File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [ ] 3.2 Extend `uf_unleash_detect_resume`: quick branches
  treat clarify/plan/tasks/spec-review as done and probe
  `.uf/artifacts/unleash/<branch>.md` step markers for
  implement, code-review, retrospective, and demo. Add a
  marker-write helper for quick-tier progress. File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [ ] 3.3 [P] Tests: gate accepts quick/*, gate still STOPs on
  tier-named branches with missing artifacts, quick resume
  probing from the progress artifact. File:
  `.opencode/test/branch-gate.test.ts`,
  `.opencode/test/unleash-resume.test.ts`

## 4. Tier-Routing Skill

- [ ] 4.1 Create the skill with the routing rubric (speckit /
  openspec / quick definitions, scope signals), risk floors
  (security-sensitive, auth, data-loss, public-API-breaking →
  minimum openspec), issue-reference classification guidance
  (`#NNN`, gh issue URLs, `gh issue view` invocation, untrusted
  content rules), and the announcement format (tier, change
  name, rationale). File:
  `internal/scaffold/assets/opencode/skills/tier-routing/SKILL.md`

## 5. Command Rewrite

- [ ] 5.1 Add the routing step to the uf.unleash template:
  `$ARGUMENTS` description capture, issue-ref resolution
  guidance, dirty-tree guard, rubric invocation via the
  tier-routing skill, `uf_unleash_route_decision` call, and
  per-tier orchestration (speckit → delegate
  `speckit.specify.md` + gate re-run verification → clarify;
  openspec → delegate `opsx-propose.md` + gate re-run → spec
  review; quick → direct implement). Update the quick-tier
  pipeline path (skip clarify/plan/tasks/spec-review, keep
  implement → pre-flight → review → retrospective → demo) and
  the resumability step's quick branch. File:
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`

## 6. Finale and Review Council

- [ ] 6.1 [P] Support `quick/*` branches in the uf-finale
  plugin (PR creation, branch classification via the shared
  lib) and thread the originating issue number into the PR body
  (`Closes #N` when the route decision recorded one). Files:
  `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`
  and any finale command template that enumerates tiers.
- [ ] 6.2 [P] Quick-branch awareness in the review council
  command: quick tiers review in code mode (no spec artifact).
  File:
  `internal/scaffold/assets/opencode/commands/uf.review-council.md`
- [ ] 6.3 [P] Tests for finale quick-branch classification and
  issue threading. File: `.opencode/test/` (finale test file)

## 7. Docs

- [ ] 7.1 Update the website workflow documentation: routing
  section describing the three tiers and when `/uf.unleash`
  picks each, replacing manual tier-selection advice. File:
  `website/content/docs/common-workflows.md` (in the website
  repo)

## 8. Verification

- [ ] 8.1 Full `.opencode/test/` suite green via the
  repository's test command
- [ ] 8.2 `openspec validate --change unleash-tier-routing`
  passes
